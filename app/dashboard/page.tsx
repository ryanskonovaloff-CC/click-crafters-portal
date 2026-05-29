import { CalendarDays } from "lucide-react";
import { PlatformBreakdown, TrendChart } from "@/components/charts";
import { DateRangePicker } from "@/components/date-range-picker";
import { LogoutButton } from "@/components/logout-button";
import { AccentText, Badge, Card, EmptyState, MetricGrid, StatCard, Table } from "@/components/ui";
import { getOverviewDashboardData, metricRatios, percentChange } from "@/lib/data";
import { compact, currency } from "@/lib/utils";
import type { DailyPerformance } from "@/lib/types";

const IN_STORE_AOV = 24.87;

type PageProps = {
  searchParams?: Promise<{ range?: string; start?: string; end?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { client, range, latestDataUpdatedAt, paid, seo, performance } = await getOverviewDashboardData(params?.range, params?.start, params?.end);
  const ratios = metricRatios(performance);
  const paidRatios = metricRatios(paid.totals);
  const previousPaidRatios = metricRatios(paid.previousTotals);
  const hasPaidData = !paid.status.error && !paid.status.isEmpty;
  const hasStoreVisitData = paid.daily.some((item) => item.store_visits !== null);
  const inStorePurchases = estimatedInStorePurchases(performance);
  const inStoreRevenue = inStorePurchases === null ? null : inStorePurchases * IN_STORE_AOV;
  const estimatedTotalRevenue = inStoreRevenue === null ? null : performance.revenue + inStoreRevenue;
  const estimatedBlendedRoas = estimatedTotalRevenue === null || performance.spend <= 0 ? null : estimatedTotalRevenue / performance.spend;
  const hasOrganicVisibilityData = !seo.status.error && [
    seo.totals.organicClicks,
    seo.totals.organicImpressions,
    seo.totals.organicSessions,
    seo.totals.organicConversions
  ].some((value) => value !== null);
  const tileState = paid.status.error ? "error" : hasPaidData ? "ready" : "empty";

  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge>{client?.industry ?? "No client"}</Badge>
            <Badge className="gap-1"><CalendarDays size={13} /> {range.label}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:mt-3 sm:text-4xl">{client?.name ?? "No client assigned"}</h1>
          <p className="mt-1.5 text-xs text-white/50 sm:mt-2 sm:text-sm">Updated at {formatUpdatedAt(latestDataUpdatedAt ?? client?.last_updated_at ?? null)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker range={range} />
          <LogoutButton />
        </div>
      </header>

      <MetricGrid>
        <StatCard label={<><AccentText>Total spend</AccentText></>} value={hasPaidData ? currency.format(performance.spend) : "Unavailable"} helper={trendHelper("vs prior period", percentChange(paid.totals.spend, paid.previousTotals.spend))} state={paid.status.error ? "error" : hasPaidData ? "ready" : "empty"} />
        <StatCard label={<><AccentText>Total revenue</AccentText></>} value={hasPaidData ? currency.format(performance.revenue) : "Unavailable"} helper={trendHelper("vs prior period", percentChange(paid.totals.revenue, paid.previousTotals.revenue))} state={paid.status.error ? "error" : hasPaidData ? "ready" : "empty"} />
        <StatCard label={<AccentText>Conversions</AccentText>} value={hasPaidData ? compact.format(performance.conversions) : "Unavailable"} state={tileState} />
        <StatCard label={<AccentText>ROAS</AccentText>} value={paidRatios.roas === null ? "Unavailable" : `${paidRatios.roas.toFixed(2)}x`} helper={trendHelper("vs prior period", percentChange(paidRatios.roas, previousPaidRatios.roas))} state={paid.status.error ? "error" : paidRatios.roas === null ? "empty" : "ready"} />
        <StatCard label={<AccentText>CPA</AccentText>} value={ratios.cpa === null ? "Unavailable" : currency.format(ratios.cpa)} state={tileState} />
        <StatCard label="Store visits" value={hasStoreVisitData && performance.store_visits !== null ? compact.format(performance.store_visits) : "Unavailable"} state={paid.status.error ? "error" : hasStoreVisitData ? "ready" : "empty"} />
        <StatCard label="Estimated total revenue" value={estimatedTotalRevenue === null ? "Unavailable" : currency.format(estimatedTotalRevenue)} state={paid.status.error ? "error" : estimatedTotalRevenue === null ? "empty" : "ready"} />
        <StatCard label="Estimated blended ROAS" value={estimatedBlendedRoas === null ? "Unavailable" : `${estimatedBlendedRoas.toFixed(2)}x`} state={paid.status.error ? "error" : estimatedBlendedRoas === null ? "empty" : "ready"} />
      </MetricGrid>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Spend</AccentText> over time</h2>{hasPaidData ? <TrendChart data={paid.daily} metric="spend" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>ROAS</AccentText> over time</h2>{hasPaidData ? <TrendChart data={paid.daily} metric="roas" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Platform</AccentText> breakdown</h2>{hasPaidData ? <PlatformBreakdown data={paid.daily} /> : <EmptyState />}</Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Organic</AccentText> visibility</h2>
          {hasOrganicVisibilityData ? (
            <Table headers={["Metric", "Value"]} rows={[
              ["Organic clicks", compact.format(seo.totals.organicClicks ?? 0)],
              ["Organic impressions", compact.format(seo.totals.organicImpressions ?? 0)],
              ["Organic sessions", seo.totals.organicSessions === null ? "Unavailable" : compact.format(seo.totals.organicSessions)],
              ["Organic conversions", seo.totals.organicConversions === null ? "Unavailable" : compact.format(seo.totals.organicConversions)]
            ]} />
          ) : <EmptyState />}
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Paid</AccentText> channel performance</h2>
        <Table headers={["Platform", "Channel", "Spend", "Revenue", "Conv.", "ROAS"]} rows={channelRows(paid.daily).slice(0, 6).map((item) => [
          item.platform,
          item.channel ?? "Unspecified",
          currency.format(item.spend),
          currency.format(item.revenue),
          compact.format(item.conversions),
          item.roas === null ? "Unavailable" : `${item.roas.toFixed(2)}x`
        ])} />
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Campaign</AccentText> performance</h2>
        <EmptyState>No data available for this date range yet.</EmptyState>
      </Card>
    </div>
  );
}

function formatUpdatedAt(value: string | null) {
  return value ? new Date(value).toLocaleString() : "after setup";
}

function trendHelper(label: string, change: number | null) {
  if (change === null) return undefined;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% ${label}`;
}

function estimatedInStorePurchases(totals: { store_visits: number | null; conversions: number }) {
  if (totals.store_visits === null) return null;
  return Math.max(totals.store_visits - totals.conversions, 0);
}

function channelRows(rows: DailyPerformance[]) {
  const byChannel = rows.reduce<Record<string, { platform: string; channel: string | null; spend: number; revenue: number; conversions: number; roas: number | null }>>((acc, row) => {
    const key = `${row.platform}|${row.channel ?? ""}`;
    acc[key] ??= { platform: row.platform, channel: row.channel, spend: 0, revenue: 0, conversions: 0, roas: null };
    acc[key].spend += row.spend;
    acc[key].revenue += row.revenue;
    acc[key].conversions += row.conversions;
    acc[key].roas = acc[key].spend > 0 ? acc[key].revenue / acc[key].spend : null;
    return acc;
  }, {});

  return Object.values(byChannel).sort((a, b) => b.spend - a.spend);
}
