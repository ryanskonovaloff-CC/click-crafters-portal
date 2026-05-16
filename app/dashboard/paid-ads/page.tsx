import Link from "next/link";
import { PlatformBreakdown, TrendChart } from "@/components/charts";
import { Badge, Card, EmptyState, StatCard, Table } from "@/components/ui";
import { getPaidAdsDashboardData, metricRatios, percentChange } from "@/lib/data";
import { compact, currency, pct } from "@/lib/utils";
import type { DailyPerformance, DateRangeKey } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<{ range?: string }>;
};

export default async function PaidAdsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { range, daily, totals, previousTotals, status } = await getPaidAdsDashboardData(params?.range);
  const ratios = metricRatios(totals);
  const previousRatios = metricRatios(previousTotals);
  const hasData = !status.error && !status.isEmpty;
  const tileState = status.error ? "error" : hasData ? "ready" : "empty";
  const rows = channelRows(daily);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge>Paid media</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Paid Ads Performance</h1>
          <p className="mt-2 text-sm text-white/50">{range.label}</p>
        </div>
        <RangeLinks active={range.key} />
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
          <EmptyState>No data available for this date range yet.</EmptyState>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top campaigns by ROAS</h2>
          <EmptyState>No data available for this date range yet.</EmptyState>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top campaigns by conversions</h2>
          <EmptyState>No data available for this date range yet.</EmptyState>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Worst campaigns by wasted spend</h2>
          <EmptyState>No data available for this date range yet.</EmptyState>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Top ads by performance</h2>
        <EmptyState>No data available for this date range yet.</EmptyState>
      </Card>
    </div>
  );
}

function RangeLinks({ active }: { active: DateRangeKey }) {
  const ranges: Array<{ key: DateRangeKey; label: string }> = [
    { key: "mtd", label: "Month to date" },
    { key: "last30", label: "Last 30 days" },
    { key: "last_month", label: "Last month" }
  ];

  return (
    <div className="inline-flex rounded-xl border border-border bg-black/30 p-1 text-sm">
      {ranges.map((range) => (
        <Link key={range.key} href={`/dashboard/paid-ads?range=${range.key}`} className={range.key === active ? "rounded-lg bg-white/10 px-3 py-1.5 text-white" : "rounded-lg px-3 py-1.5 text-white/55 hover:text-white"}>
          {range.label}
        </Link>
      ))}
    </div>
  );
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
