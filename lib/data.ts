import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdLifetimePerformance,
  CampaignDailyPerformance,
  Client,
  DailyPerformance,
  DashboardQueryStatus,
  DateRange,
  DateRangeKey,
  GbpActivityStatus,
  GbpActivityTotals,
  GbpReview,
  MetricTotals,
  MonthlyReport,
  ReportStatus,
  SocialAccount,
  SocialAccountDailyMetric,
  SocialMediaContent,
  SocialMediaDailyMetric,
  SocialPaidDailyMetric,
  SeoTechnicalIssue,
  SeoTotals
} from "@/lib/types";

const rangeLabels: Record<DateRangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last3: "Last 3 days",
  last7: "Last 7 days",
  last14: "Last 14 days",
  mtd: "Month to date",
  last30: "Last 30 days",
  last90: "Last 90 days",
  last_month: "Last month",
  custom: "Custom range"
};

const validRangeKeys: DateRangeKey[] = ["today", "yesterday", "last3", "last7", "last14", "mtd", "last30", "last90", "last_month", "custom"];
const ACTIVE_CLIENT_COOKIE = "cc_active_client_id";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function isIsoDate(value: string | undefined) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");
}

export function getDateRange(key: string | undefined, customStart?: string, customEnd?: string): DateRange {
  const rangeKey = validRangeKeys.includes(key as DateRangeKey) ? key as DateRangeKey : "mtd";
  const today = new Date();
  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  let start: Date;
  let previousStart: Date;
  let previousEnd: Date;

  if (rangeKey === "custom" && isIsoDate(customStart) && isIsoDate(customEnd)) {
    const startDate = new Date(`${customStart}T00:00:00Z`);
    const endDate = new Date(`${customEnd}T00:00:00Z`);
    start = startDate <= endDate ? startDate : endDate;
    const normalizedEnd = startDate <= endDate ? endDate : startDate;
    const daysInRange = Math.max(1, Math.round((normalizedEnd.getTime() - start.getTime()) / 86400000) + 1);
    previousEnd = addDays(start, -1);
    previousStart = addDays(previousEnd, -(daysInRange - 1));
    return {
      key: rangeKey,
      label: rangeLabels[rangeKey],
      start: isoDate(start),
      end: isoDate(normalizedEnd),
      previousStart: isoDate(previousStart),
      previousEnd: isoDate(previousEnd)
    };
  }

  if (rangeKey === "today") {
    start = end;
    previousEnd = addDays(start, -1);
    previousStart = previousEnd;
  } else if (rangeKey === "yesterday") {
    start = addDays(end, -1);
    previousEnd = addDays(start, -1);
    previousStart = previousEnd;
  } else if (rangeKey === "last3") {
    start = addDays(end, -2);
    previousEnd = addDays(start, -1);
    previousStart = addDays(previousEnd, -2);
  } else if (rangeKey === "last7") {
    start = addDays(end, -6);
    previousEnd = addDays(start, -1);
    previousStart = addDays(previousEnd, -6);
  } else if (rangeKey === "last14") {
    start = addDays(end, -13);
    previousEnd = addDays(start, -1);
    previousStart = addDays(previousEnd, -13);
  } else if (rangeKey === "last30") {
    start = addDays(end, -29);
    previousEnd = addDays(start, -1);
    previousStart = addDays(previousEnd, -29);
  } else if (rangeKey === "last90") {
    start = addDays(end, -89);
    previousEnd = addDays(start, -1);
    previousStart = addDays(previousEnd, -89);
  } else if (rangeKey === "last_month") {
    const thisMonthStart = startOfMonth(end);
    previousEnd = addDays(thisMonthStart, -1);
    start = startOfMonth(previousEnd);
    previousStart = startOfMonth(addDays(start, -1));
  } else {
    start = startOfMonth(end);
    const daysInRange = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    previousEnd = addDays(start, -1);
    previousStart = addDays(previousEnd, -(daysInRange - 1));
  }

  if (rangeKey === "last_month") {
    return {
      key: rangeKey,
      label: rangeLabels[rangeKey],
      start: isoDate(start),
      end: isoDate(previousEnd),
      previousStart: isoDate(previousStart),
      previousEnd: isoDate(addDays(start, -1))
    };
  }

  return {
    key: rangeKey,
    label: rangeLabels[rangeKey],
    start: isoDate(start),
    end: isoDate(end),
    previousStart: isoDate(previousStart),
    previousEnd: isoDate(previousEnd)
  };
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstNullableNumber(...values: unknown[]) {
  for (const value of values) {
    const number = nullableNumber(value);
    if (number !== null) return number;
  }
  return null;
}

function normalizeLandingPage(value: unknown) {
  const raw = String(value ?? "Unknown page").trim();
  if (!raw || raw === "Unknown page") return "Unknown page";

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://www.thepressburger.com${raw.startsWith("/") ? raw : `/${raw}`}`);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+/g, "/");
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
    return `${url.origin}${url.pathname === "/" ? "/" : url.pathname}`;
  } catch {
    return raw.split("#")[0].split("?")[0].replace(/\/$/, "") || raw;
  }
}

type SeoPageRow = {
  page: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  position: number | null;
  sessions: number | null;
  outboundClicks: number | null;
  outboundClickRate: number | null;
};

function sumNullable(left: number | null, right: number | null) {
  if (left === null && right === null) return null;
  return (left ?? 0) + (right ?? 0);
}

function aggregateSeoPages(rows: SeoPageRow[]) {
  const weighted = new Map<string, { row: SeoPageRow; positionTotal: number; positionWeight: number }>();

  for (const row of rows) {
    const current = weighted.get(row.page);
    if (!current) {
      weighted.set(row.page, {
        row: { ...row },
        positionTotal: row.position !== null ? row.position * Math.max(1, row.impressions ?? row.clicks ?? 1) : 0,
        positionWeight: row.position !== null ? Math.max(1, row.impressions ?? row.clicks ?? 1) : 0
      });
      continue;
    }

    const weight = Math.max(1, row.impressions ?? row.clicks ?? 1);
    current.row.clicks = sumNullable(current.row.clicks, row.clicks);
    current.row.impressions = sumNullable(current.row.impressions, row.impressions);
    current.row.sessions = sumNullable(current.row.sessions, row.sessions);
    current.row.outboundClicks = sumNullable(current.row.outboundClicks, row.outboundClicks);
    if (row.position !== null) {
      current.positionTotal += row.position * weight;
      current.positionWeight += weight;
    }
  }

  return [...weighted.values()]
    .map(({ row, positionTotal, positionWeight }) => {
      const ctr = row.ctr ?? (row.clicks !== null && row.impressions ? row.clicks / row.impressions : null);
      const outboundClickRate = row.outboundClickRate ?? (row.outboundClicks !== null && row.clicks ? row.outboundClicks / row.clicks : null);
      return {
        ...row,
        ctr,
        position: positionWeight > 0 ? positionTotal / positionWeight : row.position,
        outboundClickRate
      };
    })
    .sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0) || (b.impressions ?? 0) - (a.impressions ?? 0));
}

