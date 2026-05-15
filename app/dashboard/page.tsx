import { CalendarDays } from "lucide-react";
import { CampaignComparison, PlatformBreakdown, TrendChart } from "@/components/charts";
import { LogoutButton } from "@/components/logout-button";
import { Badge, Card, StatCard, Table } from "@/components/ui";
import { getDashboardData } from "@/lib/data";
import { compact, currency, pct } from "@/lib/utils";

export default async function DashboardPage() {
  const { client, daily, campaigns } = await getDashboardData();
  const totals = daily.reduce((acc, item) => ({
    spend: acc.spend + item.spend,
    revenue: acc.revenue + item.revenue,
    conversions: acc.conversions + item.conversions,
    clicks: acc.clicks + item.clicks,
    impressions: acc.impressions + item.impressions
  }), { spend: 0, revenue: 0, conversions: 0, clicks: 0, impressions: 0 });

  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks ? totals.spend / totals.clicks : 0;
  const cpa = totals.conversions ? totals.spend / totals.conversions : 0;
  const roas = totals.spend ? totals.revenue / totals.spend : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{client?.industry ?? "Demo client"}</Badge>
            <Badge className="gap-1"><CalendarDays size={13} /> Month to date</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">{client?.name ?? "No client assigned"}</h1>
          <p className="mt-2 text-sm text-white/50">Last updated {client ? new Date(client.last_updated_at).toLocaleString() : "after setup"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="rounded-xl border border-border bg-black/30 px-3 py-2 text-sm text-white/80 outline-none focus:border-accent/70">
            <option>Month to date</option>
            <option>Last 30 days</option>
            <option>Last month</option>
          </select>
          <LogoutButton />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MTD Spend" value={currency.format(totals.spend)} />
        <StatCard label="MTD Revenue" value={currency.format(totals.revenue)} />
        <StatCard label="ROAS" value={`${roas.toFixed(2)}x`} />
        <StatCard label="CPA" value={currency.format(cpa)} />
        <StatCard label="Leads / Conversions" value={compact.format(totals.conversions)} />
        <StatCard label="Clicks" value={compact.format(totals.clicks)} />
        <StatCard label="Impressions" value={compact.format(totals.impressions)} />
        <StatCard label="CTR / CPC" value={`${pct(ctr)} / ${currency.format(cpc)}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card><h2 className="mb-4 text-lg font-semibold">Spend over time</h2><TrendChart data={daily} metric="spend" /></Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Conversions over time</h2><TrendChart data={daily} metric="conversions" /></Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Platform breakdown</h2><PlatformBreakdown data={daily} /></Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Campaign comparison</h2><CampaignComparison data={campaigns} /></Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Top campaigns by spend</h2>
        <Table headers={["Campaign", "Platform", "Spend", "Revenue", "Conv.", "ROAS"]} rows={campaigns.slice(0, 5).map((item) => [
          item.campaign_name,
          item.platform,
          currency.format(item.spend),
          currency.format(item.revenue),
          item.conversions,
          `${(item.revenue / item.spend).toFixed(2)}x`
        ])} />
      </Card>
    </div>
  );
}
