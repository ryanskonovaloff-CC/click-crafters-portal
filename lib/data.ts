import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Client,
  DailyPerformance,
  DashboardQueryStatus,
  DateRange,
  DateRangeKey,
  MetricTotals,
  Report,
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
  last_month: "Last month",
  custom: "Custom range"
};

const validRangeKeys: DateRangeKey[] = ["today", "yesterday", "last3", "last7", "last14", "mtd", "last30", "last_month", "custom"];

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
  const rangeKey = validRangeKeys.includes(key as DateRangeKey) ? key as DateRangeKey : "last7";
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

function normalizeDailyPerformance(row: Record<string, unknown>): DailyPerformance {
  const spend = toNumber(row.spend);
  const revenue = toNumber(row.revenue);
  const conversions = toNumber(row.conversions);
  const clicks = toNumber(row.clicks);
  const impressions = toNumber(row.impressions);

  return {
    date: String(row.date ?? ""),
    platform: String(row.platform ?? "Unknown"),
    channel: row.channel ? String(row.channel) : null,
    spend,
    revenue,
    conversions,
    clicks,
    impressions,
    cpa: nullableNumber(row.cpa) ?? (conversions > 0 ? spend / conversions : null),
    roas: nullableNumber(row.roas) ?? (spend > 0 ? revenue / spend : null),
    ctr: nullableNumber(row.ctr) ?? (impressions > 0 ? clicks / impressions : null),
    cpc: nullableNumber(row.cpc) ?? (clicks > 0 ? spend / clicks : null)
  };
}

export function sumPaidPerformance(rows: DailyPerformance[]): MetricTotals {
  return rows.reduce((acc, item) => ({
    spend: acc.spend + item.spend,
    revenue: acc.revenue + item.revenue,
    conversions: acc.conversions + item.conversions,
    clicks: acc.clicks + item.clicks,
    impressions: acc.impressions + item.impressions
  }), { spend: 0, revenue: 0, conversions: 0, clicks: 0, impressions: 0 });
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
  return error?.code === "42P01" || error?.message?.toLowerCase().includes("does not exist") === true;
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
  const query = supabase
    .from("clients")
    .select("id,name,slug,industry,status,last_updated_at")
    .order("name", { ascending: true })
    .limit(1);

  const { data: clients } = profile.role === "admin"
    ? await query
    : await supabase
      .from("client_users")
      .select("clients(id,name,slug,industry,status,last_updated_at)")
      .eq("user_id", profile.id)
      .limit(1);

  const rows = clients as any[] | null;
  const client = Array.isArray(rows) && rows.length > 0
    ? ("clients" in rows[0] ? rows[0].clients : rows[0])
    : null;

  if (!client) {
    return { supabase, profile, client: null as Client | null };
  }

  return { supabase, profile, client: client as Client };
}

export async function getReportsData() {
  const { supabase, profile, client } = await getActiveClient();

  if (!client) {
    return { profile, client, reports: [] };
  }

  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("client_id", client.id)
    .order("month", { ascending: false });

  return {
    profile,
    client,
    reports: (data ?? []) as Report[]
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
    error: error?.message ?? null
  };
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
    indexedPages: null,
    technicalIssues: []
  };
}