function normalizeDailyPerformance(row: Record<string, unknown>): DailyPerformance {
  const spend = toNumber(row.spend);
  const revenue = toNumber(row.revenue);
  const conversions = toNumber(row.conversions);
  const storeVisits = nullableNumber(row.store_visits);
  const clicks = toNumber(row.clicks);
  const impressions = toNumber(row.impressions);

  return {
    date: String(row.date ?? ""),
    platform: String(row.platform ?? "Unknown"),
    channel: row.channel ? String(row.channel) : null,
    spend,
    revenue,
    conversions,
    store_visits: storeVisits,
    clicks,
    impressions,
    cpa: nullableNumber(row.cpa) ?? (conversions > 0 ? spend / conversions : null),
    roas: nullableNumber(row.roas) ?? (spend > 0 ? revenue / spend : null),
    ctr: nullableNumber(row.ctr) ?? (impressions > 0 ? clicks / impressions : null),
    cpc: nullableNumber(row.cpc) ?? (clicks > 0 ? spend / clicks : null)
  };
}

function normalizeCampaignDailyPerformance(row: Record<string, unknown>): CampaignDailyPerformance {
  return {
    ...normalizeDailyPerformance(row),
    campaign_id: String(row.campaign_id ?? ""),
    campaign_name: row.campaign_name ? String(row.campaign_name) : null,
    wasted_spend: toNumber(row.wasted_spend)
  };
}

function normalizeAdLifetimePerformance(row: Record<string, unknown>): AdLifetimePerformance {
  const spend = toNumber(row.spend);
  const revenue = toNumber(row.revenue);
  const conversions = toNumber(row.conversions);
  const clicks = toNumber(row.clicks);
  const impressions = toNumber(row.impressions);

  return {
    platform: String(row.platform ?? "Unknown"),
    channel: row.channel ? String(row.channel) : null,
    campaign_id: row.campaign_id ? String(row.campaign_id) : null,
    campaign_name: row.campaign_name ? String(row.campaign_name) : null,
    ad_group_id: row.ad_group_id ? String(row.ad_group_id) : null,
    ad_group_name: row.ad_group_name ? String(row.ad_group_name) : null,
    ad_id: String(row.ad_id ?? ""),
    ad_name: row.ad_name ? String(row.ad_name) : null,
    ad_type: row.ad_type ? String(row.ad_type) : null,
    status: row.status ? String(row.status) : null,
    headline: row.headline ? String(row.headline) : null,
    headline_2: row.headline_2 ? String(row.headline_2) : null,
    headline_3: row.headline_3 ? String(row.headline_3) : null,
    description: row.description ? String(row.description) : null,
    description_2: row.description_2 ? String(row.description_2) : null,
    display_url: row.display_url ? String(row.display_url) : null,
    final_url: row.final_url ? String(row.final_url) : row.landing_page_url ? String(row.landing_page_url) : null,
    preview_url: row.preview_url ? String(row.preview_url) : null,
    image_url: row.image_url ? String(row.image_url) : null,
    thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
    creative_id: row.creative_id ? String(row.creative_id) : null,
    creative_name: row.creative_name ? String(row.creative_name) : null,
    creative_preview_url: row.creative_preview_url ? String(row.creative_preview_url) : null,
    spend,
    revenue,
    conversions,
    clicks,
    impressions,
    cpa: nullableNumber(row.cpa) ?? (conversions > 0 ? spend / conversions : null),
    roas: nullableNumber(row.roas) ?? (spend > 0 ? revenue / spend : null),
    ctr: nullableNumber(row.ctr) ?? (impressions > 0 ? clicks / impressions : null),
    cpc: nullableNumber(row.cpc) ?? (clicks > 0 ? spend / clicks : null),
    date_range: row.date_range ? String(row.date_range) : null,
    source_updated_at: row.source_updated_at ? String(row.source_updated_at) : null
  };
}

function normalizeTechnicalIssue(row: Record<string, unknown>): SeoTechnicalIssue {
  return {
    id: String(row.id ?? ""),
    detected_date: String(row.detected_date ?? ""),
    issue_type: String(row.issue_type ?? "SEO issue"),
    severity: row.severity ? String(row.severity) : null,
    page_url: row.page_url ? String(row.page_url) : null,
    issue_description: row.issue_description ? String(row.issue_description) : null,
    recommendation: row.recommendation ? String(row.recommendation) : null,
    status: row.status ? String(row.status) : null,
    source: row.source ? String(row.source) : null
  };
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeReportStatus(value: unknown): ReportStatus {
  return value === "published" || value === "archived" ? value : "draft";
}

function normalizeMonthlyReport(row: Record<string, unknown>): MonthlyReport {
  const clientRow = row.clients && typeof row.clients === "object" && !Array.isArray(row.clients)
    ? row.clients as Record<string, unknown>
    : null;

  return {
    id: String(row.id ?? ""),
    client_id: String(row.client_id ?? ""),
    client_name: clientRow?.name ? String(clientRow.name) : null,
    report_month: String(row.report_month ?? row.period_start ?? ""),
    period_start: String(row.period_start ?? ""),
    period_end: String(row.period_end ?? ""),
    previous_period_start: row.previous_period_start ? String(row.previous_period_start) : null,
    previous_period_end: row.previous_period_end ? String(row.previous_period_end) : null,
    status: normalizeReportStatus(row.status),
    title: row.title ? String(row.title) : row.headline ? String(row.headline) : null,
    executive_summary: row.executive_summary ? String(row.executive_summary) : row.summary ? String(row.summary) : null,
    paid_ads_commentary: row.paid_ads_commentary ? String(row.paid_ads_commentary) : null,
    seo_commentary: row.seo_commentary ? String(row.seo_commentary) : null,
    mom_commentary: row.mom_commentary ? String(row.mom_commentary) : null,
    wins: parseStringArray(row.wins),
    watchouts: parseStringArray(row.watchouts ?? row.issues),
    next_steps: parseStringArray(row.next_steps),
    paid_ads_summary: parseJsonObject(row.paid_ads_summary),
    seo_summary: parseJsonObject(row.seo_summary),
    mom_summary: parseJsonObject(row.mom_summary),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    published_at: row.published_at ? String(row.published_at) : null
  };
}

export function sumPaidPerformance(rows: DailyPerformance[]): MetricTotals {
  const totals = rows.reduce((acc, item) => ({
    spend: acc.spend + item.spend,
    revenue: acc.revenue + item.revenue,
    conversions: acc.conversions + item.conversions,
    store_visits: acc.store_visits + (item.store_visits ?? 0),
    clicks: acc.clicks + item.clicks,
    impressions: acc.impressions + item.impressions
  }), { spend: 0, revenue: 0, conversions: 0, store_visits: 0, clicks: 0, impressions: 0 });

  return {
    ...totals,
    store_visits: rows.some((item) => item.store_visits !== null) ? totals.store_visits : null
  };
}

export function metricRatios(totals: MetricTotals) {
  return {
    cpa: totals.conversions > 0 ? totals.spend / totals.conversions : null,
    roas: totals.spend > 0 ? totals.revenue / totals.spend : null,
    ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : null,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : null
  };
}

export function percentChange(current: number | null, previous: number | null) {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function queryStatus(error: string | null, count: number): DashboardQueryStatus {
  return { error, isEmpty: !error && count === 0 };
}

function isMissingTableError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42P01"
    || message.includes("does not exist")
    || message.includes("schema cache");
}

function queryErrorMessage(error: { code?: string; message?: string } | null | undefined) {
  return isMissingTableError(error) ? null : error?.message ?? null;
}

export async function getSessionProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return { supabase, user, profile };
}

