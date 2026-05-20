import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Badge, Card, EmptyState, MetricGrid, StatCard } from "@/components/ui";
import { publishMonthlyReport } from "../actions";
import { getMonthlyReportData } from "@/lib/data";
import { compact, currency, currencyCents, pct } from "@/lib/utils";
import type { MonthlyReport } from "@/lib/types";

type PageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function ReportDetailPage({ params }: PageProps) {
  const { reportId } = await params;
  const { profile, report, status } = await getMonthlyReportData(reportId);

  if (!report && !status.error) notFound();
  const isAdmin = profile.role === "admin";

  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <Link href="/dashboard/reports" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white">
        <ArrowLeft size={15} /> Reports
      </Link>

      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load report: {status.error}</Card> : null}
      {report ? <ReportContent report={report} showStatus={isAdmin} /> : null}
    </div>
  );
}

function ReportContent({ report, showStatus }: { report: MonthlyReport; showStatus: boolean }) {
  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1"><CalendarDays size={13} /> {formatMonth(report.report_month)}</Badge>
            {showStatus ? <StatusBadge status={report.status} /> : null}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:mt-3 sm:text-4xl">Monthly Performance Report</h1>
          <p className="mt-1.5 text-xs text-white/50 sm:mt-2 sm:text-sm">
            {[report.client_name, periodLabel(report), report.published_at ? `Published ${formatDate(report.published_at)}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        {showStatus && report.status === "draft" ? <PublishReportButton reportId={report.id} /> : null}
      </header>

      <Card>
        <h2 className="text-lg font-semibold">Executive Summary</h2>
        {report.executive_summary ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/65">{report.executive_summary}</p>
        ) : (
          <EmptyState>Executive summary is not available for this report.</EmptyState>
        )}
      </Card>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-lg font-semibold">KPI Overview</h2>
        <MetricGrid>
          {overviewMetrics(report).map((metric) => (
            <StatCard key={metric.label} label={metric.label} value={metric.value} state={metric.value === "Not available" ? "empty" : "ready"} />
          ))}
        </MetricGrid>
      </section>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <SummarySection
          title="Paid Ads"
          unavailable="Paid Ads data not available for this report."
          summary={report.paid_ads_summary}
          commentary={report.paid_ads_commentary}
          metrics={paidAdsMetrics(report.paid_ads_summary)}
        />
        <SummarySection
          title="SEO"
          unavailable="SEO data not available for this report."
          summary={report.seo_summary}
          commentary={report.seo_commentary}
          metrics={seoMetrics(report.seo_summary)}
        />
      </div>

      <SummarySection
        title="Month-over-Month"
        unavailable="Month-over-month data not available for this report."
        summary={report.mom_summary}
        commentary={report.mom_commentary}
        metrics={momMetrics(report.mom_summary)}
      />

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-3">
        <ListSection title="Wins" items={report.wins} empty="No wins recorded for this report." />
        <ListSection title="Watchouts" items={report.watchouts} empty="No watchouts recorded for this report." />
        <ListSection title="Recommended Next Steps" items={report.next_steps} empty="No next steps recorded for this report." />
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

function SummarySection({ title, unavailable, summary, commentary, metrics }: {
  title: string;
  unavailable: string;
  summary: Record<string, unknown> | null;
  commentary: string | null;
  metrics: Array<{ label: string; value: string }>;
}) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">{title}</h2>
      {commentary ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/65">{commentary}</p> : null}
      {summary ? (
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
          <JsonHighlights summary={summary} />
        </div>
      ) : (
        <div className="mt-4"><EmptyState>{unavailable}</EmptyState></div>
      )}
    </Card>
  );
}

function ListSection({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/65">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <div className="mt-4"><EmptyState>{empty}</EmptyState></div>
      )}
    </Card>
  );
}

function JsonHighlights({ summary }: { summary: Record<string, unknown> }) {
  const entries = Object.entries(summary)
    .filter(([, value]) => Array.isArray(value) || (value && typeof value === "object"))
    .slice(0, 4);

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

function overviewMetrics(report: MonthlyReport) {
  return [
    ...paidAdsMetrics(report.paid_ads_summary).slice(0, 4),
    ...seoMetrics(report.seo_summary).slice(0, 4)
  ];
}

function paidAdsMetrics(summary: Record<string, unknown> | null) {
  if (!summary) return [];
  return compactMetrics([
    ["Spend", formatCurrency(readNumber(summary, "spend", "total_spend"))],
    ["Revenue", formatCurrency(readNumber(summary, "revenue", "conversion_value", "total_revenue"))],
    ["ROAS", formatMultiplier(readNumber(summary, "roas"))],
    ["CPA", formatCurrency(readNumber(summary, "cpa"))],
    ["Conversions", formatCount(readNumber(summary, "conversions"))],
    ["Clicks", formatCount(readNumber(summary, "clicks"))],
    ["CPC", formatCurrencyCents(readNumber(summary, "cpc"))],
    ["CTR", formatRatio(readNumber(summary, "ctr"))]
  ]);
}

function seoMetrics(summary: Record<string, unknown> | null) {
  if (!summary) return [];
  return compactMetrics([
    ["Organic clicks", formatCount(readNumber(summary, "organic_clicks", "clicks"))],
    ["Organic impressions", formatCount(readNumber(summary, "organic_impressions", "impressions"))],
    ["Organic CTR", formatRatio(readNumber(summary, "organic_ctr", "ctr"))],
    ["Average position", formatDecimal(readNumber(summary, "average_position", "position"))],
    ["Organic sessions", formatCount(readNumber(summary, "organic_sessions", "sessions"))],
    ["Outbound clicks", formatCount(readNumber(summary, "outbound_clicks"))],
    ["Outbound click rate", formatRatio(readNumber(summary, "outbound_click_rate"))],
    ["Indexed pages", formatCount(readNumber(summary, "indexed_pages"))]
  ]);
}

function momMetrics(summary: Record<string, unknown> | null) {
  if (!summary) return [];
  return compactMetrics([
    ["Spend MoM", formatChange(readNumber(summary, "spend_mom", "spend_change"))],
    ["Conversions MoM", formatChange(readNumber(summary, "conversions_mom", "conversions_change"))],
    ["CPA MoM", formatChange(readNumber(summary, "cpa_mom", "cpa_change"))],
    ["ROAS MoM", formatChange(readNumber(summary, "roas_mom", "roas_change"))],
    ["Revenue MoM", formatChange(readNumber(summary, "revenue_mom", "revenue_change"))],
    ["Organic clicks MoM", formatChange(readNumber(summary, "organic_clicks_mom", "organic_clicks_change"))],
    ["Organic impressions MoM", formatChange(readNumber(summary, "organic_impressions_mom", "organic_impressions_change"))],
    ["Outbound clicks MoM", formatChange(readNumber(summary, "outbound_clicks_mom", "outbound_clicks_change"))]
  ]);
}

function compactMetrics(rows: Array<[string, string]>) {
  return rows.map(([label, value]) => ({ label, value })).filter((item) => item.value !== "Not available");
}

function readNumber(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    const number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : null;
    if (number !== null && Number.isFinite(number)) return number;
  }
  return null;
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
