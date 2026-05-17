import { PlatformBreakdown, TrendChart } from "@/components/charts";
import { DateRangePicker } from "@/components/date-range-picker";
import { Badge, Card, EmptyState, StatCard, Table } from "@/components/ui";
import { getPaidAdsDashboardData, metricRatios, percentChange } from "@/lib/data";
import { compact, currency, pct } from "@/lib/utils";
import type { AdDailyPerformance, CampaignDailyPerformance, DailyPerformance } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<{ range?: string; start?: string; end?: string }>;
};

export default async function PaidAdsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { range, daily, campaigns, ads, totals, previousTotals, status, campaignStatus, adStatus } = await getPaidAdsDashboardData(params?.range, params?.start, params?.end);
  const ratios = metricRatios(totals);
  const previousRatios = metricRatios(previousTotals);
  const hasData = !status.error && !status.isEmpty;
  const tileState = status.error ? "error" : hasData ? "ready" : "empty";
  const rows = channelRows(daily);
  const campaignRows = aggregateCampaignRows(campaigns);
  const adRows = aggregateAdRows(ads);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge>Paid media</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Paid Ads Performance</h1>
          <p className="mt-2 text-sm text-white/50">{range.label}</p>
        </div>
        <DateRangePicker range={range} />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Spend" value={hasData ? currency.format(totals.spend) : "Unavailable"} helper={trendHelper(percentChange(totals.spend, previousTotals.spend))} state={tileState} />
        <StatCard label="Revenue" value={hasData ? currency.format(totals.revenue) : "Unavailable"} helper={trendHelper(percentChange(totals.revenue, previousTotals.revenue))} state={tileState} />
        <StatCard label="Conversions" value={hasData ? compact.format(totals.conversions) : "Unavailable"} helper={trendHelper(percentChange(totals.conversions, previousTotals.conversions))} state={tileState} />
        <StatCard label="ROAS" value={ratios.roas === null ? "Unavailable" : `${ratios.roas.toFixed(2)}x`} helper={trendHelper(percentChange(ratios.roas, previousRatios.roas))} state={status.error ? "error" : ratios.roas === null ? "empty" : "ready"} />
        <StatCard label="CPA" value={ratios.cpa === null ? "Unavailable" : currency.format(ratios.cpa)} state={status.error ? "error" : ratios.cpa === null ? "empty" : "ready"} />
        <StatCard label="Clicks" value={hasData ? compact.format(totals.clicks) : "Unavailable"} state={tileState} />
        <StatCard label="Impressions" value={hasData ? compact.format(totals.impressions) : "Unavailable"} state={tileState} />
        <StatCard label="CTR / CPC" value={ratios.ctr === null || ratios.cpc === null ? "Unavailable" : `${pct(ratios.ctr * 100)} / ${currency.format(ratios.cpc)}`} state={status.error ? "error" : ratios.ctr === null || ratios.cpc === null ? "empty" : "ready"} />
      </div>

      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load paid ads data: {status.error}</Card> : null}
      {campaignStatus.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load campaign data: {campaignStatus.error}</Card> : null}
      {adStatus.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load ad data: {adStatus.error}</Card> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card><h2 className="mb-4 text-lg font-semibold">CPA over time</h2>{hasData ? <TrendChart data={daily} metric="cpa" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-4 text-lg font-semibold">ROAS over time</h2>{hasData ? <TrendChart data={daily} metric="roas" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Platform breakdown</h2>{hasData ? <PlatformBreakdown data={daily} /> : <EmptyState />}</Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Channel mix</h2>
          <Table headers={["Platform", "Channel", "Spend", "Revenue", "Conv.", "CPA", "ROAS", "CTR", "CPC"]} rows={rows.map((item) => [
            item.platform,
            item.channel ?? "Unspecified",
            currency.format(item.spend),
            currency.format(item.revenue),
            compact.format(item.conversions),
            item.cpa === null ? "Unavailable" : currency.format(item.cpa),
            item.roas === null ? "Unavailable" : `${item.roas.toFixed(2)}x`,
            item.ctr === null ? "Unavailable" : pct(item.ctr * 100),
            item.cpc === null ? "Unavailable" : currency.format(item.cpc)
          ])} />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Campaign comparison</h2>
          <Table headers={["Campaign", "Platform", "Channel", "Spend", "Revenue", "Conv.", "CPA", "ROAS"]} rows={campaignRows.map((item) => [
            item.campaign_name ?? item.campaign_id,
            item.platform,
            item.channel ?? "Unspecified",
            currency.format(item.spend),
            currency.format(item.revenue),
            compact.format(item.conversions),
            item.cpa === null ? "Unavailable" : currency.format(item.cpa),
            item.roas === null ? "Unavailable" : `${item.roas.toFixed(2)}x`
          ])} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top campaigns by ROAS</h2>
          <Table headers={["Campaign", "ROAS", "Revenue", "Spend", "Conv."]} rows={[...campaignRows].filter((item) => item.roas !== null).sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0)).slice(0, 8).map((item) => [
            item.campaign_name ?? item.campaign_id,
            `${item.roas?.toFixed(2)}x`,
            currency.format(item.revenue),
            currency.format(item.spend),
            compact.format(item.conversions)
          ])} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top campaigns by conversions</h2>
          <Table headers={["Campaign", "Conv.", "CPA", "Spend", "ROAS"]} rows={[...campaignRows].sort((a, b) => b.conversions - a.conversions).slice(0, 8).map((item) => [
            item.campaign_name ?? item.campaign_id,
            compact.format(item.conversions),
            item.cpa === null ? "Unavailable" : currency.format(item.cpa),
            currency.format(item.spend),
            item.roas === null ? "Unavailable" : `${item.roas.toFixed(2)}x`
          ])} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Worst campaigns by wasted spend</h2>
          <Table headers={["Campaign", "Wasted spend", "Spend", "Conv.", "CPA"]} rows={[...campaignRows].sort((a, b) => effectiveWastedSpend(b) - effectiveWastedSpend(a)).slice(0, 8).map((item) => [
            item.campaign_name ?? item.campaign_id,
            currency.format(effectiveWastedSpend(item)),
            currency.format(item.spend),
            compact.format(item.conversions),
            item.cpa === null ? "Unavailable" : currency.format(item.cpa)
          ])} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Top ads by performance</h2>
        <Table headers={["Ad", "Campaign", "Platform", "ROAS", "Conv.", "Spend", "CTR", "Preview"]} rows={adRows.map((item) => [
          item.ad_name ?? item.creative_name ?? item.ad_id,
          item.campaign_name ?? item.campaign_id ?? "Unspecified",
          item.platform,
          item.roas === null ? "Unavailable" : `${item.roas.toFixed(2)}x`,
          compact.format(item.conversions),
          currency.format(item.spend),
          item.ctr === null ? "Unavailable" : pct(item.ctr * 100),
          item.creative_preview_url ? <a href={item.creative_preview_url} className="text-accent hover:underline" target="_blank" rel="noreferrer">Open</a> : "Unavailable"
        ])} />
      </Card>
    </div>
  );
}

