import { CalendarDays } from "lucide-react";
import { PlatformBreakdown, TrendChart } from "@/components/charts";
import { DateRangePicker } from "@/components/date-range-picker";
import { LogoutButton } from "@/components/logout-button";
import { Badge, Card, EmptyState, StatCard, Table } from "@/components/ui";
import { getOverviewDashboardData, metricRatios, percentChange } from "@/lib/data";
import { compact, currency, pct } from "@/lib/utils";
import type { DailyPerformance } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<{ range?: string; start?: string; end?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { client, range, paid, seo, performance } = await getOverviewDashboardData(params?.range, params?.start, params?.end);
  const ratios = metricRatios(performance);
  const paidRatios = metricRatios(paid.totals);
  const previousPaidRatios = metricRatios(paid.previousTotals);
  const hasPaidData = !paid.status.error && !paid.status.isEmpty;
  const hasSeoData = !seo.status.error && !seo.status.isEmpty;
  const tileState = paid.status.error ? "error" : hasPaidData ? "ready" : "empty";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{client?.industry ?? "No client"}</Badge>
            <Badge className="gap-1"><CalendarDays size={13} /> {range.label}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">{client?.name ?? "No client assigned"}</h1>
          <p className="mt-2 text-sm text-white/50">Last updated {client ? new Date(client.last_updated_at).toLocaleString() : "after setup"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker range={range} />
          <LogoutButton />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total spend" value={hasPaidData ? currency.format(performance.spend) : "Unavailable"} helper={trendHelper("vs prior period", percentChange(paid.totals.spend, paid.previousTotals.spend))} state={paid.status.error ? "error" : hasPaidData ? "ready" : "empty"} />
        <StatCard label="Total revenue" value={hasPaidData ? currency.format(performance.revenue) : "Unavailable"} helper={trendHelper("vs prior period", percentChange(paid.totals.revenue, paid.previousTotals.revenue))} state={paid.status.error ? "error" : hasPaidData ? "ready" : "empty"} />
        <StatCard label="ROAS" value={paidRatios.roas === null ? "Unavailable" : `${paidRatios.roas.toFixed(2)}x`} helper={trendHelper("vs prior period", percentChange(paidRatios.roas, previousPaidRatios.roas))} state={paid.status.error ? "error" : paidRatios.roas === null ? "empty" : "ready"} />
        <StatCard label="CPA" value={ratios.cpa === null ? "Unavailable" : currency.format(ratios.cpa)} state={tileState} />
        <StatCard label="Leads / Conversions" value={hasPaidData ? compact.format(performance.conversions) : "Unavailable"} state={tileState} />
        <StatCard label="Clicks" value={hasPaidData ? compact.format(performance.clicks) : "Unavailable"} state={tileState} />
        <StatCard label="Impressions" value={hasPaidData ? compact.format(performance.impressions) : "Unavailable"} state={tileState} />
        <StatCard label="CTR / CPC" value={ratios.ctr === null || ratios.cpc === null ? "Unavailable" : `${pct(ratios.ctr * 100)} / ${currency.format(ratios.cpc)}`} state={tileState} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card><h2 className="mb-4 text-lg font-semibold">Spend over time</h2>{hasPaidData ? <TrendChart data={paid.daily} metric="spend" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Conversions over time</h2>{hasPaidData ? <TrendChart data={paid.daily} metric="conversions" /> : <EmptyState />}</Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Platform breakdown</h2>{hasPaidData ? <PlatformBreakdown data={paid.daily} /> : <EmptyState />}</Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Organic visibility</h2>
          {hasSeoData ? (
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
        <h2 className="mb-4 text-lg font-semibold">Paid channel performance</h2>
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
        <h2 className="mb-4 text-lg font-semibold">Campaign performance</h2>
        <EmptyState>No data available for this date range yet.</EmptyState>
      </Card>
    </div>
  );
}

function trendHelper(label: string, change: number | null) {
  if (change === null) return undefined;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% ${label}`;
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
