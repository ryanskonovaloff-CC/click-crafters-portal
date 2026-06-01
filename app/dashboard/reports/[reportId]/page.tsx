import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { AccentText, Badge, Card, ClientPageTitle, EmptyState } from "@/components/ui";
import { publishMonthlyReport, unpublishMonthlyReport } from "../actions";
import { getMonthlyReportData } from "@/lib/data";
import { clientLogoSrc } from "@/lib/client-branding";
import { compact, currency, currencyCents, pct } from "@/lib/utils";
import { ReportImpactChart } from "@/components/report-impact-chart";
import type { DailyPerformance, MonthlyReport } from "@/lib/types";

type PageProps = {
  params: Promise<{ reportId: string }>;
};

type ReportEntityRow = {
  name: string;
  context: string | null;
  details: string[];
};

export default async function ReportDetailPage({ params }: PageProps) {
  const { reportId } = await params;
  const { profile, report, paidDailyRows, status } = await getMonthlyReportData(reportId);

  if (!report && !status.error) notFound();
  const isAdmin = profile.role === "admin";

  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <Link href="/dashboard/reports" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white">
        <ArrowLeft size={15} /> Reports
      </Link>

      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load report: {status.error}</Card> : null}
      {report ? <ReportContent report={report} paidDailyRows={paidDailyRows} showStatus={isAdmin} /> : null}
    </div>
  );
}