function aggregateCampaignRows(rows: CampaignDailyPerformance[]) {
  const byCampaign = rows.reduce<Record<string, CampaignDailyPerformance>>((acc, row) => {
    const key = `${row.platform}|${row.campaign_id}`;
    acc[key] ??= { ...row, spend: 0, revenue: 0, conversions: 0, clicks: 0, impressions: 0, wasted_spend: 0, cpa: null, roas: null, ctr: null, cpc: null };
    acc[key].spend += row.spend;
    acc[key].revenue += row.revenue;
    acc[key].conversions += row.conversions;
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

function aggregateAdRows(rows: AdDailyPerformance[]) {
  const byAd = rows.reduce<Record<string, AdDailyPerformance>>((acc, row) => {
    const key = `${row.platform}|${row.ad_id}`;
    acc[key] ??= { ...row, spend: 0, revenue: 0, conversions: 0, clicks: 0, impressions: 0, cpa: null, roas: null, ctr: null, cpc: null };
    acc[key].spend += row.spend;
    acc[key].revenue += row.revenue;
    acc[key].conversions += row.conversions;
    acc[key].clicks += row.clicks;
    acc[key].impressions += row.impressions;
    acc[key].cpa = acc[key].conversions > 0 ? acc[key].spend / acc[key].conversions : null;
    acc[key].roas = acc[key].spend > 0 ? acc[key].revenue / acc[key].spend : null;
    acc[key].ctr = acc[key].impressions > 0 ? acc[key].clicks / acc[key].impressions : null;
    acc[key].cpc = acc[key].clicks > 0 ? acc[key].spend / acc[key].clicks : null;
    return acc;
  }, {});

  return Object.values(byAd).sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0) || b.conversions - a.conversions || b.spend - a.spend).slice(0, 12);
}

function effectiveWastedSpend(row: CampaignDailyPerformance) {
  return row.wasted_spend > 0 ? row.wasted_spend : row.conversions === 0 ? row.spend : 0;
}

function trendHelper(change: number | null) {
  if (change === null) return undefined;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% vs prior period`;
}

function channelRows(rows: DailyPerformance[]) {
  const byChannel = rows.reduce<Record<string, DailyPerformance>>((acc, row) => {
    const key = `${row.platform}|${row.channel ?? ""}`;
    acc[key] ??= { ...row, spend: 0, revenue: 0, conversions: 0, clicks: 0, impressions: 0, cpa: null, roas: null, ctr: null, cpc: null };
    acc[key].spend += row.spend;
    acc[key].revenue += row.revenue;
    acc[key].conversions += row.conversions;
    acc[key].clicks += row.clicks;
    acc[key].impressions += row.impressions;
    acc[key].cpa = acc[key].conversions > 0 ? acc[key].spend / acc[key].conversions : null;
    acc[key].roas = acc[key].spend > 0 ? acc[key].revenue / acc[key].spend : null;
    acc[key].ctr = acc[key].impressions > 0 ? acc[key].clicks / acc[key].impressions : null;
    acc[key].cpc = acc[key].clicks > 0 ? acc[key].spend / acc[key].clicks : null;
    return acc;
  }, {});

  return Object.values(byChannel).sort((a, b) => b.spend - a.spend);
}
