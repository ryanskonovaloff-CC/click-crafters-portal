import { CampaignComparison, TrendChart } from "@/components/charts";
import { Badge, Card, Table } from "@/components/ui";
import { getDashboardData } from "@/lib/data";
import { compact, currency, pct } from "@/lib/utils";

export default async function PaidAdsPage() {
  const { daily, campaigns, ads } = await getDashboardData();
  const byRoas = [...campaigns].sort((a, b) => (b.revenue / b.spend) - (a.revenue / a.spend));
  const byConversions = [...campaigns].sort((a, b) => b.conversions - a.conversions);
  const byWaste = [...campaigns].sort((a, b) => b.wasted_spend - a.wasted_spend);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <Badge>Paid media</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Paid Ads Performance</h1>
      </header>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card><h2 className="mb-4 text-lg font-semibold">CPA over time</h2><TrendChart data={daily} metric="cpa" /></Card>
        <Card><h2 className="mb-4 text-lg font-semibold">ROAS over time</h2><TrendChart data={daily} metric="roas" /></Card>
        <Card className="xl:col-span-2"><h2 className="mb-4 text-lg font-semibold">Campaign performance comparison</h2><CampaignComparison data={campaigns} /></Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top campaigns by ROAS</h2>
          <Table headers={["Campaign", "Platform", "Spend", "Revenue", "ROAS"]} rows={byRoas.slice(0, 5).map((item) => [item.campaign_name, item.platform, currency.format(item.spend), currency.format(item.revenue), `${(item.revenue / item.spend).toFixed(2)}x`])} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top campaigns by conversions</h2>
          <Table headers={["Campaign", "Platform", "Conversions", "CPA", "Spend"]} rows={byConversions.slice(0, 5).map((item) => [item.campaign_name, item.platform, item.conversions, currency.format(item.spend / item.conversions), currency.format(item.spend)])} />
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Worst campaigns by wasted spend</h2>
          <Table headers={["Campaign", "Platform", "Wasted spend", "Spend", "CPA"]} rows={byWaste.slice(0, 6).map((item) => [item.campaign_name, item.platform, currency.format(item.wasted_spend), currency.format(item.spend), currency.format(item.spend / Math.max(item.conversions, 1))])} />
        </Card>
      </div>
      <section>
        <h2 className="mb-4 text-lg font-semibold">Top ads by performance</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => {
            const ctr = ad.impressions ? (ad.clicks / ad.impressions) * 100 : 0;
            const cpa = ad.conversions ? ad.spend / ad.conversions : 0;
            const roas = ad.spend ? ad.revenue / ad.spend : 0;
            return (
              <Card key={ad.ad_name} className="space-y-4">
                <div className="grid aspect-[1.6] place-items-center rounded-xl border border-border bg-gradient-to-br from-accentSoft to-white/5 text-sm text-white/50">
                  {ad.preview_url ? ad.preview_url : "Ad preview"}
                </div>
                <div>
                  <Badge>{ad.platform}</Badge>
                  <h3 className="mt-3 text-base font-semibold">{ad.ad_name}</h3>
                  <p className="mt-1 text-sm text-white/50">{ad.campaign_name}</p>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Metric label="Spend" value={currency.format(ad.spend)} />
                  <Metric label="Impressions" value={compact.format(ad.impressions)} />
                  <Metric label="Clicks" value={compact.format(ad.clicks)} />
                  <Metric label="CTR" value={pct(ctr)} />
                  <Metric label="Conversions" value={`${ad.conversions}`} />
                  <Metric label="CPA" value={currency.format(cpa)} />
                  <Metric label="Revenue" value={currency.format(ad.revenue)} />
                  <Metric label="ROAS" value={`${roas.toFixed(2)}x`} />
                </dl>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-white/40">{label}</dt>
      <dd className="mt-1 font-medium text-white/80">{value}</dd>
    </div>
  );
}
