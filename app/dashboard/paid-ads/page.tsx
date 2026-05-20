import { ExternalLink } from "lucide-react";
import { PlatformBreakdown, TrendChart } from "@/components/charts";
import { DateRangePicker } from "@/components/date-range-picker";
import { Badge, Card, EmptyState, MetricGrid, StatCard, Table } from "@/components/ui";
import { getPaidAdsDashboardData, metricRatios, percentChange } from "@/lib/data";
import { compact, currency, currencyCents, pct } from "@/lib/utils";
import type { AdLifetimePerformance, CampaignDailyPerformance, DailyPerformance } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<{ range?: string; start?: string; end?: string }>;
};

export default async function PaidAdsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { range, daily, campaigns, lifetimeAds, totals, previousTotals, status, campaignStatus, lifetimeAdStatus } = await getPaidAdsDashboardData(params?.range, params?.start, params?.end);
  const ratios = metricRatios(totals);
  const previousRatios = metricRatios(previousTotals);
  const hasData = !status.error && !status.isEmpty;
  const tileState = status.error ? "error" : hasData ? "ready" : "empty";
  const rows = channelRows(daily);
  const campaignRows = aggregateCampaignRows(campaigns);
  const topRoasRows = topCampaignsByRoas(campaignRows);
  const topConversionRows = topCampaignsByConversions(campaignRows);
  const campaignWatchRows = campaignsToWatch(campaignRows, [...topRoasRows, ...topConversionRows]);
  const adRows = topLifetimeAdRows(lifetimeAds);

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <Badge>Paid media</Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:mt-3 sm:text-3xl">Paid Ads Performance</h1>
          <p className="mt-1.5 text-xs text-white/50 sm:mt-2 sm:text-sm">{range.label}</p>
        </div>
        <DateRangePicker range={range} />
      </header>

      <MetricGrid>
        <StatCard label="Spend" value={hasData ? currency.format(totals.spend) : "Unavailable"} helper={trendHelper(percentChange(totals.spend, previousTotals.spend))} state={tileState} />
        <StatCard label="Revenue" value={hasData ? currency.format(totals.revenue) : "Unavailable"} helper={trendHelper(percentChange(totals.revenue, previousTotals.revenue))} state={tileState} />
        <StatCard label="Conversions" value={hasData ? compact.format(totals.conversions) : "Unavailable"} helper={trendHelper(percentChange(totals.conversions, previousTotals.conversions))} state={tileState} />
        <StatCard label="ROAS" value={ratios.roas === null ? "Unavailable" : `${ratios.roas.toFixed(2)}x`} helper={trendHelper(percentChange(ratios.roas, previousRatios.roas))} state={status.error ? "error" : ratios.roas === null ? "empty" : "ready"} />
        <StatCard label="CPA" value={ratios.cpa === null ? "Unavailable" : currency.format(ratios.cpa)} state={status.error ? "error" : ratios.cpa === null ? "empty" : "ready"} />
        <StatCard label="Clicks" value={hasData ? compact.format(totals.clicks) : "Unavailable"} state={tileState} />
        <StatCard label="Impressions" value={hasData ? compact.format(totals.impressions) : "Unavailable"} state={tileState} />
        <StatCard label="CTR / CPC" value={ratios.ctr === null || ratios.cpc === null ? "Unavailable" : `${pct(ratios.ctr * 100)} / ${currencyCents.format(ratios.cpc)}`} state={status.error ? "error" : ratios.ctr === null || ratios.cpc === null ? "empty" : "ready"} />
      </MetricGrid>

      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load paid ads data: {status.error}</Card> : null}
      {campaignStatus.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load campaign data: {campaignStatus.error}</Card> : null}
      {lifetimeAdStatus.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load lifetime ad data: {lifetimeAdStatus.error}</Card> : null}

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">CPA over time</h2>{hasData ? <TrendChart data={daily} metric="cpa" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">ROAS over time</h2>{hasData ? <TrendChart data={daily} metric="roas" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Platform breakdown</h2>{hasData ? <PlatformBreakdown data={daily} /> : <EmptyState />}</Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Channel mix</h2>
          <Table headers={["Platform", "Channel", "Spend", "Revenue", "Conv.", "CPA", "ROAS", "CTR", "CPC"]} rows={rows.map((item) => [
            item.platform,
            item.channel ?? "Unspecified",
            currency.format(item.spend),
            currency.format(item.revenue),
            compact.format(item.conversions),
            item.cpa === null ? "Unavailable" : currency.format(item.cpa),
            item.roas === null ? "Unavailable" : `${item.roas.toFixed(2)}x`,
            item.ctr === null ? "Unavailable" : pct(item.ctr * 100),
            item.cpc === null ? "Unavailable" : currencyCents.format(item.cpc)
          ])} />
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Campaign comparison</h2>
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
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Top campaigns by ROAS</h2>
          <Table headers={["Campaign", "ROAS", "Revenue", "Spend", "Conv."]} rows={topRoasRows.map((item) => [
            item.campaign_name ?? item.campaign_id,
            `${item.roas?.toFixed(2)}x`,
            currency.format(item.revenue),
            currency.format(item.spend),
            compact.format(item.conversions)
          ])} />
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Top campaigns by conversions</h2>
          <Table headers={["Campaign", "Conv.", "CPA", "Spend", "ROAS"]} rows={topConversionRows.map((item) => [
            item.campaign_name ?? item.campaign_id,
            compact.format(item.conversions),
            item.cpa === null ? "Unavailable" : currency.format(item.cpa),
            currency.format(item.spend),
            item.roas === null ? "Unavailable" : `${item.roas.toFixed(2)}x`
          ])} />
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Campaigns to watch</h2>
          <Table headers={["Campaign", "Wasted spend", "Spend", "Conv.", "CPA"]} rows={campaignWatchRows.map((item) => [
            item.campaign_name ?? item.campaign_id,
            currency.format(effectiveWastedSpend(item)),
            currency.format(item.spend),
            compact.format(item.conversions),
            item.cpa === null ? "Unavailable" : currency.format(item.cpa)
          ])} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Top ads by performance</h2>
        {adRows.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
            {adRows.map((item) => <AdPerformanceCard key={`${item.platform}-${item.ad_id}`} ad={item} />)}
          </div>
        ) : (
          <EmptyState>No data available for this date range yet.</EmptyState>
        )}
      </Card>
    </div>
  );
}