function ReportContent({ report, paidDailyRows, showStatus }: { report: MonthlyReport; paidDailyRows: DailyPerformance[]; showStatus: boolean }) {
  const logoSrc = clientLogoSrc(report.client_name);
  const executiveSummary = reportExecutiveSummary(report);
  const wins = report.wins.length > 0 ? report.wins : fallbackWins(report);
  const watchouts = report.watchouts.length > 0 ? report.watchouts : fallbackWatchouts(report);
  const nextSteps = report.next_steps.length > 0 ? report.next_steps : fallbackNextSteps(report);

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1"><CalendarDays size={13} /> {formatMonth(report.report_month)}</Badge>
            {showStatus ? <StatusBadge status={report.status} /> : null}
          </div>
          <ClientPageTitle logoSrc={logoSrc} logoAlt={report.client_name ?? undefined} className="[&_h1]:sm:text-4xl">{report.title ?? <>Monthly <AccentText>Performance</AccentText> Report</>}</ClientPageTitle>
          <p className="mt-1.5 text-xs text-white/50 sm:mt-2 sm:text-sm">
            {[report.client_name, periodLabel(report), report.published_at ? `Published ${formatDate(report.published_at)}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        {showStatus ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            {report.status === "draft" ? <PublishReportButton reportId={report.id} /> : null}
            {report.status === "published" ? <UnpublishReportButton reportId={report.id} /> : null}
          </div>
        ) : null}
      </header>

      <Card>
        <h2 className="text-lg font-semibold"><AccentText>Executive</AccentText> Summary</h2>
        {executiveSummary ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/65">{executiveSummary}</p>
        ) : (
          <EmptyState>Executive summary is not available for this report.</EmptyState>
        )}
      </Card>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-lg font-semibold"><AccentText>KPI</AccentText> Overview</h2>
        <ReportKpiOverview report={report} />
      </section>

      <Card>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold"><AccentText>Paid Ads</AccentText> Impact Over Time</h2>
            <p className="mt-2 text-sm text-white/55">Cumulative spend and reported revenue for the report period.</p>
          </div>
          <Badge>Running total</Badge>
        </div>
        {paidDailyRows.length > 0 ? (
          <div className="mt-5">
            <ReportImpactChart data={paidDailyRows} />
          </div>
        ) : (
          <div className="mt-4"><EmptyState>Paid Ads trend data not available for this report.</EmptyState></div>
        )}
      </Card>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <PaidAdsReportSection summary={report.paid_ads_summary} commentary={report.paid_ads_commentary} />
        <SeoReportSection summary={report.seo_summary} commentary={report.seo_commentary} />
      </div>

      <SummarySection
        title="Month-over-Month"
        unavailable="Month-over-month data not available for this report."
        summary={report.mom_summary}
        commentary={report.mom_commentary}
        metrics={momMetrics(report.mom_summary)}
      />

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-3">
        <ListSection title="Wins" items={wins} empty="No wins recorded for this report." />
        <ListSection title="Watchouts" items={watchouts} empty="No watchouts recorded for this report." />
        <ListSection title="Recommended Next Steps" items={nextSteps} empty="No next steps recorded for this report." />
      </div>
    </>
  );
}

function PublishReportButton({ reportId }: { reportId: string }) {
  return (
    <form action={publishMonthlyReport} className="shrink-0">
      <input type="hidden" name="reportId" value={reportId} />
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-lg border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent/20 sm:w-auto"
      >
        Publish Report
      </button>
    </form>
  );
}

function UnpublishReportButton({ reportId }: { reportId: string }) {
  return (
    <form action={unpublishMonthlyReport} className="shrink-0">
      <input type="hidden" name="reportId" value={reportId} />
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/65 transition hover:border-accent/50 hover:text-white sm:w-auto"
      >
        Unpublish
      </button>
    </form>
  );
}

function PaidAdsReportSection({ summary, commentary }: { summary: Record<string, unknown> | null; commentary: string | null }) {
  const metrics = paidAdsMetrics(summary);
  const topCampaigns = reportRows(readArray(summary, "top_campaigns"), "campaign");
  const topAdsByRoas = reportRows(readArray(summary, "top_ads_by_roas"), "ad");
  const topAdsBySpend = reportRows(readArray(summary, "top_ads_by_spend"), "ad");

  return (
    <Card>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold"><AccentText>Paid Ads</AccentText></h2>
          {commentary ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/65">{commentary}</p> : null}
        </div>
        <Badge>Google Ads</Badge>
      </div>

      {summary && metrics.length > 0 ? (
        <div className="mt-4 space-y-4">
          <MetricPanelGrid metrics={metrics} />
          <div className="grid gap-3 lg:grid-cols-2">
            <RankedList title="Top campaigns" rows={topCampaigns} empty="No campaign rankings available for this report." />
            <RankedList title="Top ads by ROAS" rows={topAdsByRoas} empty="No ad ROAS rankings available for this report." />
            <RankedList title="Top ads by spend" rows={topAdsBySpend} empty="No ad spend rankings available for this report." />
            <RankedList title="Campaigns to watch" rows={reportRows(readArray(summary, "campaign_watchouts"), "campaign")} empty="No campaign watchouts for this report." />
          </div>
        </div>
      ) : (
        <div className="mt-4"><EmptyState>Paid Ads data not available for this report.</EmptyState></div>
      )}
    </Card>
  );
}

function SeoReportSection({ summary, commentary }: { summary: Record<string, unknown> | null; commentary: string | null }) {
  const metrics = seoMetrics(summary);
  const topPages = reportRows(readArray(summary, "top_pages"), "page");
  const topQueries = reportRows(readArray(summary, "top_queries"), "query");

  return (
    <Card>
      <h2 className="text-lg font-semibold"><AccentText>SEO</AccentText></h2>
      {commentary ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/65">{commentary}</p> : null}
      {summary && metrics.length > 0 ? (
        <div className="mt-4 space-y-4">
          <MetricPanelGrid metrics={metrics} />
          <div className="grid gap-3 lg:grid-cols-2">
            <RankedList title="Top landing pages" rows={topPages} empty="No landing page rankings available for this report." />
            <RankedList title="Top queries" rows={topQueries} empty="No query rankings available for this report." />
          </div>
        </div>
      ) : (
        <div className="mt-4"><EmptyState>SEO data not available for this report.</EmptyState></div>
      )}
    </Card>
  );
}

function SummarySection({ title, unavailable, summary, commentary, metrics }: {
  title: string;
  unavailable: string;
  summary: Record<string, unknown> | null;
  commentary: string | null;
  metrics: Array<{ label: string; value: string }>;
}) {
  const highlights = summary ? summaryHighlights(summary) : [];
  const hasContent = Boolean(commentary) || metrics.length > 0 || highlights.length > 0;

  return (
    <Card>
      <h2 className="text-lg font-semibold">{sectionTitle(title)}</h2>
      {commentary ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/65">{commentary}</p> : null}
      {summary && hasContent ? (
        <div className="mt-4 space-y-4">
          {metrics.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-white/45">{metric.label}</p>
                  <p className="mt-1 text-base font-semibold text-white/85">{metric.value}</p>
                </div>
              ))}
            </div>
          ) : null}
          <JsonHighlights entries={highlights} />
        </div>
      ) : (
        <div className="mt-4"><EmptyState>{unavailable}</EmptyState></div>
      )}
    </Card>
  );
}

function MetricPanelGrid({ metrics }: { metrics: Array<{ label: string; value: string; helper?: string }> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs text-white/45">{metric.label}</p>
          <p className="mt-1 text-base font-semibold text-white/85">{metric.value}</p>
          {metric.helper ? <p className="mt-1 text-xs text-accent/80">{metric.helper}</p> : null}
        </div>
      ))}
    </div>
  );
}

function RankedList({ title, rows, empty }: { title: string; rows: ReportEntityRow[]; empty: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <h3 className="text-sm font-semibold text-white/85">{title}</h3>
      {rows.length > 0 ? (
        <div className="mt-3 space-y-3">
          {rows.slice(0, 5).map((row, index) => (
            <div key={`${row.name}-${index}`} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
              <div className="flex gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-accent/35 bg-accent/10 text-xs font-semibold text-accent">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white/85">{row.name}</p>
                  {row.context ? <p className="mt-1 truncate text-xs text-white/45">{row.context}</p> : null}
                  <p className="mt-2 text-xs leading-5 text-white/55">{row.details.join(" · ")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/45">{empty}</p>
      )}
    </div>
  );
}

function ListSection({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">{sectionTitle(title)}</h2>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-3 text-sm leading-6 text-white/65">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10">
                <img src="/assets/logo-mark.svg" alt="" className="size-3.5" aria-hidden="true" />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4"><EmptyState>{empty}</EmptyState></div>
      )}
    </Card>
  );
}

function ReportKpiOverview({ report }: { report: MonthlyReport }) {
  const paid = paidCurrent(report);
  const seo = seoCurrent(report);
  const metrics = [
    ["Spend", formatCurrency(paid ? readNumber(paid, "spend", "total_spend") : null)],
    ["Online orders", formatCount(paid ? readNumber(paid, "conversions", "online_orders") : null)],
    ["CPA", formatCurrency(paid ? readNumber(paid, "cpa") : null)],
    ["Store visits", formatCount(paid ? readNumber(paid, "store_visits", "storeVisits") : null)],
    ["Revenue", formatCurrency(paid ? readNumber(paid, "revenue", "conversion_value", "total_revenue") : null)],
    ["Est. total revenue", formatCurrency(paid ? readNumber(paid, "estimated_total_revenue", "estimatedTotalRevenue") : null)],
    ["ROAS", formatMultiplier(paid ? readNumber(paid, "roas") : null)],
    ["Est. blended ROAS", formatMultiplier(paid ? readNumber(paid, "estimated_blended_roas", "estimatedBlendedRoas") : null)],
    ["Organic clicks", formatCount(seo ? readNumber(seo, "organic_clicks", "clicks") : null)],
    ["Organic impressions", formatCount(seo ? readNumber(seo, "organic_impressions", "impressions") : null)],
    ["Organic CTR", formatRatio(seo ? readNumber(seo, "organic_ctr", "ctr") : null)],
    ["Average position", formatDecimal(seo ? readNumber(seo, "average_position", "position") : null)]
  ].map(([label, value]) => ({ label, value })).filter((metric) => metric.value !== "Not available");

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex min-h-32 flex-col justify-center rounded-lg border border-white/15 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="text-sm font-medium text-white/55">{metric.label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-white">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

function JsonHighlights({ entries }: { entries: Array<[string, unknown]> }) {
  if (entries.length === 0) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-white/10 bg-black/20 p-3">
          <h3 className="text-sm font-semibold capitalize text-white/80">{humanize(key)}</h3>
          <div className="mt-2 space-y-2 text-xs leading-5 text-white/55">
            {renderSummaryValue(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function summaryHighlights(summary: Record<string, unknown>) {
  const hiddenKeys = new Set([
    "debug",
    "node_name",
    "query_client_id",
    "source_item_count",
    "grouped_ad_count",
    "grouped_campaign_count",
    "payload_size_chars",
    "period_start",
    "period_end",
    "previous_period_start",
    "previous_period_end",
    "source",
    "current",
    "previous",
    "mom_delta",
    "mom_deltas",
    "previous_period"
  ]);

  return Object.entries(summary)
    .filter(([key]) => !hiddenKeys.has(key))
    .filter(([, value]) => Array.isArray(value) || (value && typeof value === "object"))
    .filter(([, value]) => hasDisplayableSummaryValue(value))
    .slice(0, 4);
}

function hasDisplayableSummaryValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some((item) => {
    if (item === null || item === undefined || item === "") return false;
    if (typeof item === "number") return Number.isFinite(item);
    if (Array.isArray(item)) return item.length > 0;
    if (typeof item === "object") return hasDisplayableSummaryValue(item);
    return true;
  });
}

function renderSummaryValue(value: unknown) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <p>Not available</p>;
    return value.slice(0, 5).map((item, index) => (
      <p key={index}>{typeof item === "object" && item ? compactObject(item as Record<string, unknown>) : String(item)}</p>
    ));
  }
  if (value && typeof value === "object") {
    const rows = Object.entries(value as Record<string, unknown>).slice(0, 6);
    return rows.length > 0 ? rows.map(([key, item]) => <p key={key}>{humanize(key)}: {formatUnknown(item)}</p>) : <p>Not available</p>;
  }
  return <p>{formatUnknown(value)}</p>;
}

function reportExecutiveSummary(report: MonthlyReport) {
  if (hasMeaningfulCopy(report.executive_summary)) return report.executive_summary;

  const paid = paidCurrent(report);
  const seo = seoCurrent(report);
  const client = report.client_name ?? "the client";
  const period = formatMonth(report.report_month);
  const spend = paid ? readNumber(paid, "spend", "total_spend") : null;
  const revenue = paid ? readNumber(paid, "revenue", "conversion_value", "total_revenue") : null;
  const estimatedRevenue = paid ? readNumber(paid, "estimated_total_revenue", "estimatedTotalRevenue") : null;
  const roas = paid ? readNumber(paid, "roas") : null;
  const blendedRoas = paid ? readNumber(paid, "estimated_blended_roas", "estimatedBlendedRoas") : null;
  const orders = paid ? readNumber(paid, "conversions", "online_orders") : null;
  const organicClicks = seo ? readNumber(seo, "organic_clicks", "clicks") : null;
  const organicImpressions = seo ? readNumber(seo, "organic_impressions", "impressions") : null;
  const parts: string[] = [];

  if (spend !== null && revenue !== null) {
    parts.push(`${period} performance for ${client} shows ${formatCurrency(spend)} in ad spend generating ${formatCurrency(revenue)} in reported online revenue${orders !== null ? ` from ${formatCount(orders)} online orders` : ""}.`);
  }
  if (estimatedRevenue !== null && blendedRoas !== null) {
    parts.push(`With estimated in-store impact included, total revenue is estimated at ${formatCurrency(estimatedRevenue)} with ${formatMultiplier(blendedRoas)} blended ROAS${roas !== null ? ` versus ${formatMultiplier(roas)} platform ROAS` : ""}.`);
  }
  if (organicClicks !== null || organicImpressions !== null) {
    parts.push(`SEO visibility added ${formatCount(organicClicks)} organic clicks${organicImpressions !== null ? ` from ${formatCount(organicImpressions)} impressions` : ""}.`);
  }
  if (!hasMomData(report)) {
    parts.push("Prior-month comparison data is not available for this report, so the summary is based on current-month performance.");
  }

  return parts.join(" ");
}

function fallbackWins(report: MonthlyReport) {
  const paid = paidCurrent(report);
  const seo = seoCurrent(report);
  const rows: string[] = [];
  const spend = paid ? readNumber(paid, "spend", "total_spend") : null;
  const revenue = paid ? readNumber(paid, "revenue", "conversion_value", "total_revenue") : null;
  const estimatedRevenue = paid ? readNumber(paid, "estimated_total_revenue", "estimatedTotalRevenue") : null;
  const roas = paid ? readNumber(paid, "roas") : null;
  const blendedRoas = paid ? readNumber(paid, "estimated_blended_roas", "estimatedBlendedRoas") : null;
  const topCampaign = reportRows(readArray(report.paid_ads_summary, "top_campaigns"), "campaign")[0];
  const topAd = reportRows(readArray(report.paid_ads_summary, "top_ads_by_roas"), "ad")[0];
  const organicClicks = seo ? readNumber(seo, "organic_clicks", "clicks") : null;
  const organicImpressions = seo ? readNumber(seo, "organic_impressions", "impressions") : null;

  if (estimatedRevenue !== null && blendedRoas !== null) rows.push(`Estimated total revenue reached ${formatCurrency(estimatedRevenue)} with ${formatMultiplier(blendedRoas)} estimated blended ROAS.`);
  if (spend !== null && revenue !== null && roas !== null) rows.push(`Paid ads produced ${formatCurrency(revenue)} in reported revenue on ${formatCurrency(spend)} spend, a ${formatMultiplier(roas)} platform ROAS.`);
  if (topCampaign) rows.push(`Top campaign: ${topCampaign.name}${topCampaign.details.length > 0 ? ` (${topCampaign.details.join(" · ")})` : ""}.`);
  if (topAd) rows.push(`Top ad by ROAS: ${topAd.name}${topAd.details.length > 0 ? ` (${topAd.details.join(" · ")})` : ""}.`);
  if (organicClicks !== null) rows.push(`Organic search delivered ${formatCount(organicClicks)} clicks${organicImpressions !== null ? ` from ${formatCount(organicImpressions)} impressions` : ""}.`);

  return rows.slice(0, 4);
}

function fallbackWatchouts(report: MonthlyReport) {
  const paid = paidCurrent(report);
  const rows: string[] = [];
  const roas = paid ? readNumber(paid, "roas") : null;
  const blendedRoas = paid ? readNumber(paid, "estimated_blended_roas", "estimatedBlendedRoas") : null;
  const campaignWatchout = reportRows(readArray(report.paid_ads_summary, "campaign_watchouts"), "campaign")[0];

  if (!hasMomData(report)) rows.push("Prior-month comparison data is unavailable, so month-over-month movement should not be used for final performance conclusions yet.");
  if (roas !== null && blendedRoas !== null && blendedRoas > roas) rows.push("Platform ROAS understates the likely full impact because in-store purchases from ad-driven store visits are not captured as online revenue.");
  if (campaignWatchout) rows.push(`Campaign to watch: ${campaignWatchout.name}${campaignWatchout.details.length > 0 ? ` (${campaignWatchout.details.join(" · ")})` : ""}.`);

  return rows.slice(0, 3);
}

function fallbackNextSteps(report: MonthlyReport) {
  const paid = paidCurrent(report);
  const seo = seoCurrent(report);
  const rows = [
    paid ? "Use estimated blended ROAS and estimated total revenue in the client performance discussion, while clearly labeling them as estimates." : null,
    paid ? "Review top campaign and ad performance, then keep budget focused on the assets producing the strongest revenue efficiency." : null,
    seo ? "Use the top queries and landing pages to prioritize SEO content improvements and conversion-focused page updates." : null,
    "Validate tracking assumptions for online orders, store visits, and estimated in-store revenue before publishing the next monthly report."
  ];

  if (!hasMomData(report)) rows.push("Use the next completed report period to establish a reliable month-over-month baseline.");
  return rows.filter((item): item is string => Boolean(item)).slice(0, 4);
}

function hasMeaningfulCopy(value: string | null) {
  if (!value?.trim()) return false;
  const normalized = value.trim().toLowerCase();
  return ![
    "monthly report draft generated from compact source metrics.",
    "monthly performance report draft generated from available portal data."
  ].includes(normalized);
}

function hasMomData(report: MonthlyReport) {
  if (momMetrics(report.mom_summary).length > 0) return true;
  return hasMeaningfulCopy(report.mom_commentary);
}

function paidCurrent(report: MonthlyReport) {
  return report.paid_ads_summary ? readObject(report.paid_ads_summary, "current") ?? report.paid_ads_summary : null;
}

function seoCurrent(report: MonthlyReport) {
  return report.seo_summary ? readObject(report.seo_summary, "summary") ?? report.seo_summary : null;
}

function paidAdsMetrics(summary: Record<string, unknown> | null): Array<{ label: string; value: string; helper?: string }> {
  if (!summary) return [];
  const current = readObject(summary, "current") ?? summary;
  return compactMetrics([
    ["Spend", formatCurrency(readNumber(current, "spend", "total_spend"))],
    ["Revenue", formatCurrency(readNumber(current, "revenue", "conversion_value", "total_revenue"))],
    ["Estimated total revenue", formatCurrency(readNumber(current, "estimated_total_revenue", "estimatedTotalRevenue"))],
    ["Conversions", formatCount(readNumber(current, "conversions"))],
    ["ROAS", formatMultiplier(readNumber(current, "roas"))],
    ["Estimated blended ROAS", formatMultiplier(readNumber(current, "estimated_blended_roas", "estimatedBlendedRoas"))],
    ["CPA", formatCurrency(readNumber(current, "cpa"))],
    ["Store visits", formatCount(readNumber(current, "store_visits", "storeVisits"))],
    ["Est. in-store orders", formatCount(readNumber(current, "estimated_in_store_purchases", "estimatedInStorePurchases"))],
    ["Clicks", formatCount(readNumber(current, "clicks"))],
    ["CPC", formatCurrencyCents(readNumber(current, "cpc"))],
    ["CTR", formatRatio(readNumber(current, "ctr"))]
  ]);
}

function sectionTitle(title: string) {
  if (title === "Paid Ads") return <AccentText>Paid Ads</AccentText>;
  if (title === "SEO") return <AccentText>SEO</AccentText>;
  if (title === "Month-over-Month") return <AccentText>Month-over-Month</AccentText>;
  if (title === "Wins") return <AccentText>Wins</AccentText>;
  if (title === "Watchouts") return <AccentText>Watchouts</AccentText>;
  if (title === "Recommended Next Steps") return <>Recommended <AccentText>Next Steps</AccentText></>;
  return title;
}

function seoMetrics(summary: Record<string, unknown> | null): Array<{ label: string; value: string; helper?: string }> {
  if (!summary) return [];
  const current = readObject(summary, "summary") ?? summary;
  return compactMetrics([
    ["Organic clicks", formatCount(readNumber(current, "organic_clicks", "clicks"))],
    ["Organic impressions", formatCount(readNumber(current, "organic_impressions", "impressions"))],
    ["Organic CTR", formatRatio(readNumber(current, "organic_ctr", "ctr"))],
    ["Average position", formatDecimal(readNumber(current, "average_position", "position"))],
    ["Organic sessions", formatCount(readNumber(current, "organic_sessions", "sessions"))],
    ["Outbound clicks", formatCount(readNumber(current, "outbound_clicks"))],
    ["Outbound click rate", formatRatio(readNumber(current, "outbound_click_rate"))],
    ["Indexed pages", formatCount(readNumber(current, "indexed_pages"))]
  ]);
}

function momMetrics(summary: Record<string, unknown> | null) {
  if (!summary) return [];
  const paid = readObject(summary, "paid_ads") ?? summary;
  const seo = readObject(summary, "seo") ?? summary;
  return compactMetrics([
    ["Spend MoM", formatChange(readNumber(paid, "spend", "spend_mom", "spend_change"))],
    ["Conversions MoM", formatChange(readNumber(paid, "conversions", "conversions_mom", "conversions_change"))],
    ["CPA MoM", formatChange(readNumber(paid, "cpa", "cpa_mom", "cpa_change"))],
    ["ROAS MoM", formatChange(readNumber(paid, "roas", "roas_mom", "roas_change"))],
    ["Revenue MoM", formatChange(readNumber(paid, "revenue", "revenue_mom", "revenue_change"))],
    ["Organic clicks MoM", formatChange(readNumber(seo, "clicks", "organic_clicks_mom", "organic_clicks_change"))],
    ["Organic impressions MoM", formatChange(readNumber(seo, "impressions", "organic_impressions_mom", "organic_impressions_change"))],
    ["Average position MoM", formatChange(readNumber(seo, "average_position", "average_position_change"))]
  ]);
}

function compactMetrics(rows: Array<[string, string]>) {
  return rows.map(([label, value]) => ({ label, value })).filter((item) => item.value !== "Not available");
}

function readArray(source: Record<string, unknown> | null, key: string) {
  if (!source) return [];
  const value = source[key];
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function reportRows(rows: Record<string, unknown>[], kind: "campaign" | "ad" | "page" | "query"): ReportEntityRow[] {
  return rows.map((row) => {
    const name = entityName(row, kind);
    const context = kind === "ad" ? stringValue(row, "campaign_name") : kind === "campaign" ? stringValue(row, "channel") : null;
    const details = entityDetails(row, kind);
    return { name, context, details };
  }).filter((row) => row.name && row.details.length > 0);
}

function entityName(row: Record<string, unknown>, kind: "campaign" | "ad" | "page" | "query") {
  if (kind === "campaign") return stringValue(row, "campaign_name") ?? stringValue(row, "campaign_id") ?? "Unnamed campaign";
  if (kind === "ad") return stringValue(row, "ad_name") ?? stringValue(row, "headline") ?? stringValue(row, "ad_id") ?? "Unnamed ad";
  if (kind === "page") return cleanPageLabel(stringValue(row, "page") ?? stringValue(row, "url") ?? "Unknown page");
  return stringValue(row, "query") ?? "Unknown query";
}

function entityDetails(row: Record<string, unknown>, kind: "campaign" | "ad" | "page" | "query") {
  if (kind === "page" || kind === "query") {
    return compactDetailValues([
      ["Clicks", formatCount(readNumber(row, "clicks", "organic_clicks"))],
      ["Impressions", formatCount(readNumber(row, "impressions", "organic_impressions"))],
      ["CTR", formatRatio(readNumber(row, "ctr", "organic_ctr"))],
      ["Position", formatDecimal(readNumber(row, "average_position", "position"))]
    ]);
  }

  return compactDetailValues([
    ["Spend", formatCurrency(readNumber(row, "spend", "total_spend"))],
    ["Revenue", formatCurrency(readNumber(row, "revenue", "conversion_value", "total_revenue"))],
    ["Conversions", formatCount(readNumber(row, "conversions"))],
    ["ROAS", formatMultiplier(readNumber(row, "roas"))],
    ["CPA", formatCurrency(readNumber(row, "cpa"))]
  ]);
}

function compactDetailValues(rows: Array<[string, string]>) {
  return rows.filter(([, value]) => value !== "Not available").slice(0, 4).map(([label, value]) => `${label}: ${value}`);
}

function stringValue(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanPageLabel(value: string) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname === "/" ? "/" : url.pathname}`;
  } catch {
    return value;
  }
}

function readNumber(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    const number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : null;
    if (number !== null && Number.isFinite(number)) return number;
  }
  return null;
}

