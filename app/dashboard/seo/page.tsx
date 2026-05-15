import { Badge, Card, StatCard, Table } from "@/components/ui";
import { getDashboardData } from "@/lib/data";
import { compact } from "@/lib/utils";

export default async function SeoPage() {
  const { seo } = await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <Badge>Organic visibility</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">SEO Dashboard</h1>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Organic clicks" value={compact.format(seo?.organic_clicks ?? 0)} />
        <StatCard label="Organic impressions" value={compact.format(seo?.organic_impressions ?? 0)} />
        <StatCard label="Average position" value={(seo?.average_position ?? 0).toFixed(1)} />
        <StatCard label="Organic sessions" value={compact.format(seo?.organic_sessions ?? 0)} />
        <StatCard label="Organic conversions" value={compact.format(seo?.organic_conversions ?? 0)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top queries</h2>
          <Table headers={["Query", "Clicks", "Impressions", "Position"]} rows={(seo?.top_queries ?? []).map((item) => [item.query, item.clicks, item.impressions, item.position])} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top landing pages</h2>
          <Table headers={["Page", "Clicks", "Sessions", "Conv."]} rows={(seo?.top_landing_pages ?? []).map((item) => [item.page, item.clicks, item.sessions, item.conversions])} />
        </Card>
      </div>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Technical SEO issues</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {["2 pages with missing meta descriptions", "4 images missing descriptive alt text", "Schema review pending for location pages"].map((issue) => (
            <div key={issue} className="rounded-xl border border-border bg-black/25 p-4 text-sm text-white/70">{issue}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
