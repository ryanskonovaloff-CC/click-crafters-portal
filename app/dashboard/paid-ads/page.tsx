import { ExternalLink } from "lucide-react";
import { PlatformBreakdown, TrendChart } from "@/components/charts";
import { DateRangePicker } from "@/components/date-range-picker";
import { AccentText, Badge, Card, EmptyState, MetricGrid, StatCard, Table } from "@/components/ui";
import { getPaidAdsDashboardData, metricRatios, percentChange } from "@/lib/data";
import { cn, compact, currency, currencyCents } from "@/lib/utils";
import type { AdLifetimePerformance, CampaignDailyPerformance, DailyPerformance } from "@/lib/types";

const IN_STORE_AOV = 24.87;
const ONLINE_ORDER_TRACKING_START = "2026-05-14";

type EstimatedPerformanceRow<T extends DailyPerformance> = T & {
  onlineOrders: number;
  onlineRevenue: number;
  estimatedInStorePurchases: number | null;
  estimatedTotalRevenue: number | null;
  estimatedBlendedRoas: number | null;
  platformRoas: number | null;
  platformCpa: number | null;
};

type PageProps = {
  searchParams?: Promise<{ range?: string; start?: string; end?: string; compare?: string }>;
};

export default async function PaidAdsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const compare = params?.compare === "previous";
  const { range, daily, previousDaily, campaigns, lifetimeAds, totals, previousTotals, status, campaignStatus, lifetimeAdStatus } = await getPaidAdsDashboardData(params?.range, params?.start, params?.end);
  const ratios = metricRatios(totals);
  const previousRatios = metricRatios(previousTotals);
  const hasData = !status.error && !status.isEmpty;
  const tileState = status.error ? "error" : hasData ? "ready" : "empty";
  const hasStoreVisitData = daily.some((item) => item.store_visits !== null);
  const inStorePurchases = estimatedInStorePurchases(totals);
  const inStoreRevenue = inStorePurchases === null ? null : inStorePurchases * IN_STORE_AOV;
  const estimatedTotalRevenue = inStoreRevenue === null ? null : totals.revenue + inStoreRevenue;
  const estimatedBlendedRoas = estimatedTotalRevenue === null || totals.spend <= 0 ? null : estimatedTotalRevenue / totals.spend;
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
          <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:mt-3 sm:text-3xl">Paid Ads <AccentText>Performance</AccentText></h1>
          <p className="mt-1.5 text-xs text-white/50 sm:mt-2 sm:text-sm">{range.label}</p>
        </div>
        <DateRangePicker range={range} />
      </header>

      <MetricGrid>
        <StatCard label={<AccentText>Spend</AccentText>} value={hasData ? currency.format(totals.spend) : "Unavailable"} helper={trendHelper(percentChange(totals.spend, previousTotals.spend))} state={tileState} />
        <StatCard label={<AccentText>Revenue</AccentText>} value={hasData ? currency.format(totals.revenue) : "Unavailable"} helper={trendHelper(percentChange(totals.revenue, previousTotals.revenue))} state={tileState} />
        <StatCard label={<AccentText>Online orders</AccentText>} value={hasData ? compact.format(totals.conversions) : "Unavailable"} helper={trendHelper(percentChange(totals.conversions, previousTotals.conversions))} state={tileState} />
        <StatCard label={<AccentText>ROAS</AccentText>} value={ratios.roas === null ? "Unavailable" : `${ratios.roas.toFixed(2)}x`} helper={trendHelper(percentChange(ratios.roas, previousRatios.roas))} state={status.error ? "error" : ratios.roas === null ? "empty" : "ready"} />
        <StatCard label={<AccentText>CPA</AccentText>} value={ratios.cpa === null ? "Unavailable" : currency.format(ratios.cpa)} state={status.error ? "error" : ratios.cpa === null ? "empty" : "ready"} />
        <StatCard label={<AccentText>Store visits</AccentText>} value={hasStoreVisitData && totals.store_visits !== null ? compact.format(totals.store_visits) : "Unavailable"} helper={trendHelper(percentChange(totals.store_visits, previousTotals.store_visits))} state={status.error ? "error" : hasStoreVisitData ? "ready" : "empty"} />
        <StatCard label={<AccentText>Est. in-store purchases</AccentText>} value={inStorePurchases === null ? "Unavailable" : compact.format(Math.round(inStorePurchases))} helper="Store visits minus online conversions" state={status.error ? "error" : inStorePurchases === null ? "empty" : "ready"} />
        <StatCard label={<AccentText>Est. in-store revenue</AccentText>} value={inStoreRevenue === null ? "Unavailable" : currency.format(inStoreRevenue)} helper={`At ${currencyCents.format(IN_STORE_AOV)} AOV`} state={status.error ? "error" : inStoreRevenue === null ? "empty" : "ready"} />
      </MetricGrid>

      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load paid ads data: {status.error}</Card> : null}
      {campaignStatus.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load campaign data: {campaignStatus.error}</Card> : null}
      {lifetimeAdStatus.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load lifetime ad data: {lifetimeAdStatus.error}</Card> : null}
      {hasStoreVisitData && inStorePurchases !== null ? <InStoreEstimateCard storeVisits={totals.store_visits ?? 0} conversions={totals.conversions} onlineRevenue={totals.revenue} inStorePurchases={inStorePurchases} inStoreRevenue={inStoreRevenue ?? 0} estimatedBlendedRoas={estimatedBlendedRoas} /> : null}

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Online orders</AccentText> over time</h2>{hasData ? <TrendChart data={daily} previousData={previousDaily} compare={compare} metric="conversions" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Store visits</AccentText> over time</h2>{hasStoreVisitData ? <TrendChart data={daily} previousData={previousDaily} compare={compare} metric="store_visits" /> : <EmptyState>Store visit data is not available yet.</EmptyState>}</Card>
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>CPA</AccentText> over time</h2>{hasData ? <TrendChart data={daily} previousData={previousDaily} compare={compare} metric="cpa" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>ROAS</AccentText> over time</h2>{hasData ? <TrendChart data={daily} previousData={previousDaily} compare={compare} metric="roas" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Platform</AccentText> breakdown</h2>{hasData ? <PlatformBreakdown data={daily} /> : <EmptyState />}</Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Channel</AccentText> mix</h2>
          <Table headers={["Channel", "Spend", "Revenue", "Est. total rev.", "Online orders", "Store visits", "Est. in-store", "ROAS", "Est. blended ROAS"]} rows={rows.map((item) => [
            item.channel ?? "Unspecified",
            currency.format(item.spend),
            currency.format(item.onlineRevenue),
            item.estimatedTotalRevenue === null ? "Unavailable" : currency.format(item.estimatedTotalRevenue),
            compact.format(item.onlineOrders),
            item.store_visits === null ? "Unavailable" : compact.format(item.store_visits),
            item.estimatedInStorePurchases === null ? "Unavailable" : compact.format(Math.round(item.estimatedInStorePurchases)),
            item.platformRoas === null ? "Unavailable" : `${item.platformRoas.toFixed(2)}x`,
            item.estimatedBlendedRoas === null ? "Unavailable" : `${item.estimatedBlendedRoas.toFixed(2)}x`
          ])} />
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Campaign</AccentText> comparison</h2>
          <Table headers={["Campaign", "Platform", "Channel", "Spend", "Revenue", "Est. total rev.", "Online orders", "Est. in-store orders", "ROAS", "Est. blended ROAS"]} rows={campaignRows.map((item) => [
            item.campaign_name ?? item.campaign_id,
            item.platform,
            item.channel ?? "Unspecified",
            currency.format(item.spend),
            currency.format(item.onlineRevenue),
            item.estimatedTotalRevenue === null ? "Unavailable" : currency.format(item.estimatedTotalRevenue),
            compact.format(item.onlineOrders),
            item.estimatedInStorePurchases === null ? "Unavailable" : compact.format(Math.round(item.estimatedInStorePurchases)),
            item.platformRoas === null ? "Unavailable" : `${item.platformRoas.toFixed(2)}x`,
            item.estimatedBlendedRoas === null ? "Unavailable" : `${item.estimatedBlendedRoas.toFixed(2)}x`
          ])} />
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Top campaigns by <AccentText>ROAS</AccentText></h2>
          <Table headers={["Campaign", "Spend", "Revenue", "Est. total rev.", "Online orders", "Est. in-store orders", "ROAS", "Est. blended ROAS"]} rows={topRoasRows.map((item) => [
            item.campaign_name ?? item.campaign_id,
            currency.format(item.spend),
            currency.format(item.onlineRevenue),
            item.estimatedTotalRevenue === null ? "Unavailable" : currency.format(item.estimatedTotalRevenue),
            compact.format(item.onlineOrders),
            item.estimatedInStorePurchases === null ? "Unavailable" : compact.format(Math.round(item.estimatedInStorePurchases)),
            item.platformRoas === null ? "Unavailable" : `${item.platformRoas.toFixed(2)}x`,
            item.estimatedBlendedRoas === null ? "Unavailable" : `${item.estimatedBlendedRoas.toFixed(2)}x`
          ])} />
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Top campaigns by <AccentText>online orders</AccentText></h2>
          <Table headers={["Campaign", "Spend", "Revenue", "Est. total rev.", "Online orders", "Est. in-store orders", "ROAS", "Est. blended ROAS"]} rows={topConversionRows.map((item) => [
            item.campaign_name ?? item.campaign_id,
            currency.format(item.spend),
            currency.format(item.onlineRevenue),
            item.estimatedTotalRevenue === null ? "Unavailable" : currency.format(item.estimatedTotalRevenue),
            compact.format(item.onlineOrders),
            item.estimatedInStorePurchases === null ? "Unavailable" : compact.format(Math.round(item.estimatedInStorePurchases)),
            item.platformRoas === null ? "Unavailable" : `${item.platformRoas.toFixed(2)}x`,
            item.estimatedBlendedRoas === null ? "Unavailable" : `${item.estimatedBlendedRoas.toFixed(2)}x`
          ])} />
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Campaigns</AccentText> to watch</h2>
          <Table headers={["Campaign", "Spend", "Revenue", "Online orders", "Est. in-store orders", "ROAS", "Est. blended ROAS", "Wasted spend"]} rows={campaignWatchRows.map((item) => [
            item.campaign_name ?? item.campaign_id,
            currency.format(item.spend),
            currency.format(item.onlineRevenue),
            compact.format(item.onlineOrders),
            item.estimatedInStorePurchases === null ? "Unavailable" : compact.format(Math.round(item.estimatedInStorePurchases)),
            item.platformRoas === null ? "Unavailable" : `${item.platformRoas.toFixed(2)}x`,
            item.estimatedBlendedRoas === null ? "Unavailable" : `${item.estimatedBlendedRoas.toFixed(2)}x`,
            currency.format(effectiveWastedSpend(item))
          ])} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Top ads by <AccentText>performance</AccentText></h2>
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
  const hasTextPreview = Boolean(ad.headline || ad.headline_2 || ad.headline_3 || ad.description || ad.description_2 || ad.display_url || ad.final_url);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-black/20">
      <div className="grid min-h-44 place-items-center border-b border-white/10 bg-black/25">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="aspect-[16/9] h-full w-full object-cover" />
        ) : hasTextPreview ? (
          <TextAdPreview ad={ad} />
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
          <AdMetric label="Revenue" value={currency.format(ad.revenue)} />
          <AdMetric label="Conversions" value={compact.format(ad.conversions)} />
          <AdMetric label="ROAS" value={ad.roas === null ? "Unavailable" : `${ad.roas.toFixed(2)}x`} />
          <AdMetric label="CPA" value={ad.cpa === null ? "Unavailable" : currency.format(ad.cpa)} />
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

function InStoreEstimateCard({ storeVisits, conversions, onlineRevenue, inStorePurchases, inStoreRevenue, estimatedBlendedRoas }: {
  storeVisits: number;
  conversions: number;
  onlineRevenue: number;
  inStorePurchases: number;
  inStoreRevenue: number;
  estimatedBlendedRoas: number | null;
}) {
  const total = Math.max(storeVisits, conversions, inStorePurchases, 1);
  const onlineShare = Math.min(100, Math.max(0, conversions / total * 100));
  const inStoreShare = Math.min(100, Math.max(0, inStorePurchases / total * 100));
  const estimatedTotalRevenue = onlineRevenue + inStoreRevenue;

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold sm:text-lg"><AccentText>In-store</AccentText> purchases from ads</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Estimate based on store visits from ads that did not become online orders: store visits minus conversions.
          </p>
        </div>
        <div className="grid gap-3 sm:min-w-[22rem] sm:grid-cols-2">
          <div className="rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Est. in-store value</p>
            <p className="mt-1 text-2xl font-semibold text-white">{currency.format(inStoreRevenue)}</p>
            <p className="mt-1 text-xs text-white/45">At {currencyCents.format(IN_STORE_AOV)} AOV</p>
          </div>
          <div className="rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Est. blended ROAS</p>
            <p className="mt-1 text-2xl font-semibold text-white">{estimatedBlendedRoas === null ? "Unavailable" : `${estimatedBlendedRoas.toFixed(2)}x`}</p>
            <p className="mt-1 text-xs text-white/45">Online + est. in-store</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <InStoreMetric label="Store visits from ads" value={compact.format(Math.round(storeVisits))} />
        <InStoreMetric label="Online orders" value={compact.format(conversions)} />
        <InStoreMetric label="Est. in-store purchases" value={compact.format(Math.round(inStorePurchases))} accent />
        <InStoreMetric label="Estimated total revenue" value={currency.format(estimatedTotalRevenue)} accent />
      </div>

      <div className="mt-5 space-y-3">
        <EstimateBar label="Online orders" value={conversions} share={onlineShare} />
        <EstimateBar label="Likely in-store purchases" value={inStorePurchases} share={inStoreShare} accent />
      </div>
    </Card>
  );
}

function InStoreMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold", accent ? "text-accent" : "text-white")}>{value}</p>
    </div>
  );
}