function readObject(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function formatCount(value: number | null) {
  return value === null ? "Not available" : compact.format(value);
}

function formatCurrency(value: number | null) {
  return value === null ? "Not available" : currency.format(value);
}

function formatCurrencyCents(value: number | null) {
  return value === null ? "Not available" : currencyCents.format(value);
}

function formatMultiplier(value: number | null) {
  return value === null ? "Not available" : `${value.toFixed(2)}x`;
}

function formatDecimal(value: number | null) {
  return value === null ? "Not available" : value.toFixed(1);
}

function formatRatio(value: number | null) {
  if (value === null) return "Not available";
  return pct((value > 1 ? value : value * 100));
}

function formatChange(value: number | null) {
  if (value === null) return "Not available";
  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  return `${normalized > 0 ? "+" : ""}${normalized.toFixed(1)}%`;
}

function formatUnknown(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not available";
  if (typeof value === "number") return Number.isInteger(value) ? compact.format(value) : value.toFixed(2);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return compactObject(value as Record<string, unknown>);
  return String(value);
}

function compactObject(value: Record<string, unknown>): string {
  return Object.entries(value)
    .slice(0, 4)
    .map(([key, item]) => `${humanize(key)}: ${formatUnknown(item)}`)
    .join(" · ");
}

function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ status }: { status: MonthlyReport["status"] }) {
  const tone = status === "published" ? "border-emerald-400/30 text-emerald-100/80" : status === "archived" ? "border-white/15 text-white/50" : "border-amber-400/30 text-amber-100/80";
  return <Badge className={tone}>{status}</Badge>;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function periodLabel(report: MonthlyReport) {
  return `${formatDate(`${report.period_start}T00:00:00Z`)} - ${formatDate(`${report.period_end}T00:00:00Z`)}`;
}
