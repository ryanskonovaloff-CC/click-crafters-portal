import { CalendarDays } from "lucide-react";
import { PlatformBreakdown, TrendChart } from "@/components/charts";
import { DateRangePicker } from "@/components/date-range-picker";
import { LogoutButton } from "@/components/logout-button";
import { AccentText, Badge, Card, EmptyState, MetricGrid, StatCard, Table } from "@/components/ui";
import { getOverviewDashboardData, metricRatios, percentChange } from "@/lib/data";
import { compact, currency } from "@/lib/utils";
import type { CampaignDailyPerformance, DailyPerformance } from "@/lib/types";

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
  const paidChannelRows = channelRows(paid.daily);
  const campaignRows = aggregateCampaignRows(paid.campaigns);
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
        <StatCard label={<AccentText>Store visits</AccentText>} value={hasStoreVisitData && performance.store_visits !== null ? compact.format(performance.store_visits) : "Unavailable"} state={paid.status.error ? "error" : hasStoreVisitData ? "ready" : "empty"} />
        <StatCard label={<AccentText>Estimated total revenue</AccentText>} value={estimatedTotalRevenue === null ? "Unavailable" : currency.format(estimatedTotalRevenue)} state={paid.status.error ? "error" : estimatedTotalRevenue === null ? "empty" : "ready"} />
        <StatCard label={<AccentText>Estimated blended ROAS</AccentText>} value={estimatedBlendedRoas === null ? "Unavailable" : `${estimatedBlendedRoas.toFixed(2)}x`} state={paid.status.error ? "error" : estimatedBlendedRoas === null ? "empty" : "ready"} />
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
        <Table headers={["Platform", "Channel", "Spend", "Revenue", "Est. total rev.", "Conv.", "ROAS", "Est. blended ROAS"]} rows={paidChannelRows.slice(0, 6).map((item) => [
          item.platform,
          item.channel ?? "Unspecified",
          currency.format(item.spend),
          currency.format(item.revenue),
          item.estimatedTotalRevenue === null ? "Unavailable" : currency.format(item.estimatedTotalRevenue),
          compact.format(item.conversions),
          item.roas === null ? "Unavailable" : `${item.roas.toFixed(2)}x`,
          item.estimatedBlendedRoas === null ? "Unavailable" : `${item.estimatedBlendedRoas.toFixed(2)}x`
        ])} />
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Campaign</AccentText> performance</h2>
        {paid.campaignStatus.error ? (
          <div className="rounded-lg border border-red-400/30 bg-red-950/20 px-4 py-3 text-sm text-red-100/80">Unable to load campaign data: {paid.campaignStatus.error}</div>
        ) : campaignRows.length > 0 ? (
          <Table headers={["Campaign", "Platform", "Channel", "Spend", "Revenue", "Conv.", "ROAS", "CPA"]} rows={campaignRows.slice(0, 8).map((item) => [
            item.campaign_name ?? item.campaign_id,
            item.platform,
            item.channel ?? "Unspecified",
            currency.format(item.spend),
            currency.format(item.revenue),
            compact.format(item.conversions),
            item.roas === null ? "Unavailable" : `${item.roas.toFixed(2)}x`,
            item.cpa === null ? "Unavailable" : currency.format(item.cpa)
          ])} />
        ) : (
          <EmptyState>No campaign data available for this date range yet.</EmptyState>
        )}
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
  const byChannel = rows.reduce<Record<string, DailyPerformance>>((acc, row) => {
    const key = `${row.platform}|${row.channel ?? ""}`;
    acc[key] ??= { ...row, spend: 0, revenue: 0, conversions: 0, store_visits: 0, clicks: 0, impressions: 0, cpa: null, roas: null, ctr: null, cpc: null };
    acc[key].spend += row.spend;
    acc[key].revenue += row.revenue;
    acc[key].conversions += row.conversions;
    acc[key].store_visits = (acc[key].store_visits ?? 0) + (row.store_visits ?? 0);
    acc[key].clicks += row.clicks;
    acc[key].impressions += row.impressions;
    acc[key].cpa = acc[key].conversions > 0 ? acc[key].spend / acc[key].conversions : null;
    acc[key].roas = acc[key].spend > 0 ? acc[key].revenue / acc[key].spend : null;
    return acc;
  }, {});

  return Object.values(byChannel).map(withEstimatedRevenue).sort((a, b) => b.spend - a.spend);
}

function aggregateCampaignRows(rows: CampaignDailyPerformance[]) {
  const byCampaign = rows.reduce<Record<string, CampaignDailyPerformance>>((acc, row) => {
    const key = `${row.platform}|${row.campaign_id}`;
    acc[key] ??= { ...row, spend: 0, revenue: 0, conversions: 0, store_visits: 0, clicks: 0, impressions: 0, wasted_spend: 0, cpa: null, roas: null, ctr: null, cpc: null };
    acc[key].spend += row.spend;
    acc[key].revenue += row.revenue;
    acc[key].conversions += row.conversions;
    acc[key].store_visits = (acc[key].store_visits ?? 0) + (row.store_visits ?? 0);
    acc[key].clicks += row.clicks;
    acc[key].impressions += row.impressions;
    acc[key].wasted_spend += row.wasted_spend;
    acc[key].cpa = acc[key].conversions > 0 ? acc[key].spend / acc[key].conversions : null;
    acc[key].roas = acc[key].spend > 0 ? acc[key].revenue / acc[key].spend : null;
    acc[key].ctr = acc[key].impressions > 0 ? acc[key].clicks / acc[key].impressions : null;
    acc[key].cpc = acc[key].clicks > 0 ? acc[key].spend / acc[key].clicks : null;
    return acc;
  }, {});

  return Object.values(byCampaign).sort((a, b) => b.spend - a.spend);
}

function withEstimatedRevenue(row: DailyPerformance) {
  const estimatedPurchases = estimatedInStorePurchases(row);
  const estimatedInStoreRevenue = estimatedPurchases === null ? null : estimatedPurchases * IN_STORE_AOV;
  const estimatedTotalRevenue = estimatedInStoreRevenue === null ? null : row.revenue + estimatedInStoreRevenue;
  const estimatedBlendedRoas = estimatedTotalRevenue === null || row.spend <= 0 ? null : estimatedTotalRevenue / row.spend;
  return {
    ...row,
    estimatedTotalRevenue,
    estimatedBlendedRoas
  };
}