function EstimateBar({ label, value, share, accent = false }: { label: string; value: number; share: number; accent?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-white/55">
        <span>{label}</span>
        <span>{compact.format(Math.round(value))}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", accent ? "bg-accent" : "bg-white/65")} style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

function TextAdPreview({ ad }: { ad: AdLifetimePerformance }) {
  const headlines = [ad.headline, ad.headline_2, ad.headline_3].filter(Boolean).join(" | ");
  const descriptions = [ad.description, ad.description_2].filter(Boolean).join(" ");

  return (
    <div className="w-full space-y-2 p-4">
      <p className="truncate text-xs text-emerald-200/70">{ad.display_url ?? readableUrl(ad.final_url ?? "")}</p>
      <p className="line-clamp-2 text-base font-semibold leading-6 text-accent">{headlines || adTitle(ad)}</p>
      <p className="line-clamp-3 text-sm leading-5 text-white/60">{descriptions || "Search ad text preview unavailable."}</p>
    </div>
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
  const trackedByCampaign = rows.reduce<Record<string, { onlineOrders: number; onlineRevenue: number; trackedSpend: number }>>((acc, row) => {
    const key = `${row.platform}|${row.campaign_id}`;
    acc[key] ??= { onlineOrders: 0, onlineRevenue: 0, trackedSpend: 0 };
    if (row.date >= ONLINE_ORDER_TRACKING_START) {
      acc[key].onlineOrders += row.conversions;
      acc[key].onlineRevenue += row.revenue;
      acc[key].trackedSpend += row.spend;
    }
    return acc;
  }, {});

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

  return Object.values(byCampaign)
    .map((row) => withEstimatedRevenue(row, trackedByCampaign[campaignKey(row)]))
    .sort((a, b) => b.spend - a.spend);
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
  const candidates = [ad.ad_name, ad.headline, ad.headline_2, ad.headline_3, ad.creative_name]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  const nonUrl = candidates.find((value) => !isUrlLike(value));
  if (nonUrl) return nonUrl;
  const fallbackUrl = ad.display_url ?? ad.final_url ?? candidates.find(isUrlLike);
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

function topCampaignsByRoas(rows: Array<EstimatedPerformanceRow<CampaignDailyPerformance>>) {
  return [...rows]
    .filter((item) => item.platformRoas !== null)
    .sort((a, b) => (b.platformRoas ?? 0) - (a.platformRoas ?? 0) || b.onlineRevenue - a.onlineRevenue)
    .slice(0, 8);
}

function topCampaignsByConversions(rows: Array<EstimatedPerformanceRow<CampaignDailyPerformance>>) {
  return [...rows]
    .filter((item) => item.onlineOrders > 0)
    .sort((a, b) => b.onlineOrders - a.onlineOrders || (a.platformCpa ?? Number.MAX_SAFE_INTEGER) - (b.platformCpa ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 8);
}

function campaignsToWatch(rows: Array<EstimatedPerformanceRow<CampaignDailyPerformance>>, topRows: Array<EstimatedPerformanceRow<CampaignDailyPerformance>>) {
  const topKeys = new Set(topRows.map(campaignKey));
  return [...rows]
    .filter((item) => !topKeys.has(campaignKey(item)))
    .filter((item) => effectiveWastedSpend(item) > 0)
    .sort((a, b) => effectiveWastedSpend(b) - effectiveWastedSpend(a) || b.spend - a.spend)
    .slice(0, 8);
}

function effectiveWastedSpend(row: EstimatedPerformanceRow<CampaignDailyPerformance>) {
  return row.wasted_spend > 0 ? row.wasted_spend : row.onlineOrders === 0 ? row.spend : 0;
}

function trendHelper(change: number | null) {
  if (change === null) return undefined;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% vs prior period`;
}

function estimatedInStorePurchases(totals: { store_visits: number | null; conversions: number }) {
  if (totals.store_visits === null) return null;
  return Math.max(totals.store_visits - totals.conversions, 0);
}

function channelRows(rows: DailyPerformance[]) {
  const trackedByChannel = rows.reduce<Record<string, { onlineOrders: number; onlineRevenue: number; trackedSpend: number }>>((acc, row) => {
    const key = `${row.platform}|${row.channel ?? ""}`;
    acc[key] ??= { onlineOrders: 0, onlineRevenue: 0, trackedSpend: 0 };
    if (row.date >= ONLINE_ORDER_TRACKING_START) {
      acc[key].onlineOrders += row.conversions;
      acc[key].onlineRevenue += row.revenue;
      acc[key].trackedSpend += row.spend;
    }
    return acc;
  }, {});

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
    acc[key].ctr = acc[key].impressions > 0 ? acc[key].clicks / acc[key].impressions : null;
    acc[key].cpc = acc[key].clicks > 0 ? acc[key].spend / acc[key].clicks : null;
    return acc;
  }, {});

  return Object.values(byChannel).map((row) => withEstimatedRevenue(row, trackedByChannel[`${row.platform}|${row.channel ?? ""}`])).sort((a, b) => b.spend - a.spend);
}

function withEstimatedRevenue<T extends DailyPerformance>(row: T, tracked?: { onlineOrders: number; onlineRevenue: number; trackedSpend: number }): EstimatedPerformanceRow<T> {
  const onlineOrders = tracked?.onlineOrders ?? row.conversions;
  const onlineRevenue = tracked?.onlineRevenue ?? row.revenue;
  const estimatedInStorePurchasesValue = estimatedInStorePurchases({ store_visits: row.store_visits, conversions: onlineOrders });
  const estimatedInStoreRevenue = estimatedInStorePurchasesValue === null ? null : estimatedInStorePurchasesValue * IN_STORE_AOV;
  const estimatedTotalRevenue = estimatedInStoreRevenue === null ? null : onlineRevenue + estimatedInStoreRevenue;
  const estimatedBlendedRoas = estimatedTotalRevenue === null || row.spend <= 0 ? null : estimatedTotalRevenue / row.spend;
  return {
    ...row,
    onlineOrders,
    onlineRevenue,
    estimatedInStorePurchases: estimatedInStorePurchasesValue,
    estimatedTotalRevenue,
    estimatedBlendedRoas,
    platformRoas: row.spend > 0 ? onlineRevenue / row.spend : null,
    platformCpa: onlineOrders > 0 ? row.spend / onlineOrders : null
  };
}
