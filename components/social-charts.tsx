"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { InstagramContentSummary } from "@/lib/data";
import type { SocialAccountDailyMetric } from "@/lib/types";

const tooltipStyle = {
  background: "#101010",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  color: "#fff",
  boxShadow: "0 18px 60px rgba(0,0,0,0.48)"
};

const axisStyle = { fill: "rgba(255,255,255,0.65)", fontSize: 12 };
const gridColor = "rgba(255,255,255,0.08)";

export function FollowerGrowthChart({ data }: { data: SocialAccountDailyMetric[] }) {
  const rows = data.map((row) => ({
    date: row.metric_date.slice(5),
    followers: row.followers_total,
    gained: row.followers_gained,
    unfollows: row.unfollows,
    net: row.net_follower_growth ?? ((row.followers_gained ?? 0) - (row.unfollows ?? 0))
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={48} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff", fontWeight: 700 }} />
          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.72)", fontSize: 12 }} />
          <Line type="monotone" dataKey="followers" name="Followers" stroke="#f7f2e8" strokeWidth={2.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="gained" name="Gained" stroke="#ff6a1a" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="unfollows" name="Unfollows" stroke="#a7a7a7" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="net" name="Net" stroke="#7dd3fc" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReachEngagementChart({ data }: { data: SocialAccountDailyMetric[] }) {
  const rows = data.map((row) => ({
    date: row.metric_date.slice(5),
    totalReach: row.reach_total,
    organicReach: row.reach_organic,
    paidReach: row.reach_paid,
    engaged: row.accounts_engaged,
    interactions: row.total_interactions
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={48} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff", fontWeight: 700 }} />
          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.72)", fontSize: 12 }} />
          <Line type="monotone" dataKey="totalReach" name="Total reach" stroke="#f7f2e8" strokeWidth={2.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="organicReach" name="Organic reach" stroke="#ff6a1a" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="paidReach" name="Paid reach" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="engaged" name="Accounts engaged" stroke="#7dd3fc" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="interactions" name="Interactions" stroke="#a7a7a7" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PublishingActivityChart({ data }: { data: InstagramContentSummary[] }) {
  const byDate = new Map<string, { date: string; image: number; carousel: number; reel: number; other: number }>();

  data.forEach((row) => {
    if (!row.published_at) return;
    const date = row.published_at.slice(5, 10);
    const current = byDate.get(date) ?? { date, image: 0, carousel: 0, reel: 0, other: 0 };
    const type = (row.media_type ?? "").toLowerCase();
    if (type.includes("carousel")) current.carousel += 1;
    else if (type.includes("reel") || type.includes("video")) current.reel += 1;
    else if (type.includes("image") || type.includes("photo")) current.image += 1;
    else current.other += 1;
    byDate.set(date, current);
  });

  const rows = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={48} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff", fontWeight: 700 }} />
          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.72)", fontSize: 12 }} />
          <Bar dataKey="image" name="Feed image" stackId="content" fill="#ff6a1a" radius={[6, 6, 0, 0]} />
          <Bar dataKey="carousel" name="Carousel" stackId="content" fill="#f7f2e8" radius={[6, 6, 0, 0]} />
          <Bar dataKey="reel" name="Reel" stackId="content" fill="#7dd3fc" radius={[6, 6, 0, 0]} />
          <Bar dataKey="other" name="Other" stackId="content" fill="#a7a7a7" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