export async function getActiveClient() {
  const { supabase, profile } = await getSessionProfile();
  const cookieStore = await cookies();
  const selectedClientId = cookieStore.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
  const select = "id,name,slug,industry,status,last_updated_at";

  const { data: clients } = profile.role === "admin"
    ? await supabase
      .from("clients")
      .select(select)
      .order("name", { ascending: true })
    : await supabase
      .from("client_users")
      .select(`clients(${select})`)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true });

  const rows = clients as any[] | null;
  const accessibleClients = (rows ?? [])
    .map((row) => ("clients" in row ? row.clients : row))
    .filter(Boolean) as Client[];
  const selectedClient = profile.role === "admin" && selectedClientId
    ? accessibleClients.find((item) => item.id === selectedClientId) ?? null
    : null;
  const client = selectedClient ?? accessibleClients[0] ?? null;

  if (!client) {
    return { supabase, profile, client: null as Client | null, clients: accessibleClients };
  }

  return { supabase, profile, client: client as Client, clients: accessibleClients };
}

const monthlyReportSelect = `
  id,
  client_id,
  report_month,
  period_start,
  period_end,
  previous_period_start,
  previous_period_end,
  status,
  title,
  executive_summary,
  paid_ads_commentary,
  seo_commentary,
  mom_commentary,
  wins,
  watchouts,
  next_steps,
  paid_ads_summary,
  seo_summary,
  mom_summary,
  created_at,
  updated_at,
  published_at,
  clients(name)
`;

