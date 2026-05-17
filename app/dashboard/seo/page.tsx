import { DateRangePicker } from "@/components/date-range-picker";
import { Badge, Card, EmptyState, MetricGrid, StatCard, Table } from "@/components/ui";
import { getSeoDashboardData } from "@/lib/data";
import { compact, pct } from "@/lib/utils";

type PageProps = {
  searchParams?: Promise<{ range?: string; start?: string; end?: string }>;
};

export default async function SeoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { range, totals, topQueries, topPages, status } = await getSeoDashboardData(params?.range, params?.start, params?.end);
  const hasData = !status.error && !status.isEmpty;
  const tileState = status.error ? "error" : hasData ? "ready" : "empty";
  const conversionRate = totals.organicSessions && totals.organicConversions !== null ? totals.organicConversions / totals.organicSessions : null;
  const opportunities = organicOpportunities(topQueries, topPages);

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <Badge>Organic visibility</Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:mt-3 sm:text-3xl">SEO Dashboard</h1>
          <p className="mt-1.5 text-xs text-white/50 sm:mt-2 sm:text-sm">{range.label}</p>
        </div>
        <DateRangePicker range={range} />
      </header>

      <MetricGrid>
        <StatCard label="Organic clicks" value={totals.organicClicks === null ? "Unavailable" : compact.format(totals.organicClicks)} state={tileState} />
        <StatCard label="Organic impressions" value={totals.organicImpressions === null ? "Unavailable" : compact.format(totals.organicImpressions)} state={tileState} />
        <StatCard label="Organic CTR" value={totals.ctr === null ? "Unavailable" : pct(totals.ctr * 100)} state={status.error ? "error" : totals.ctr === null ? "empty" : "ready"} />
        <StatCard label="Average position" value={totals.averagePosition === null ? "Unavailable" : totals.averagePosition.toFixed(1)} state={status.error ? "error" : totals.averagePosition === null ? "empty" : "ready"} />
        <StatCard label="Organic sessions" value={totals.organicSessions === null ? "Unavailable" : compact.format(totals.organicSessions)} state={tileState} />
        <StatCard label="Organic conversions" value={totals.organicConversions === null ? "Unavailable" : compact.format(totals.organicConversions)} state={tileState} />
        <StatCard label="Indexed pages" value={totals.indexedPages === null ? "Unavailable" : compact.format(totals.indexedPages)} state={status.error ? "error" : totals.indexedPages === null ? "empty" : "ready"} />
        <StatCard label="Organic conv. rate" value={conversionRate === null ? "Unavailable" : pct(conversionRate * 100)} state={status.error ? "error" : conversionRate === null ? "empty" : "ready"} />
      </MetricGrid>

      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load SEO data: {status.error}</Card> : null}

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Top queries</h2>
          <Table headers={["Query", "Clicks", "Impressions", "Position"]} rows={topQueries.map((item) => [item.query, compact.format(item.clicks), compact.format(item.impressions), item.position.toFixed(1)])} />
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Top landing pages</h2>
          <Table headers={["Page", "Clicks", "Sessions", "Conv."]} rows={topPages.map((item) => [item.page, compact.format(item.clicks), compact.format(item.sessions), compact.format(item.conversions)])} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Organic growth opportunities</h2>
        {opportunities.length > 0 ? (
          <Table headers={["Opportunity", "Signal", "Why it matters"]} rows={opportunities.map((item) => [
            item.name,
            item.signal,
            item.reason
          ])} />
        ) : (
          <EmptyState>No organic growth opportunities found for this date range yet.</EmptyState>
        )}
      </Card>
    </div>
  );
}

type QueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
};

type PageRow = {
  page: string;
  clicks: number;
  sessions: number;
  conversions: number;
};

function organicOpportunities(topQueries: QueryRow[], topPages: PageRow[]) {
  const queryOpportunities = topQueries
    .filter((item) => item.impressions >= 10 && item.position > 3)
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position)
    .slice(0, 4)
    .map((item) => ({
      name: item.query,
      signal: `${compact.format(item.impressions)} impressions, position ${item.position.toFixed(1)}`,
      reason: "Search demand is already showing; improving this ranking could unlock more qualified visits."
    }));

  const pageOpportunities = topPages
    .filter((item) => item.clicks > 0 && item.conversions === 0)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 4)
    .map((item) => ({
      name: item.page,
      signal: `${compact.format(item.clicks)} clicks, 0 conversions`,
      reason: "This page is attracting organic traffic and may need a stronger offer, form, or call to action."
    }));

  return [...queryOpportunities, ...pageOpportunities].slice(0, 8);
}
