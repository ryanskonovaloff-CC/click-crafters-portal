import { DateRangePicker } from "@/components/date-range-picker";
import { AccentText, Badge, Card, ClientPageTitle, EmptyState, MetricGrid, StatCard, Table } from "@/components/ui";
import { clientLogoSrc } from "@/lib/client-branding";
import { getSeoDashboardData, percentChange } from "@/lib/data";
import { compact, pct } from "@/lib/utils";

type PageProps = {
  searchParams?: Promise<{ range?: string; start?: string; end?: string; compare?: string }>;
};

export default async function SeoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const compare = params?.compare === "previous";
  const { client, range, totals, previousTotals, topQueries, topPages, status } = await getSeoDashboardData(params?.range, params?.start, params?.end);
  const hasData = !status.error && !status.isEmpty;
  const tileState = status.error ? "error" : hasData ? "ready" : "empty";
  const outboundClickRate = totals.organicClicks && totals.outboundClicks !== null ? totals.outboundClicks / totals.organicClicks : null;
  const previousOutboundClickRate = previousTotals.organicClicks && previousTotals.outboundClicks !== null ? previousTotals.outboundClicks / previousTotals.organicClicks : null;
  const opportunities = organicOpportunities(topQueries, topPages);
  const logoSrc = clientLogoSrc(client?.name);

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <Badge>Organic visibility</Badge>
          <ClientPageTitle logoSrc={logoSrc} logoAlt={client?.name ?? undefined}><AccentText>SEO</AccentText> Dashboard</ClientPageTitle>
          <p className="mt-1.5 text-xs text-white/50 sm:mt-2 sm:text-sm">{range.label}</p>
        </div>
        <DateRangePicker range={range} />
      </header>

      <MetricGrid>
        <StatCard label={<AccentText>Organic clicks</AccentText>} value={totals.organicClicks === null ? "Unavailable" : compact.format(totals.organicClicks)} helper={compare ? trendHelper(percentChange(totals.organicClicks, previousTotals.organicClicks)) : undefined} state={tileState} />
        <StatCard label={<AccentText>Organic impressions</AccentText>} value={totals.organicImpressions === null ? "Unavailable" : compact.format(totals.organicImpressions)} helper={compare ? trendHelper(percentChange(totals.organicImpressions, previousTotals.organicImpressions)) : undefined} state={tileState} />
        <StatCard label={<AccentText>Organic CTR</AccentText>} value={totals.ctr === null ? "Unavailable" : pct(totals.ctr * 100)} helper={compare ? trendHelper(percentChange(totals.ctr, previousTotals.ctr)) : undefined} state={status.error ? "error" : totals.ctr === null ? "empty" : "ready"} />
        <StatCard label={<AccentText>Average position</AccentText>} value={totals.averagePosition === null ? "Unavailable" : totals.averagePosition.toFixed(1)} helper={compare ? trendHelper(percentChange(totals.averagePosition, previousTotals.averagePosition)) : undefined} state={status.error ? "error" : totals.averagePosition === null ? "empty" : "ready"} />
        <StatCard label={<AccentText>Organic sessions</AccentText>} value={totals.organicSessions === null ? "Unavailable" : compact.format(totals.organicSessions)} helper={compare ? trendHelper(percentChange(totals.organicSessions, previousTotals.organicSessions)) : undefined} state={tileState} />
        <StatCard label={<AccentText>Outbound clicks</AccentText>} value={totals.outboundClicks === null ? "Unavailable" : compact.format(totals.outboundClicks)} helper={compare ? trendHelper(percentChange(totals.outboundClicks, previousTotals.outboundClicks)) : undefined} state={status.error ? "error" : totals.outboundClicks === null ? "empty" : "ready"} />
        <StatCard label={<AccentText>Indexed pages</AccentText>} value={totals.indexedPages === null ? "Unavailable" : compact.format(totals.indexedPages)} helper={compare ? trendHelper(percentChange(totals.indexedPages, previousTotals.indexedPages)) : undefined} state={status.error ? "error" : totals.indexedPages === null ? "empty" : "ready"} />
        <StatCard label={<AccentText>Outbound click rate</AccentText>} value={outboundClickRate === null ? "Unavailable" : pct(outboundClickRate * 100)} helper={compare ? trendHelper(percentChange(outboundClickRate, previousOutboundClickRate)) : undefined} state={status.error ? "error" : outboundClickRate === null ? "empty" : "ready"} />
      </MetricGrid>

      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load SEO data: {status.error}</Card> : null}

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Top</AccentText> queries</h2>
          <Table headers={["Query", "Clicks", "Impressions", "CTR", "Position"]} rows={topQueries.map((item) => [
            item.query,
            compact.format(item.clicks),
            compact.format(item.impressions),
            formatPercentRatio(queryCtr(item)),
            item.position.toFixed(1)
          ])} />
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Top</AccentText> landing pages</h2>
          <Table headers={["Page", "Clicks", "Impressions", "CTR", "Position", "Outbound clicks"]} rows={topPages.map((item) => [
            item.page,
            formatNumber(item.clicks),
            formatNumber(item.impressions),
            formatPercentRatio(pageCtr(item)),
            item.position === null ? "Not available" : item.position.toFixed(1),
            item.outboundClicks === null ? "Not available" : compact.format(item.outboundClicks)
          ])} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Organic</AccentText> growth opportunities</h2>
        {opportunities.length > 0 ? (
          <Table headers={["Opportunity", "Signal", "Why it matters", "Recommended action"]} rows={opportunities.map((item) => [
            item.name,
            item.signal,
            item.reason,
            item.action
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
  ctr: number | null;
  position: number;
};

type PageRow = {
  page: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  position: number | null;
  sessions: number | null;
  outboundClicks: number | null;
  outboundClickRate: number | null;
};

function organicOpportunities(topQueries: QueryRow[], topPages: PageRow[]) {
  const queryOpportunities = topQueries
    .map((item) => {
      const ctr = queryCtr(item);
      const nearPageOne = item.position >= 4 && item.position <= 15;
      const lowCtr = item.impressions >= 100 && ctr !== null && ctr < 0.025;
      if (!nearPageOne && !lowCtr) return null;

      return {
        name: item.query,
        signal: signalText({
          clicks: item.clicks,
          impressions: item.impressions,
          ctr,
          position: item.position
        }),
        reason: lowCtr
          ? "This query is earning organic visibility but the search result may not be compelling enough to win clicks."
          : "This query is close to stronger page-one visibility and may be within range for incremental ranking gains.",
        action: lowCtr
          ? "Improve the title tag and meta description around the search intent."
          : "Strengthen page content, internal links, schema, and local relevance for this intent.",
        score: opportunityScore({ impressions: item.impressions, clicks: item.clicks, position: item.position, lowCtr, nearPageOne })
      };
    })
    .filter((item): item is OrganicOpportunity => Boolean(item));

  const pageOpportunities = topPages
    .map((item) => {
      const ctr = pageCtr(item);
      const outboundRate = pageOutboundRate(item);
      const clicks = item.clicks ?? 0;
      const impressions = item.impressions ?? 0;
      const meaningfulVisibility = impressions >= 100 || clicks >= 5;
      const lowCtr = impressions >= 100 && ctr !== null && ctr < 0.025;
      const lowOutboundClicks = clicks >= 5 && item.outboundClicks !== null && item.outboundClicks <= 0;
      const lowOutboundRate = clicks >= 10 && outboundRate !== null && outboundRate < 0.05;
      const nearPageOne = item.position !== null && item.position >= 4 && item.position <= 15;

      if (!meaningfulVisibility || (!lowCtr && !lowOutboundClicks && !lowOutboundRate && !nearPageOne)) return null;

      return {
        name: item.page,
        signal: signalText({
          clicks: item.clicks,
          impressions: item.impressions,
          ctr,
          position: item.position,
          outboundClicks: item.outboundClicks,
          outboundRate
        }),
        reason: pageReason({ lowCtr, lowOutboundClicks, lowOutboundRate, nearPageOne }),
        action: pageAction(item.page, { lowCtr, lowOutboundClicks, lowOutboundRate, nearPageOne }),
        score: opportunityScore({ impressions, clicks, position: item.position, lowCtr, lowOutboundClicks, lowOutboundRate, nearPageOne })
      };
    })
    .filter((item): item is OrganicOpportunity => Boolean(item));

  return [...pageOpportunities, ...queryOpportunities]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function queryCtr(item: QueryRow) {
  return normalizeRatio(item.ctr) ?? (item.impressions > 0 ? item.clicks / item.impressions : null);
}

type OrganicOpportunity = {
  name: string;
  signal: string;
  reason: string;
  action: string;
  score: number;
};

function pageCtr(item: PageRow) {
  return normalizeRatio(item.ctr) ?? (item.impressions && item.clicks !== null ? item.clicks / item.impressions : null);
}

function pageOutboundRate(item: PageRow) {
  return normalizeRatio(item.outboundClickRate) ?? (item.outboundClicks !== null && item.clicks !== null && item.clicks > 0 ? item.outboundClicks / item.clicks : null);
}

function normalizeRatio(value: number | null) {
  if (value === null) return null;
  return value > 1 ? value / 100 : value;
}

function formatPercentRatio(value: number | null) {
  return value === null ? "Not available" : pct(value * 100);
}

function trendHelper(change: number | null) {
  if (change === null) return undefined;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% vs prior period`;
}

function formatNumber(value: number | null) {
  return value === null ? "Not available" : compact.format(value);
}

function signalText({ clicks, impressions, ctr, position, outboundClicks, outboundRate }: {
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
  outboundClicks?: number | null;
  outboundRate?: number | null;
}) {
  return [
    clicks !== undefined && clicks !== null ? `${compact.format(clicks)} clicks` : null,
    impressions !== undefined && impressions !== null ? `${compact.format(impressions)} impressions` : null,
    ctr !== undefined && ctr !== null ? `${formatPercentRatio(ctr)} CTR` : null,
    position !== undefined && position !== null ? `avg position ${position.toFixed(1)}` : null,
    outboundClicks !== undefined && outboundClicks !== null ? `${compact.format(outboundClicks)} outbound clicks` : null,
    outboundRate !== undefined && outboundRate !== null ? `${formatPercentRatio(outboundRate)} outbound rate` : null
  ].filter(Boolean).join(", ");
}

function pageReason(flags: { lowCtr: boolean; lowOutboundClicks: boolean; lowOutboundRate: boolean; nearPageOne: boolean }) {
  if (flags.lowOutboundClicks || flags.lowOutboundRate) {
    return "This page is gaining organic visibility but may not be driving enough measurable ordering, location, or catering actions.";
  }
  if (flags.lowCtr) {
    return "This page is showing in organic search, but the result may not be earning enough clicks for the visibility it has.";
  }
  return "This page is close to stronger page-one visibility and may be within range for incremental ranking gains.";
}

function pageAction(page: string, flags: { lowCtr: boolean; lowOutboundClicks: boolean; lowOutboundRate: boolean; nearPageOne: boolean }) {
  const normalized = page.toLowerCase();
  if (normalized.includes("catering")) {
    return "Prioritize the catering CTA, lead capture path, catering copy, and internal links from high-traffic pages.";
  }
  if (normalized.includes("menu") || normalized.includes("order")) {
    return "Prioritize order-now visibility, menu/order structured data, and above-the-fold ordering CTAs.";
  }
  if (normalized.includes("location") || normalized.includes("hours") || normalized === "/" || normalized.includes("home")) {
    return "Improve local SEO signals, directions and phone-click visibility, and alignment with the Google Business Profile.";
  }
  if (flags.lowCtr) {
    return "Improve the title tag and meta description around the search intent.";
  }
  if (flags.lowOutboundClicks || flags.lowOutboundRate) {
    return "Improve above-the-fold CTAs, order buttons, location buttons, and measurable outbound action tracking.";
  }
  return "Optimize page content, internal links, schema, and local relevance.";
}

function opportunityScore({ impressions = 0, clicks = 0, position, lowCtr = false, lowOutboundClicks = false, lowOutboundRate = false, nearPageOne = false }: {
  impressions?: number;
  clicks?: number;
  position?: number | null;
  lowCtr?: boolean;
  lowOutboundClicks?: boolean;
  lowOutboundRate?: boolean;
  nearPageOne?: boolean;
}) {
  const positionBoost = position && position >= 4 && position <= 15 ? 80 - position : 0;
  return impressions * 0.1 + clicks * 8 + positionBoost + (lowCtr ? 80 : 0) + (lowOutboundClicks ? 100 : 0) + (lowOutboundRate ? 80 : 0) + (nearPageOne ? 40 : 0);
}