function seoSearchTotalsFromRows(rows: Record<string, unknown>[]): SeoTotals {
  if (rows.length === 0) return emptySeoTotals();

  type SeoAccumulator = {
    organicClicks: number;
    organicImpressions: number;
    indexedPages: number;
    positionWeightedTotal: number;
    positionWeight: number;
    technicalIssues: string[];
  };

  const totals = rows.reduce<SeoAccumulator>((acc, row) => {
    acc.organicClicks += toNumber(row.organic_clicks ?? row.clicks);
    acc.organicImpressions += toNumber(row.organic_impressions ?? row.impressions);
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
    indexedPages: totals.indexedPages > 0 ? totals.indexedPages : null,
    technicalIssues: [...new Set(totals.technicalIssues)]
  };
}

function analyticsTotalsFromRows(rows: Record<string, unknown>[]): SeoTotals {
  if (rows.length === 0) return emptySeoTotals();

  const totals = rows.reduce<{ organicSessions: number; organicConversions: number }>((acc, row) => {
    acc.organicSessions += toNumber(row.organic_sessions ?? row.sessions);
    acc.organicConversions += toNumber(row.organic_conversions ?? row.conversions);
    return acc;
  }, { organicSessions: 0, organicConversions: 0 });

  return {
    ...emptySeoTotals(),
    organicSessions: totals.organicSessions,
    organicConversions: totals.organicConversions
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
    indexedPages: primary.indexedPages ?? fallback.indexedPages,
    technicalIssues: primary.technicalIssues.length > 0 ? primary.technicalIssues : fallback.technicalIssues
  };
}

export async function getPaidAdsDashboardData(rangeKey?: string, customStart?: string, customEnd?: string) {
  const { supabase, profile, client } = await getActiveClient();
  const range = getDateRange(rangeKey, customStart, customEnd);

  if (!client) {
    return { profile, client, range, daily: [], previousDaily: [], totals: sumPaidPerformance([]), previousTotals: sumPaidPerformance([]), status: queryStatus(null, 0) };
  }

  const [current, previous] = await Promise.all([
    getPaidRowsForRange(supabase, client.id, range.start, range.end),
    getPaidRowsForRange(supabase, client.id, range.previousStart, range.previousEnd)
  ]);

  return {
    profile,
    client,
    range,
    daily: current.rows,
    previousDaily: previous.rows,
    totals: sumPaidPerformance(current.rows),
    previousTotals: sumPaidPerformance(previous.rows),
    status: queryStatus(current.error, current.rows.length)
  };
}

export async function getSeoDashboardData(rangeKey?: string, customStart?: string, customEnd?: string) {
  const { supabase, profile, client } = await getActiveClient();
  const range = getDateRange(rangeKey, customStart, customEnd);

  if (!client) {
    return { profile, client, range, totals: emptySeoTotals(), topQueries: [], topPages: [], status: queryStatus(null, 0) };
  }

  const [daily, analytics, keywords, pages] = await Promise.all([
    supabase.from("seo_daily_performance").select("*").eq("client_id", client.id).gte("date", range.start).lte("date", range.end).order("date", { ascending: true }),
    supabase.from("analytics_daily_performance").select("*").eq("client_id", client.id).gte("date", range.start).lte("date", range.end).order("date", { ascending: true }),
    supabase.from("seo_keyword_performance").select("*").eq("client_id", client.id).gte("date", range.start).lte("date", range.end).order("clicks", { ascending: false }).limit(10),
    supabase.from("seo_pages_performance").select("*").eq("client_id", client.id).gte("date", range.start).lte("date", range.end).order("clicks", { ascending: false }).limit(10)
  ]);

  const dailyRows = (daily.data ?? []) as Record<string, unknown>[];
  const analyticsRows = organicAnalyticsRows((analytics.data ?? []) as Record<string, unknown>[]);
  const searchTotals = seoSearchTotalsFromRows(dailyRows);
  const analyticsTotals = analyticsTotalsFromRows(analyticsRows);
  const totals = mergeSeoTotals(searchTotals, analyticsTotals);
  const topQueries = ((keywords.data ?? []) as Record<string, unknown>[]).map((row) => ({
    query: String(row.query ?? row.keyword ?? "Unknown query"),
    clicks: toNumber(row.organic_clicks ?? row.clicks),
    impressions: toNumber(row.organic_impressions ?? row.impressions),
    position: toNumber(row.average_position ?? row.position)
  }));
  const topPages = ((pages.data ?? []) as Record<string, unknown>[]).map((row) => ({
    page: String(row.page ?? row.landing_page ?? row.url ?? "Unknown page"),
    clicks: toNumber(row.organic_clicks ?? row.clicks),
    sessions: toNumber(row.organic_sessions ?? row.sessions),
    conversions: toNumber(row.organic_conversions ?? row.conversions)
  }));
  const statusError = [
    queryErrorMessage(daily.error),
    queryErrorMessage(analytics.error),
    queryErrorMessage(keywords.error),
    queryErrorMessage(pages.error)
  ].filter(Boolean).join("; ") || null;
  const count = dailyRows.length + analyticsRows.length + topQueries.length + topPages.length;

  return {
    profile,
    client,
    range,
    totals,
    topQueries,
    topPages,
    status: queryStatus(statusError, count)
  };
}

export async function getOverviewDashboardData(rangeKey?: string, customStart?: string, customEnd?: string) {
  const [paid, seo] = await Promise.all([
    getPaidAdsDashboardData(rangeKey, customStart, customEnd),
    getSeoDashboardData(rangeKey, customStart, customEnd)
  ]);

  return {
    client: paid.client,
    range: paid.range,
    paid,
    seo,
    performance: paid.totals
  };
}

export async function getAdminData() {
  const { supabase, profile } = await getSessionProfile();
  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const [clients, profiles] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("profiles").select("id,email,full_name,role,created_at").order("created_at", { ascending: false })
  ]);

  return {
    profile,
    clients: clients.data ?? [],
    profiles: profiles.data ?? []
  };
}