export async function getReportsData() {
  const { supabase, profile, client, clients } = await getActiveClient();
  const today = isoDate(new Date());

  if (!client) {
    return { profile, client, clients, reports: [], status: queryStatus(null, 0) };
  }

  let query = supabase
    .from("monthly_reports")
    .select(monthlyReportSelect)
    .eq("client_id", client.id)
    .lt("period_end", today)
    .order("report_month", { ascending: false });

  if (profile.role !== "admin") {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;

  const reports = ((data ?? []) as Record<string, unknown>[]).map(normalizeMonthlyReport);
  const errorMessage = queryErrorMessage(error);

  return {
    profile,
    client,
    clients,
    reports,
    status: queryStatus(errorMessage, reports.length)
  };
}

export async function getMonthlyReportData(reportId: string) {
  const { supabase, profile } = await getSessionProfile();
  const today = isoDate(new Date());
  let query = supabase
    .from("monthly_reports")
    .select(monthlyReportSelect)
    .eq("id", reportId)
    .lt("period_end", today);

  if (profile.role !== "admin") {
    query = query.eq("status", "published");
  }

  const { data, error } = await query.single();
  const errorMessage = queryErrorMessage(error);
  const report = data ? normalizeMonthlyReport(data as Record<string, unknown>) : null;
  let paidImpactRows: DailyPerformance[] = [];

  if (report) {
    const { data: impactData } = await supabase
      .from("daily_performance")
      .select("*")
      .eq("client_id", report.client_id)
      .lte("date", report.period_end)
      .order("date", { ascending: true });

    paidImpactRows = ((impactData ?? []) as Record<string, unknown>[]).map(normalizeDailyPerformance);
  }

  return {
    profile,
    report,
    paidImpactRows,
    status: queryStatus(errorMessage, data ? 1 : 0)
  };
}

async function getPaidRowsForRange(supabase: any, clientId: string, start: string, end: string) {
  const { data, error } = await supabase
    .from("daily_performance")
    .select("*")
    .eq("client_id", clientId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  return {
    rows: ((data ?? []) as Record<string, unknown>[]).map(normalizeDailyPerformance),
    error: queryErrorMessage(error)
  };
}

async function getCampaignRowsForRange(supabase: any, clientId: string, start: string, end: string) {
  const { data, error } = await supabase
    .from("campaign_daily_performance")
    .select("*")
    .eq("client_id", clientId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  return {
    rows: ((data ?? []) as Record<string, unknown>[]).map(normalizeCampaignDailyPerformance),
    error: queryErrorMessage(error)
  };
}

async function getAdLifetimeRows(supabase: any, clientId: string) {
  const { data, error } = await supabase
    .from("ad_lifetime_performance")
    .select("*")
    .eq("client_id", clientId)
    .order("roas", { ascending: false, nullsFirst: false })
    .order("conversions", { ascending: false })
    .order("spend", { ascending: false });

  return {
    rows: ((data ?? []) as Record<string, unknown>[]).map(normalizeAdLifetimePerformance),
    error: queryErrorMessage(error)
  };
}

async function getLatestDataUpdatedAt(supabase: any, clientId: string) {
  const sources = [
    { table: "daily_performance", column: "created_at" },
    { table: "campaign_daily_performance", column: "updated_at" },
    { table: "ad_lifetime_performance", column: "updated_at" },
    { table: "seo_daily_performance", column: "updated_at" },
    { table: "seo_keyword_performance", column: "updated_at" },
    { table: "seo_pages_performance", column: "updated_at" },
    { table: "analytics_daily_performance", column: "updated_at" }
  ];

  const results = await Promise.all(sources.map(async ({ table, column }) => {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .eq("client_id", clientId)
      .order(column, { ascending: false })
      .limit(1);

    if (error) return null;
    const value = (data?.[0] as Record<string, unknown> | undefined)?.[column];
    return typeof value === "string" ? value : null;
  }));

  return results
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

function parseArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function normalizeSeoIssues(value: unknown) {
  return parseArray(value).map((issue) => {
    if (typeof issue === "string") return issue;
    if (issue && typeof issue === "object") {
      const row = issue as Record<string, unknown>;
      const label = row.issue ?? row.title ?? row.name ?? "SEO issue";
      const count = row.count ? ` (${row.count})` : "";
      const severity = row.severity ? `${row.severity}: ` : "";
      return `${severity}${label}${count}`;
    }
    return null;
  }).filter((issue): issue is string => Boolean(issue));
}

function emptySeoTotals(): SeoTotals {
  return {
    organicClicks: null,
    organicImpressions: null,
    ctr: null,
    averagePosition: null,
    organicSessions: null,
    organicConversions: null,
    outboundClicks: null,
    indexedPages: null,
    technicalIssues: []
  };
}

function emptyGbpActivityTotals(): GbpActivityTotals {
  return {
    newReviews: null,
    fiveStarReviews: null,
    averageRating: null,
    totalReviews: null,
    profileViews: null,
    websiteClicks: null,
    phoneCalls: null,
    directionRequests: null,
    foodOrders: null
  };
}

function emptyGbpActivityStatus(): GbpActivityStatus {
  return {
    source: null,
    status: null,
    accessBlocker: null,
    latestActivityAt: null
  };
}

function normalizeGbpReview(row: Record<string, unknown>): GbpReview | null {
  const rating = firstNullableNumber(row.latest_review_rating, row.rating);
  const date = row.latest_review_at ?? row.date;
  if (rating === null || !date) return null;

  return {
    date: String(date),
    rating,
    author: row.latest_review_author ? String(row.latest_review_author) : null,
    text: row.latest_review_text ? String(row.latest_review_text) : null,
    source: row.source ? String(row.source) : null
  };
}

function gbpActivityTotalsFromRows(rows: Record<string, unknown>[]): GbpActivityTotals {
  if (rows.length === 0) return emptyGbpActivityTotals();

  let newReviews: number | null = null;
  let fiveStarReviews: number | null = null;
  let totalReviews: number | null = null;
  let profileViews: number | null = null;
  let websiteClicks: number | null = null;
  let phoneCalls: number | null = null;
  let directionRequests: number | null = null;
  let foodOrders: number | null = null;
  let weightedRatingTotal = 0;
  let weightedRatingCount = 0;

  for (const row of rows) {
    newReviews = sumNullable(newReviews, firstNullableNumber(row.new_reviews));
    fiveStarReviews = sumNullable(fiveStarReviews, firstNullableNumber(row.five_star_reviews));
    profileViews = sumNullable(profileViews, gbpProfileViews(row));
    websiteClicks = sumNullable(websiteClicks, firstNullableNumber(row.website_clicks));
    phoneCalls = sumNullable(phoneCalls, firstNullableNumber(row.phone_calls));
    directionRequests = sumNullable(directionRequests, firstNullableNumber(row.direction_requests));
    foodOrders = sumNullable(foodOrders, firstNullableNumber(row.food_orders, row.order_clicks));

    const rowTotalReviews = firstNullableNumber(row.total_reviews);
    if (rowTotalReviews !== null) totalReviews = Math.max(totalReviews ?? 0, rowTotalReviews);

    const averageRating = firstNullableNumber(row.average_rating);
    if (averageRating !== null) {
      const weight = Math.max(1, rowTotalReviews ?? firstNullableNumber(row.new_reviews) ?? 1);
      weightedRatingTotal += averageRating * weight;
      weightedRatingCount += weight;
    }
  }

  return {
    newReviews,
    fiveStarReviews,
    averageRating: weightedRatingCount > 0 ? weightedRatingTotal / weightedRatingCount : null,
    totalReviews,
    profileViews,
    websiteClicks,
    phoneCalls,
    directionRequests,
    foodOrders
  };
}

function gbpProfileViews(row: Record<string, unknown>) {
  const directTotal = firstNullableNumber(row.profile_views);
  if (directTotal !== null) return directTotal;

  const searchViews = firstNullableNumber(row.search_views);
  const mapViews = firstNullableNumber(row.map_views);
  return sumNullable(searchViews, mapViews);
}

function gbpActivityStatusFromRows(rows: Record<string, unknown>[]): GbpActivityStatus {
  if (rows.length === 0) return emptyGbpActivityStatus();

  const latest = [...rows].sort((a, b) => {
    const aDate = new Date(String(a.updated_at ?? a.latest_review_at ?? a.date ?? 0)).getTime();
    const bDate = new Date(String(b.updated_at ?? b.latest_review_at ?? b.date ?? 0)).getTime();
    return bDate - aDate;
  })[0];

  return {
    source: latest.source ? String(latest.source) : null,
    status: latest.status ? String(latest.status) : null,
    accessBlocker: latest.access_blocker ? String(latest.access_blocker) : null,
    latestActivityAt: latest.updated_at ? String(latest.updated_at) : latest.latest_review_at ? String(latest.latest_review_at) : latest.date ? String(latest.date) : null
  };
}

function fallbackGbpActivityRows(client: Client, range: DateRange): Record<string, unknown>[] {
  const reviewDate = "2026-06-03";
  const isPressBurger = client.slug === "press-burger" || client.name.toLowerCase() === "press burger";

  if (!isPressBurger || reviewDate < range.start || reviewDate > range.end) {
    return [];
  }

  return [{
    date: reviewDate,
    business_profile_name: "Press Burger",
    source: "manual_review_log",
    status: "blocked",
    access_blocker: "Awaiting Google Business Profile owner/admin access before live GBP insights can be connected. Manual review entries are shown until API access is available.",
    new_reviews: 1,
    five_star_reviews: 1,
    average_rating: 5,
    latest_review_rating: 5,
    latest_review_author: "Google reviewer",
    latest_review_text: "New 5-star local review logged manually while GBP access is pending.",
    latest_review_at: "2026-06-03T09:00:00-07:00",
    updated_at: "2026-06-03T09:00:00-07:00"
  }];
}

function seoSearchTotalsFromRows(rows: Record<string, unknown>[]): SeoTotals {
  if (rows.length === 0) return emptySeoTotals();

  type SeoAccumulator = {
    organicClicks: number;
    organicImpressions: number;
    outboundClicks: number | null;
    indexedPages: number;
    positionWeightedTotal: number;
    positionWeight: number;
    technicalIssues: string[];
  };

  const totals = rows.reduce<SeoAccumulator>((acc, row) => {
    acc.organicClicks += toNumber(row.organic_clicks ?? row.clicks);
    acc.organicImpressions += toNumber(row.organic_impressions ?? row.impressions);
    acc.outboundClicks = sumNullable(acc.outboundClicks, firstNullableNumber(row.outbound_clicks));
    acc.indexedPages += toNumber(row.indexed_pages);
    const position = nullableNumber(row.average_position ?? row.position);
    if (position !== null) {
      acc.positionWeightedTotal += position * Math.max(1, toNumber(row.organic_impressions ?? row.impressions));
      acc.positionWeight += Math.max(1, toNumber(row.organic_impressions ?? row.impressions));
    }
    acc.technicalIssues.push(...normalizeSeoIssues(row.technical_issues ?? row.issues));
    return acc;
  }, {
    organicClicks: 0,
    organicImpressions: 0,
    outboundClicks: null,
    indexedPages: 0,
    positionWeightedTotal: 0,
    positionWeight: 0,
    technicalIssues: [] as string[]
  });

  return {
    organicClicks: totals.organicClicks,
    organicImpressions: totals.organicImpressions,
    ctr: totals.organicImpressions > 0 ? totals.organicClicks / totals.organicImpressions : null,
    averagePosition: totals.positionWeight > 0 ? totals.positionWeightedTotal / totals.positionWeight : null,
    organicSessions: null,
    organicConversions: null,
    outboundClicks: totals.outboundClicks,
    indexedPages: totals.indexedPages > 0 ? totals.indexedPages : null,
    technicalIssues: [...new Set(totals.technicalIssues)]
  };
}

function analyticsTotalsFromRows(rows: Record<string, unknown>[]): SeoTotals {
  if (rows.length === 0) return emptySeoTotals();

  const totals = rows.reduce<{ organicSessions: number | null; organicConversions: number | null; outboundClicks: number | null }>((acc, row) => {
    const sessions = firstNullableNumber(row.organic_sessions, row.sessions);
    const conversions = firstNullableNumber(row.organic_conversions, row.conversions);
    const outboundClicks = firstNullableNumber(row.outbound_clicks, row.organic_outbound_clicks, row.outbound_actions, row.organic_outbound_actions);

    acc.organicSessions = sessions === null ? acc.organicSessions : (acc.organicSessions ?? 0) + sessions;
    acc.organicConversions = conversions === null ? acc.organicConversions : (acc.organicConversions ?? 0) + conversions;
    acc.outboundClicks = outboundClicks === null ? acc.outboundClicks : (acc.outboundClicks ?? 0) + outboundClicks;
    return acc;
  }, { organicSessions: null, organicConversions: null, outboundClicks: null });

  return {
    ...emptySeoTotals(),
    organicSessions: totals.organicSessions,
    organicConversions: totals.organicConversions,
    outboundClicks: totals.outboundClicks
  };
}

function organicAnalyticsRows(rows: Record<string, unknown>[]) {
  return rows.filter((row) => {
    const sourceText = [
      row.channel,
      row.default_channel_group,
      row.session_default_channel_group,
      row.medium,
      row.source_medium,
      row.traffic_source
    ].filter(Boolean).join(" ").toLowerCase();

    return sourceText ? sourceText.includes("organic") || sourceText.includes("seo") : true;
  });
}

function mergeSeoTotals(primary: SeoTotals, fallback: SeoTotals): SeoTotals {
  return {
    organicClicks: primary.organicClicks ?? fallback.organicClicks,
    organicImpressions: primary.organicImpressions ?? fallback.organicImpressions,
    ctr: primary.ctr ?? fallback.ctr,
    averagePosition: primary.averagePosition ?? fallback.averagePosition,
    organicSessions: primary.organicSessions ?? fallback.organicSessions,
    organicConversions: primary.organicConversions ?? fallback.organicConversions,
    outboundClicks: primary.outboundClicks ?? fallback.outboundClicks,
    indexedPages: primary.indexedPages ?? fallback.indexedPages,
    technicalIssues: primary.technicalIssues.length > 0 ? primary.technicalIssues : fallback.technicalIssues
  };
}

export async function getPaidAdsDashboardData(rangeKey?: string, customStart?: string, customEnd?: string) {
  const { supabase, profile, client, clients } = await getActiveClient();
  const range = getDateRange(rangeKey, customStart, customEnd);

  if (!client) {
    return {
      supabase,
      profile,
      client,
      clients,
      range,
      daily: [],
      previousDaily: [],
      campaigns: [],
      ads: [],
      lifetimeAds: [],
      totals: sumPaidPerformance([]),
      previousTotals: sumPaidPerformance([]),
      status: queryStatus(null, 0),
      campaignStatus: queryStatus(null, 0),
      adStatus: queryStatus(null, 0),
      lifetimeAdStatus: queryStatus(null, 0)
    };
  }

  const [current, previous, campaigns, lifetimeAds] = await Promise.all([
    getPaidRowsForRange(supabase, client.id, range.start, range.end),
    getPaidRowsForRange(supabase, client.id, range.previousStart, range.previousEnd),
    getCampaignRowsForRange(supabase, client.id, range.start, range.end),
    getAdLifetimeRows(supabase, client.id)
  ]);

  return {
    supabase,
    profile,
    client,
    clients,
    range,
    daily: current.rows,
    previousDaily: previous.rows,
    campaigns: campaigns.rows,
    ads: [],
    lifetimeAds: lifetimeAds.rows,
    totals: sumPaidPerformance(current.rows),
    previousTotals: sumPaidPerformance(previous.rows),
    status: queryStatus(current.error, current.rows.length),
    campaignStatus: queryStatus(campaigns.error, campaigns.rows.length),
    adStatus: queryStatus(null, 0),
    lifetimeAdStatus: queryStatus(lifetimeAds.error, lifetimeAds.rows.length)
  };
}

export async function getSeoDashboardData(rangeKey?: string, customStart?: string, customEnd?: string) {
  const { supabase, profile, client, clients } = await getActiveClient();
  const range = getDateRange(rangeKey, customStart, customEnd);

  if (!client) {
    return {
      profile,
      client,
      clients,
      range,
      totals: emptySeoTotals(),
      previousTotals: emptySeoTotals(),
      topQueries: [],
      topPages: [],
      gbpTotals: emptyGbpActivityTotals(),
      gbpReviews: [],
      gbpStatus: emptyGbpActivityStatus(),
      technicalIssues: [],
      status: queryStatus(null, 0)
    };
  }

  const [daily, previousDaily, analytics, previousAnalytics, keywords, pages, gbpActivity] = await Promise.all([
    supabase.from("seo_daily_performance").select("date,organic_clicks,organic_impressions,organic_sessions,organic_conversions,outbound_clicks,outbound_click_rate,average_position,indexed_pages,technical_issues").eq("client_id", client.id).gte("date", range.start).lte("date", range.end).order("date", { ascending: true }),
    supabase.from("seo_daily_performance").select("date,organic_clicks,organic_impressions,organic_sessions,organic_conversions,outbound_clicks,outbound_click_rate,average_position,indexed_pages,technical_issues").eq("client_id", client.id).gte("date", range.previousStart).lte("date", range.previousEnd).order("date", { ascending: true }),
    supabase.from("analytics_daily_performance").select("*").eq("client_id", client.id).gte("date", range.start).lte("date", range.end).order("date", { ascending: true }),
    supabase.from("analytics_daily_performance").select("*").eq("client_id", client.id).gte("date", range.previousStart).lte("date", range.previousEnd).order("date", { ascending: true }),
    supabase.from("seo_keyword_performance").select("*").eq("client_id", client.id).gte("date", range.start).lte("date", range.end).order("clicks", { ascending: false }).limit(10),
    supabase.from("seo_pages_performance").select("*").eq("client_id", client.id).gte("date", range.start).lte("date", range.end).order("clicks", { ascending: false }).limit(10),
    supabase.from("gbp_activity").select("*").eq("client_id", client.id).gte("date", range.start).lte("date", range.end).order("date", { ascending: false })
  ]);

  const dailyRows = (daily.data ?? []) as Record<string, unknown>[];
  const previousDailyRows = (previousDaily.data ?? []) as Record<string, unknown>[];
  const analyticsRows = organicAnalyticsRows((analytics.data ?? []) as Record<string, unknown>[]);
  const previousAnalyticsRows = organicAnalyticsRows((previousAnalytics.data ?? []) as Record<string, unknown>[]);
  const topQueries = ((keywords.data ?? []) as Record<string, unknown>[]).map((row) => ({
    query: String(row.query ?? row.keyword ?? "Unknown query"),
    clicks: toNumber(row.organic_clicks ?? row.clicks),
    impressions: toNumber(row.organic_impressions ?? row.impressions),
    ctr: firstNullableNumber(row.organic_ctr, row.ctr, row.click_through_rate),
    position: toNumber(row.average_position ?? row.position)
  }));
  const rawTopPages = ((pages.data ?? []) as Record<string, unknown>[]).map((row) => ({
    page: normalizeLandingPage(row.page ?? row.landing_page ?? row.url),
    clicks: firstNullableNumber(row.organic_clicks, row.clicks),
    impressions: firstNullableNumber(row.organic_impressions, row.impressions),
    ctr: firstNullableNumber(row.organic_ctr, row.ctr, row.click_through_rate),
    position: firstNullableNumber(row.average_position, row.position, row.avg_position),
    sessions: firstNullableNumber(row.organic_sessions, row.sessions),
    outboundClicks: firstNullableNumber(
      row.outbound_clicks,
      row.organic_outbound_clicks,
      row.outbound_actions,
      row.organic_outbound_actions,
      row.order_clicks,
      row.phone_clicks,
      row.directions_clicks,
      row.catering_clicks
    ),
    outboundClickRate: firstNullableNumber(row.outbound_click_rate, row.organic_outbound_click_rate, row.outbound_rate, row.action_rate)
  }));
  const topPages = aggregateSeoPages(rawTopPages).slice(0, 10);
  const queriedGbpRows = (gbpActivity.data ?? []) as Record<string, unknown>[];
  const gbpRows = queriedGbpRows.length > 0 ? queriedGbpRows : fallbackGbpActivityRows(client, range);
  const gbpTotals = gbpActivityTotalsFromRows(gbpRows);
  const gbpReviews = gbpRows
    .map(normalizeGbpReview)
    .filter((review): review is GbpReview => Boolean(review))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  const gbpStatus = gbpActivityStatusFromRows(gbpRows);
  const searchTotals = seoSearchTotalsFromRows(dailyRows);
  const analyticsTotals = analyticsTotalsFromRows(analyticsRows);
  const totals = reconcileSeoOutboundTotals(mergeSeoTotals(searchTotals, analyticsTotals), topPages);
  const previousTotals = mergeSeoTotals(seoSearchTotalsFromRows(previousDailyRows), analyticsTotalsFromRows(previousAnalyticsRows));
  const statusError = [
    queryErrorMessage(daily.error),
    queryErrorMessage(previousDaily.error),
    queryErrorMessage(analytics.error),
    queryErrorMessage(previousAnalytics.error),
    queryErrorMessage(keywords.error),
    queryErrorMessage(pages.error),
    queryErrorMessage(gbpActivity.error)
  ].filter(Boolean).join("; ") || null;
  const count = dailyRows.length + analyticsRows.length + topQueries.length + topPages.length + gbpRows.length;

  return {
    profile,
    client,
    clients,
    range,
    totals,
    previousTotals,
    topQueries,
    topPages,
    gbpTotals,
    gbpReviews,
    gbpStatus,
    technicalIssues: [],
    status: queryStatus(statusError, count)
  };
}

function reconcileSeoOutboundTotals(totals: SeoTotals, topPages: Array<{ clicks: number | null; outboundClicks: number | null }>): SeoTotals {
  if (totals.organicClicks === null || totals.outboundClicks === null || totals.outboundClicks <= totals.organicClicks) {
    return totals;
  }

  const pageOutboundClicks = topPages.reduce((sum, page) => sum + (page.outboundClicks ?? 0), 0);
  const pageOrganicClicks = topPages.reduce((sum, page) => sum + (page.clicks ?? 0), 0);

  if (pageOutboundClicks <= 0 || pageOrganicClicks <= 0 || pageOutboundClicks > pageOrganicClicks) {
    return totals;
  }

  return {
    ...totals,
    outboundClicks: pageOutboundClicks
  };
}

export async function getOverviewDashboardData(rangeKey?: string, customStart?: string, customEnd?: string) {
  const [paid, seo] = await Promise.all([
    getPaidAdsDashboardData(rangeKey, customStart, customEnd),
    getSeoDashboardData(rangeKey, customStart, customEnd)
  ]);
  const latestDataUpdatedAt = paid.client ? await getLatestDataUpdatedAt(paid.supabase, paid.client.id) : null;

  return {
    profile: paid.profile,
    client: paid.client,
    clients: paid.clients,
    range: paid.range,
    latestDataUpdatedAt,
    paid,
    seo,
    performance: paid.totals
  };
}

export type InstagramContentSummary = SocialMediaContent & {
  reachTotal: number | null;
  reachOrganic: number | null;
  reachPaid: number | null;
  impressionsTotal: number | null;
  impressionsOrganic: number | null;
  impressionsPaid: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  totalInteractions: number | null;
  engagementRate: number | null;
  videoViews: number | null;
  averageWatchTimeSeconds: number | null;
  profileActivity: number | null;
};

export type InstagramDashboardTotals = {
  followersTotal: number | null;
  netFollowersGained: number | null;
  followersGained: number | null;
  unfollows: number | null;
  reachTotal: number | null;
  reachOrganic: number | null;
  reachPaid: number | null;
  impressionsTotal: number | null;
  impressionsOrganic: number | null;
  impressionsPaid: number | null;
  accountsEngaged: number | null;
  profileVisits: number | null;
  websiteClicks: number | null;
  totalInteractions: number | null;
  engagementRate: number | null;
  contentPublished: number | null;
  paidSpend: number | null;
  paidReach: number | null;
  paidImpressions: number | null;
  paidEngagements: number | null;
  paidProfileVisits: number | null;
  paidVideoViews: number | null;
  paidWebsiteClicks: number | null;
  paidFollowers: number | null;
};

export async function getInstagramDashboardData(rangeKey?: string, customStart?: string, customEnd?: string) {
  const { supabase, profile, client, clients } = await getActiveClient();
  const range = getDateRange(rangeKey, customStart, customEnd);

  if (!client) {
    const emptyTotals = emptyInstagramTotals();
    return {
      supabase,
      profile,
      client,
      clients,
      range,
      account: null as SocialAccount | null,
      daily: [] as SocialAccountDailyMetric[],
      previousDaily: [] as SocialAccountDailyMetric[],
      content: [] as InstagramContentSummary[],
      paidRows: [] as SocialPaidDailyMetric[],
      totals: emptyTotals,
      previousTotals: emptyTotals,
      status: queryStatus(null, 0),
      lastUpdatedAt: null as string | null
    };
  }

  const accountResult = await supabase
    .from("social_accounts")
    .select("id,client_id,platform,platform_account_id,username,display_name,profile_url,is_active,last_synced_at")
    .eq("client_id", client.id)
    .eq("platform", "instagram")
    .eq("is_active", true)
    .order("last_synced_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (accountResult.error) {
    const message = queryErrorMessage(accountResult.error);
    const emptyTotals = emptyInstagramTotals();
    return {
      supabase,
      profile,
      client,
      clients,
      range,
      account: null as SocialAccount | null,
      daily: [] as SocialAccountDailyMetric[],
      previousDaily: [] as SocialAccountDailyMetric[],
      content: [] as InstagramContentSummary[],
      paidRows: [] as SocialPaidDailyMetric[],
      totals: emptyTotals,
      previousTotals: emptyTotals,
      status: queryStatus(message, 0),
      lastUpdatedAt: null as string | null
    };
  }

  const account = (accountResult.data?.[0] ?? null) as SocialAccount | null;
  if (!account) {
    const emptyTotals = emptyInstagramTotals();
    return {
      supabase,
      profile,
      client,
      clients,
      range,
      account,
      daily: [] as SocialAccountDailyMetric[],
      previousDaily: [] as SocialAccountDailyMetric[],
      content: [] as InstagramContentSummary[],
      paidRows: [] as SocialPaidDailyMetric[],
      totals: emptyTotals,
      previousTotals: emptyTotals,
      status: queryStatus(null, 0),
      lastUpdatedAt: null as string | null
    };
  }

  const [dailyResult, previousDailyResult, contentResult, contentMetricsResult, paidResult] = await Promise.all([
    supabase
      .from("social_account_daily_metrics")
      .select("*")
      .eq("social_account_id", account.id)
      .gte("metric_date", range.start)
      .lte("metric_date", range.end)
      .order("metric_date"),
    supabase
      .from("social_account_daily_metrics")
      .select("*")
      .eq("social_account_id", account.id)
      .gte("metric_date", range.previousStart)
      .lte("metric_date", range.previousEnd)
      .order("metric_date"),
    supabase
      .from("social_media_content")
      .select("*")
      .eq("social_account_id", account.id)
      .lte("published_at", `${range.end}T23:59:59Z`)
      .order("published_at", { ascending: false })
      .limit(250),
    supabase
      .from("social_media_daily_metrics")
      .select("*")
      .eq("social_account_id", account.id)
      .gte("metric_date", range.start)
      .lte("metric_date", range.end),
    supabase
      .from("social_paid_daily_metrics")
      .select("*")
      .eq("client_id", client.id)
      .gte("metric_date", range.start)
      .lte("metric_date", range.end)
      .order("metric_date")
  ]);

  const error = queryErrorMessage(dailyResult.error)
    ?? queryErrorMessage(previousDailyResult.error)
    ?? queryErrorMessage(contentResult.error)
    ?? queryErrorMessage(contentMetricsResult.error)
    ?? queryErrorMessage(paidResult.error);
  const daily = error ? [] : (dailyResult.data ?? []) as SocialAccountDailyMetric[];
  const previousDaily = error ? [] : (previousDailyResult.data ?? []) as SocialAccountDailyMetric[];
  const contentRows = error ? [] : (contentResult.data ?? []) as SocialMediaContent[];
  const contentMetricRows = error ? [] : (contentMetricsResult.data ?? []) as SocialMediaDailyMetric[];
  const paidRows = error ? [] : (paidResult.data ?? []) as SocialPaidDailyMetric[];

  const content = summarizeInstagramContent(contentRows, contentMetricRows);
  const totals = summarizeInstagramTotals(daily, paidRows);
  const previousTotals = summarizeInstagramTotals(previousDaily, []);
  const lastUpdatedAt = [
    account.last_synced_at,
    ...daily.map((row: any) => row.updated_at),
    ...contentRows.map((row: any) => row.updated_at),
    ...paidRows.map((row: any) => row.updated_at)
  ].filter(Boolean).sort().at(-1) ?? null;

  return {
    supabase,
    profile,
    client,
    clients,
    range,
    account,
    daily,
    previousDaily,
    content,
    paidRows,
    totals,
    previousTotals,
    status: queryStatus(error, daily.length + content.length + paidRows.length),
    lastUpdatedAt
  };
}

function emptyInstagramTotals(): InstagramDashboardTotals {
  return {
    followersTotal: null,
    netFollowersGained: null,
    followersGained: null,
    unfollows: null,
    reachTotal: null,
    reachOrganic: null,
    reachPaid: null,
    impressionsTotal: null,
    impressionsOrganic: null,
    impressionsPaid: null,
    accountsEngaged: null,
    profileVisits: null,
    websiteClicks: null,
    totalInteractions: null,
    engagementRate: null,
    contentPublished: null,
    paidSpend: null,
    paidReach: null,
    paidImpressions: null,
    paidEngagements: null,
    paidProfileVisits: null,
    paidVideoViews: null,
    paidWebsiteClicks: null,
    paidFollowers: null
  };
}

function sumMetricNullable<T>(rows: T[], getter: (row: T) => unknown) {
  let found = false;
  const total = rows.reduce((sum, row) => {
    const value = nullableNumber(getter(row));
    if (value === null) return sum;
    found = true;
    return sum + value;
  }, 0);
  return found ? total : null;
}

function latestMetricNullable<T>(rows: T[], getter: (row: T) => unknown) {
  for (const row of [...rows].reverse()) {
    const value = nullableNumber(getter(row));
    if (value !== null) return value;
  }
  return null;
}

function summarizeInstagramTotals(daily: SocialAccountDailyMetric[], paidRows: SocialPaidDailyMetric[]): InstagramDashboardTotals {
  const followersTotal = latestMetricNullable(daily, (row) => row.followers_total);
  const followersGained = sumMetricNullable(daily, (row) => row.followers_gained);
  const unfollows = sumMetricNullable(daily, (row) => row.unfollows);
  const netFromSource = sumMetricNullable(daily, (row) => row.net_follower_growth);
  const netFollowersGained = netFromSource ?? (followersGained === null && unfollows === null ? null : (followersGained ?? 0) - (unfollows ?? 0));
  const reachTotal = sumMetricNullable(daily, (row) => row.reach_total);
  const totalInteractions = sumMetricNullable(daily, (row) => row.total_interactions);

  return {
    followersTotal,
    netFollowersGained,
    followersGained,
    unfollows,
    reachTotal,
    reachOrganic: sumMetricNullable(daily, (row) => row.reach_organic),
    reachPaid: sumMetricNullable(daily, (row) => row.reach_paid),
    impressionsTotal: sumMetricNullable(daily, (row) => row.impressions_total),
    impressionsOrganic: sumMetricNullable(daily, (row) => row.impressions_organic),
    impressionsPaid: sumMetricNullable(daily, (row) => row.impressions_paid),
    accountsEngaged: sumMetricNullable(daily, (row) => row.accounts_engaged),
    profileVisits: sumMetricNullable(daily, (row) => row.profile_visits),
    websiteClicks: sumMetricNullable(daily, (row) => row.website_clicks),
    totalInteractions,
    engagementRate: reachTotal && totalInteractions !== null ? totalInteractions / reachTotal : null,
    contentPublished: sumMetricNullable(daily, (row) => row.content_published),
    paidSpend: sumMetricNullable(paidRows, (row) => row.spend),
    paidReach: sumMetricNullable(paidRows, (row) => row.reach),
    paidImpressions: sumMetricNullable(paidRows, (row) => row.impressions),
    paidEngagements: sumMetricNullable(paidRows, (row) => row.engagements),
    paidProfileVisits: sumMetricNullable(paidRows, (row) => row.profile_visits),
    paidVideoViews: sumMetricNullable(paidRows, (row) => row.video_views),
    paidWebsiteClicks: sumMetricNullable(paidRows, (row) => row.inline_link_clicks ?? row.clicks),
    paidFollowers: sumMetricNullable(paidRows, (row) => row.follows)
  };
}

function summarizeInstagramContent(contentRows: SocialMediaContent[], metricRows: SocialMediaDailyMetric[]): InstagramContentSummary[] {
  const metricsByContentId = new Map<string, SocialMediaDailyMetric[]>();
  metricRows.forEach((row) => {
    const rows = metricsByContentId.get(row.social_media_content_id) ?? [];
    rows.push(row);
    metricsByContentId.set(row.social_media_content_id, rows);
  });

  return contentRows.map((content) => {
    const rows = metricsByContentId.get(content.id) ?? [];
    const reachTotal = sumMetricNullable(rows, (row) => row.reach_total);
    const totalInteractions = sumMetricNullable(rows, (row) => row.total_interactions);
    return {
      ...content,
      reachTotal,
      reachOrganic: sumMetricNullable(rows, (row) => row.reach_organic),
      reachPaid: sumMetricNullable(rows, (row) => row.reach_paid),
      impressionsTotal: sumMetricNullable(rows, (row) => row.impressions_total),
      impressionsOrganic: sumMetricNullable(rows, (row) => row.impressions_organic),
      impressionsPaid: sumMetricNullable(rows, (row) => row.impressions_paid),
      likes: sumMetricNullable(rows, (row) => row.likes),
      comments: sumMetricNullable(rows, (row) => row.comments),
      shares: sumMetricNullable(rows, (row) => row.shares),
      saves: sumMetricNullable(rows, (row) => row.saves),
      totalInteractions,
      engagementRate: firstNullableNumber(latestMetricNullable(rows, (row) => row.engagement_rate), reachTotal && totalInteractions !== null ? totalInteractions / reachTotal : null),
      videoViews: sumMetricNullable(rows, (row) => row.video_views),
      averageWatchTimeSeconds: latestMetricNullable(rows, (row) => row.average_watch_time_seconds),
      profileActivity: sumMetricNullable(rows, (row) => row.profile_activity)
    };
  });
}

export async function getAdminData() {
  const { supabase, profile, client } = await getActiveClient();
  if (profile.role !== "admin" && profile.role !== "client_admin") {
    redirect("/dashboard");
  }

  const [clients, profiles, assignments] = await Promise.all([
    profile.role === "admin"
      ? supabase.from("clients").select("*").order("name")
      : supabase.from("clients").select("*").eq("id", client?.id ?? "").order("name"),
    supabase.from("profiles").select("id,email,full_name,role,created_at").order("created_at", { ascending: false }),
    supabase.from("client_users").select("user_id,client_id,clients(name)").order("created_at", { ascending: false })
  ]);
  const { data: lastSeenRows } = await supabase
    .from("profiles")
    .select("id,last_seen_at");
  const lastSeenById = new Map((lastSeenRows ?? []).map((row: any) => [row.id, row.last_seen_at]));
  const visibleAssignments = profile.role === "admin"
    ? assignments.data ?? []
    : (assignments.data ?? []).filter((assignment: any) => assignment.client_id === client?.id);
  const visibleUserIds = new Set(visibleAssignments.map((assignment: any) => assignment.user_id));
  const visibleProfiles = profile.role === "admin"
    ? profiles.data ?? []
    : (profiles.data ?? []).filter((row: any) => visibleUserIds.has(row.id) || row.id === profile.id);
  const profilesWithLastSeen = visibleProfiles.map((row: any) => ({
    ...row,
    last_seen_at: lastSeenById.get(row.id) ?? null
  }));
  let authUsers: any[] = [];

  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    authUsers = data.users;
  } catch {
    authUsers = [];
  }

  return {
    profile,
    clients: clients.data ?? [],
    profiles: profilesWithLastSeen,
    clientUsers: visibleAssignments,
    authUsers: profile.role === "admin" ? authUsers : authUsers.filter((user) => visibleUserIds.has(user.id) || user.id === profile.id)
  };
}
