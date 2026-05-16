import Link from "next/link";
import { Badge, Card, StatCard, Table } from "@/components/ui";
import { getSeoDashboardData } from "@/lib/data";
import { compact, pct } from "@/lib/utils";
import type { DateRangeKey } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<{ range?: string }>;
};

export default async function SeoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { range, totals, topQueries, topPages, status } = await getSeoDashboardData(params?.range);
  const hasData = !status.error && !status.isEmpty;
  const tileState = status.error ? "error" : hasData ? "ready" : "empty";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge>Organic visibility</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">SEO Dashboard</h1>
          <p className="mt-2 text-sm text-white/50">{range.label}</p>
        </div>
        <RangeLinks active={range.key} />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organic clicks" value={totals.organicClicks === null ? "Unavailable" : compact.format(totals.organicClicks)} state={tileState} />
        <StatCard label="Organic impressions" value={totals.organicImpressions === null ? "Unavailable" : compact.format(totals.organicImpressions)} state={tileState} />
        <StatCard label="Organic CTR" value={totals.ctr === null ? "Unavailable" : pct(totals.ctr * 100)} state={status.error ? "error" : totals.ctr === null ? "empty" : "ready"} />
        <StatCard label="Average position" value={totals.averagePosition === null ? "Unavailable" : totals.averagePosition.toFixed(1)} state={status.error ? "error" : totals.averagePosition === null ? "empty" : "ready"} />
        <StatCard label="Organic sessions" value={totals.organicSessions === null ? "Unavailable" : compact.format(totals.organicSessions)} state={tileState} />
        <StatCard label="Organic conversions" value={totals.organicConversions === null ? "Unavailable" : compact.format(totals.organicConversions)} state={tileState} />
        <StatCard label="Indexed pages" value={totals.indexedPages === null ? "Unavailable" : compact.format(totals.indexedPages)} state={status.error ? "error" : totals.indexedPages === null ? "empty" : "ready"} />
        <StatCard label="Technical issues" value={totals.technicalIssues.length ? compact.format(totals.technicalIssues.length) : "Unavailable"} state={status.error ? "error" : totals.technicalIssues.length ? "ready" : "empty"} />
      </div>

      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load SEO data: {status.error}</Card> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top queries</h2>
          <Table headers={["Query", "Clicks", "Impressions", "Position"]} rows={topQueries.map((item) => [item.query, compact.format(item.clicks), compact.format(item.impressions), item.position.toFixed(1)])} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top landing pages</h2>
          <Table headers={["Page", "Clicks", "Sessions", "Conv."]} rows={topPages.map((item) => [item.page, compact.format(item.clicks), compact.format(item.sessions), compact.format(item.conversions)])} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Technical SEO issues</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {totals.technicalIssues.length > 0 ? totals.technicalIssues.map((issue) => (
            <div key={issue} className="rounded-xl border border-border bg-black/25 p-4 text-sm text-white/70">{issue}</div>
          )) : (
            <div className="rounded-xl border border-border bg-black/25 p-4 text-sm text-white/45">No data available for this date range yet.</div>
          )}
        </div>
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
        <Link key={range.key} href={`/dashboard/seo?range=${range.key}`} className={range.key === active ? "rounded-lg bg-white/10 px-3 py-1.5 text-white" : "rounded-lg px-3 py-1.5 text-white/55 hover:text-white"}>
          {range.label}
        </Link>
      ))}
    </div>
  );
}