function AdPerformanceCard({ ad }: { ad: AdLifetimePerformance }) {
  const previewUrl = ad.preview_url ?? ad.creative_preview_url ?? ad.final_url;
  const imageUrl = ad.thumbnail_url ?? ad.image_url;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-black/20">
      <div className="grid aspect-[16/9] place-items-center border-b border-white/10 bg-black/25">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="px-4 text-center text-sm text-white/40">Preview unavailable</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{ad.platform}</Badge>
            {ad.channel ? <Badge>{ad.channel}</Badge> : null}
          </div>
          <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-white">{adTitle(ad)}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/50">{ad.campaign_name ?? ad.campaign_id ?? "Unspecified campaign"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <AdMetric label="Spend" value={currency.format(ad.spend)} />
          <AdMetric label="Conversions" value={compact.format(ad.conversions)} />
          <AdMetric label="ROAS" value={ad.roas === null ? "Unavailable" : `${ad.roas.toFixed(2)}x`} />
          <AdMetric label="CTR" value={ad.ctr === null ? "Unavailable" : pct(ad.ctr * 100)} />
          <AdMetric label="CPA" value={ad.cpa === null ? "Unavailable" : currency.format(ad.cpa)} />
          <AdMetric label="Revenue" value={currency.format(ad.revenue)} />
        </div>

        {previewUrl ? (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-accent/45 bg-accent/10 px-3 py-2 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent/15"
          >
            Open Preview <ExternalLink size={14} />
          </a>
        ) : (
          <div className="mt-auto rounded-lg border border-white/10 px-3 py-2 text-center text-sm text-white/35">Preview unavailable</div>
        )}
      </div>
    </article>
  );
}

function AdMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-panelStrong/60 p-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-white/40">{label}</p>
      <p className="mt-1 break-words font-semibold text-white/85">{value}</p>
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

function topLifetimeAdRows(rows: AdLifetimePerformance[]) {
  const byPlatform = rows.reduce<Record<string, AdLifetimePerformance[]>>((acc, row) => {
    acc[row.platform] ??= [];
    acc[row.platform].push(row);
    return acc;
  }, {});

  return Object.values(byPlatform)
    .flatMap((platformRows) => [...platformRows].sort(compareAdsByPerformance).slice(0, Math.min(6, Math.max(3, platformRows.length))))
    .sort(compareAdsByPerformance)
    .slice(0, 12);
}

function compareAdsByPerformance(a: AdLifetimePerformance, b: AdLifetimePerformance) {
  const hasRevenue = a.revenue > 0 || b.revenue > 0;
  if (hasRevenue) return (b.roas ?? -1) - (a.roas ?? -1) || b.conversions - a.conversions || b.spend - a.spend;
  if (a.conversions !== b.conversions) return b.conversions - a.conversions;
  return b.spend - a.spend;
}

function adTitle(ad: AdLifetimePerformance) {
  const candidates = [ad.ad_name, ad.headline, ad.creative_name]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  const nonUrl = candidates.find((value) => !isUrlLike(value));
  if (nonUrl) return nonUrl;
  const fallbackUrl = ad.final_url ?? candidates.find(isUrlLike);
  return fallbackUrl ? readableUrl(fallbackUrl) : `Ad ${ad.ad_id}`;
}

function isUrlLike(value: string) {
  return /^https?:\/\//i.test(value) || /^[\w.-]+\.[a-z]{2,}/i.test(value);
}

function readableUrl(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return `${url.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return value.length > 42 ? `${value.slice(0, 39)}...` : value;
  }
}

function campaignKey(row: CampaignDailyPerformance) {
  return `${row.platform}|${row.campaign_id}`;
}

function topCampaignsByRoas(rows: CampaignDailyPerformance[]) {
  return [...rows]
    .filter((item) => item.roas !== null && item.spend > 0)
    .sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0) || b.revenue - a.revenue)
    .slice(0, 8);
}

function topCampaignsByConversions(rows: CampaignDailyPerformance[]) {
  return [...rows]
    .filter((item) => item.conversions > 0)
    .sort((a, b) => b.conversions - a.conversions || (a.cpa ?? Number.MAX_SAFE_INTEGER) - (b.cpa ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 8);
}

function campaignsToWatch(rows: CampaignDailyPerformance[], topRows: CampaignDailyPerformance[]) {
  const topKeys = new Set(topRows.map(campaignKey));
  return [...rows]
    .filter((item) => !topKeys.has(campaignKey(item)))
    .filter((item) => effectiveWastedSpend(item) > 0)
    .sort((a, b) => effectiveWastedSpend(b) - effectiveWastedSpend(a) || b.spend - a.spend)
    .slice(0, 8);
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
