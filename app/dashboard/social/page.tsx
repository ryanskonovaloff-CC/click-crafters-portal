import { RefreshCw } from "lucide-react";
import { InstagramContentTable, TopInstagramContent } from "@/components/instagram-content-table";
import { FollowerGrowthChart, PublishingActivityChart, ReachEngagementChart } from "@/components/social-charts";
import { ClientSwitcher } from "@/components/client-switcher";
import { DateRangePicker } from "@/components/date-range-picker";
import { AccentText, Badge, Card, ClientPageTitle, EmptyState, MetricGrid, StatCard, Table } from "@/components/ui";
import { getInstagramDashboardData, percentChange } from "@/lib/data";
import { clientLogoSrc } from "@/lib/client-branding";
import { compact, currency, pct } from "@/lib/utils";

type PageProps = {
  searchParams?: Promise<{ range?: string; start?: string; end?: string; compare?: string }>;
};

export default async function SocialPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const compare = params?.compare === "previous";
  const { profile, client, clients, range, account, daily, previousDaily, content, paidRows, totals, previousTotals, status, lastUpdatedAt } = await getInstagramDashboardData(params?.range, params?.start, params?.end);
  const logoSrc = clientLogoSrc(client);
  const hasData = !status.error && !status.isEmpty;
  const tileState = status.error ? "error" : hasData ? "ready" : "empty";
  const hasFollowerHistory = daily.some((row) => row.followers_total !== null);
  const hasReachHistory = daily.some((row) => row.reach_total !== null || row.accounts_engaged !== null || row.total_interactions !== null);

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge>Instagram</Badge>
            <ClientSwitcher currentClient={client} clients={clients} profile={profile} variant="badge" />
            {account?.username ? <Badge>@{account.username}</Badge> : null}
          </div>
          <ClientPageTitle logoSrc={logoSrc} logoAlt={client?.name ?? undefined}><AccentText>Instagram</AccentText> Performance</ClientPageTitle>
          <p className="mt-1.5 max-w-3xl text-xs leading-5 text-white/50 sm:mt-2 sm:text-sm">Track account growth, audience activity, organic content performance, and paid promotion results.</p>
          <p className="mt-1 text-xs text-white/45">{range.label}{lastUpdatedAt ? ` · Updated ${formatTimestamp(lastUpdatedAt)}` : ""}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <DateRangePicker range={range} />
          <button type="button" disabled className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/35">
            <RefreshCw size={14} />
            Manual refresh pending n8n webhook
          </button>
        </div>
      </header>

      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load Instagram data: {status.error}</Card> : null}
      {!account && !status.error ? <Card className="text-sm text-white/58">No active Instagram account is connected for this client yet. The page will populate automatically once the n8n sync creates a social account row.</Card> : null}

      <MetricGrid>
        <StatCard label={<AccentText>Current followers</AccentText>} value={formatNumber(totals.followersTotal)} helper={compare ? trendHelper(percentChange(totals.followersTotal, previousTotals.followersTotal)) : undefined} state={totals.followersTotal === null ? tileState : "ready"} valueTitle="Latest follower count snapshot in the selected date range." />
        <StatCard label={<AccentText>Net followers gained</AccentText>} value={formatNumber(totals.netFollowersGained)} helper={compare ? trendHelper(percentChange(totals.netFollowersGained, previousTotals.netFollowersGained)) : undefined} state={totals.netFollowersGained === null ? tileState : "ready"} valueTitle="Followers gained minus unfollows." />
        <StatCard label={<AccentText>Total followers gained</AccentText>} value={formatNumber(totals.followersGained)} helper={compare ? trendHelper(percentChange(totals.followersGained, previousTotals.followersGained)) : undefined} state={totals.followersGained === null ? tileState : "ready"} />
        <StatCard label={<AccentText>Total unfollows</AccentText>} value={formatNumber(totals.unfollows)} helper={compare ? trendHelper(percentChange(totals.unfollows, previousTotals.unfollows)) : undefined} state={totals.unfollows === null ? tileState : "ready"} />
        <StatCard label={<AccentText>Accounts reached</AccentText>} value={formatNumber(totals.reachTotal)} helper={compare ? trendHelper(percentChange(totals.reachTotal, previousTotals.reachTotal)) : undefined} state={totals.reachTotal === null ? tileState : "ready"} />
        <StatCard label={<AccentText>Accounts engaged</AccentText>} value={formatNumber(totals.accountsEngaged)} helper={compare ? trendHelper(percentChange(totals.accountsEngaged, previousTotals.accountsEngaged)) : undefined} state={totals.accountsEngaged === null ? tileState : "ready"} />
        <StatCard label={<AccentText>Profile visits</AccentText>} value={formatNumber(totals.profileVisits)} helper={compare ? trendHelper(percentChange(totals.profileVisits, previousTotals.profileVisits)) : undefined} state={totals.profileVisits === null ? tileState : "ready"} />
        <StatCard label={<AccentText>Total interactions</AccentText>} value={formatNumber(totals.totalInteractions)} helper={compare ? trendHelper(percentChange(totals.totalInteractions, previousTotals.totalInteractions)) : undefined} state={totals.totalInteractions === null ? tileState : "ready"} />
        <StatCard label={<AccentText>Engagement rate</AccentText>} value={totals.engagementRate === null ? "Unavailable" : pct(totals.engagementRate * 100)} helper={compare ? trendHelper(percentChange(totals.engagementRate, previousTotals.engagementRate)) : undefined} state={totals.engagementRate === null ? tileState : "ready"} valueTitle="Total interactions divided by total reach." />
        <StatCard label={<AccentText>Content published</AccentText>} value={formatNumber(totals.contentPublished)} helper={compare ? trendHelper(percentChange(totals.contentPublished, previousTotals.contentPublished)) : undefined} state={totals.contentPublished === null ? tileState : "ready"} />
      </MetricGrid>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-base font-semibold sm:text-lg"><AccentText>Follower</AccentText> growth</h2>
          <p className="mb-4 text-sm text-white/45">Follower count, gained followers, unfollows, and net growth over the selected range.</p>
          {hasFollowerHistory ? <FollowerGrowthChart data={daily} /> : <EmptyState>No follower history is available for this date range yet.</EmptyState>}
        </Card>
        <Card>
          <h2 className="mb-2 text-base font-semibold sm:text-lg"><AccentText>Reach</AccentText> and engagement</h2>
          <p className="mb-4 text-sm text-white/45">Organic, paid, and total reach are only shown when the source API provides the split.</p>
          {hasReachHistory ? <ReachEngagementChart data={daily} /> : <EmptyState>No reach or engagement history is available for this date range yet.</EmptyState>}
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Organic</AccentText> vs paid performance</h2>
        <Table
          headers={["Metric", "Organic", "Paid", "Blended"]}
          rows={[
            ["Reach", formatNumber(totals.reachOrganic), formatNumber(totals.reachPaid ?? totals.paidReach), formatNumber(totals.reachTotal)],
            ["Impressions", formatNumber(totals.impressionsOrganic), formatNumber(totals.impressionsPaid ?? totals.paidImpressions), formatNumber(totals.impressionsTotal)],
            ["Engagements", "Unavailable", formatNumber(totals.paidEngagements), formatNumber(totals.totalInteractions)],
            ["Profile visits", "Unavailable", formatNumber(totals.paidProfileVisits), formatNumber(totals.profileVisits)],
            ["Video views", "Unavailable", formatNumber(totals.paidVideoViews), formatNumber(sumContent(content, "videoViews"))],
            ["Website / link clicks", formatNumber(totals.websiteClicks), formatNumber(totals.paidWebsiteClicks), formatNumber(addNullable(totals.websiteClicks, totals.paidWebsiteClicks))],
            ["Followers attributed to paid promotion", "Unavailable", formatNumber(totals.paidFollowers), "Unavailable"]
          ]}
        />
        <p className="mt-3 text-xs leading-5 text-white/42">Paid rows are Instagram-only Meta placement rows. Organic and paid splits remain unavailable instead of estimated when Instagram or Meta does not expose a reliable split.</p>
      </Card>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Content</AccentText> performance</h2>
          {content.length > 0 ? <InstagramContentTable rows={content} /> : <EmptyState>No Instagram content metrics are available for this date range yet.</EmptyState>}
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Top</AccentText> content</h2>
          {content.length > 0 ? <TopInstagramContent rows={content} /> : <EmptyState>No ranked content is available yet.</EmptyState>}
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-base font-semibold sm:text-lg"><AccentText>Publishing</AccentText> activity</h2>
          <p className="mb-4 text-sm text-white/45">Daily publishing volume by feed image, carousel, reel, and other content types.</p>
          {content.some((row) => row.published_at) ? <PublishingActivityChart data={content} /> : <EmptyState>No publishing activity is available for this date range yet.</EmptyState>}
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg"><AccentText>Paid Instagram</AccentText> promotion</h2>
          <Table
            headers={["Campaign", "Ad set", "Ad", "Placement", "Spend", "Reach", "Impr.", "Clicks", "Engagements", "Follows"]}
            rows={paidRows.map((row) => [
              row.campaign_name ?? row.campaign_id ?? "Unspecified",
              row.adset_name ?? row.adset_id ?? "Unspecified",
              row.ad_name ?? row.ad_id ?? "Unspecified",
              row.placement ?? "Instagram",
              currency.format(row.spend),
              formatNumber(row.reach),
              formatNumber(row.impressions),
              formatNumber(row.inline_link_clicks ?? row.clicks),
              formatNumber(row.engagements),
              formatNumber(row.follows)
            ])}
          />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold sm:text-lg"><AccentText>Performance</AccentText> insights</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {performanceInsights(totals).map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-5 text-white/55">{item.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function formatNumber(value: number | null) {
  return value === null ? "Unavailable" : compact.format(value);
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function trendHelper(change: number | null) {
  if (change === null) return "No prior period baseline";
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs prior period`;
}

function sumContent(rows: Array<{ videoViews: number | null }>, key: "videoViews") {
  let found = false;
  const total = rows.reduce((sum, row) => {
    const value = row[key];
    if (value === null) return sum;
    found = true;
    return sum + value;
  }, 0);
  return found ? total : null;
}

function addNullable(a: number | null, b: number | null) {
  if (a === null && b === null) return null;
  return (a ?? 0) + (b ?? 0);
}

function performanceInsights(totals: {
  netFollowersGained: number | null;
  reachTotal: number | null;
  engagementRate: number | null;
  paidSpend: number | null;
  paidReach: number | null;
}) {
  return [
    {
      title: "Growth signal",
      body: totals.netFollowersGained === null ? "Follower growth is not available yet. Confirm the account daily metrics workflow is syncing follower snapshots." : `Net follower growth for this range is ${compact.format(totals.netFollowersGained)}.`
    },
    {
      title: "Audience activity",
      body: totals.reachTotal === null ? "Reach has not been synced for this range yet." : `Instagram reached ${compact.format(totals.reachTotal)} accounts with an engagement rate of ${totals.engagementRate === null ? "unavailable" : pct(totals.engagementRate * 100)}.`
    },
    {
      title: "Paid readiness",
      body: totals.paidSpend === null ? "No Instagram placement spend is available yet. Paid rows will appear once Meta placement data is synced." : `Instagram paid promotion spend is ${currency.format(totals.paidSpend)} with ${formatNumber(totals.paidReach)} paid reach.`
    }
  ];
}
