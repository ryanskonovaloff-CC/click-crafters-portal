"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
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

type FollowerChartRow = {
  date: string;
  followers: number | null;
  gained: number | null;
  unfollows: number | null;
  net: number | null;
};

type ReachChartRow = {
  date: string;
  totalReach: number | null;
  organicReach: number | null;
  paidReach: number | null;
  engaged: number | null;
  interactions: number | null;
};

function formatMetric(value: number | null | undefined) {
  return value === null || value === undefined ? "Unavailable" : value.toLocaleString();
}

function FollowerTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload?: FollowerChartRow }>; label?: string }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div style={tooltipStyle} className="space-y-1 px-3 py-2 text-sm">
      <p className="font-semibold text-white">{label}</p>
      <p className="text-white">Total followers: {formatMetric(row.followers)}</p>
      <p className="text-[#ff6a1a]">Gained: {formatMetric(row.gained)}</p>
      <p className="text-white/70">Unfollows: {formatMetric(row.unfollows)}</p>
      <p className="text-[#7dd3fc]">Net: {formatMetric(row.net)}</p>
    </div>
  );
}

function ReachTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload?: ReachChartRow }>; label?: string }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div style={tooltipStyle} className="space-y-1 px-3 py-2 text-sm">
      <p className="font-semibold text-white">{label}</p>
      <p className="text-white">Total reach: {formatMetric(row.totalReach)}</p>
      <p className="text-[#ff6a1a]">Organic reach: {formatMetric(row.organicReach)}</p>
      <p className="text-[#f59e0b]">Paid reach: {formatMetric(row.paidReach)}</p>
      <p className="text-[#7dd3fc]">Accounts engaged: {formatMetric(row.engaged)}</p>
      <p className="text-white/70">Interactions: {formatMetric(row.interactions)}</p>
    </div>
  );
}

export function FollowerGrowthChart({ data }: { data: SocialAccountDailyMetric[] }) {
  const rows = data.map((row) => ({
    date: row.metric_date.slice(5),
    followers: row.followers_total,
    gained: row.followers_gained,
    unfollows: row.unfollows,
    net: row.net_follower_growth ?? ((row.followers_gained ?? 0) - (row.unfollows ?? 0))
  }));
  const showDots = rows.length <= 2;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis yAxisId="change" tick={axisStyle} tickLine={false} axisLine={false} width={48} allowDecimals={false} />
          <Tooltip content={<FollowerTooltip />} />
          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.72)", fontSize: 12 }} />
          <Bar yAxisId="change" dataKey="gained" name="Gained" fill="#ff6a1a" radius={[5, 5, 0, 0]} maxBarSize={18} />
          <Bar yAxisId="change" dataKey="unfollows" name="Unfollows" fill="#a7a7a7" radius={[5, 5, 0, 0]} maxBarSize={18} />
          <Line yAxisId="change" type="monotone" dataKey="net" name="Net" stroke="#7dd3fc" strokeWidth={2} dot={showDots ? { r: 3 } : false} activeDot={{ r: 4 }} connectNulls />
        </ComposedChart>
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
  const valueRows = rows.filter((row) =>
    [row.totalReach, row.organicReach, row.paidReach, row.engaged, row.interactions].some((value) => value !== null && value !== undefined)
  );
  const showDots = valueRows.length <= 2;
  const dot = showDots ? { r: 3 } : false;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ReachTooltip />} />
          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.72)", fontSize: 12 }} />
          <Line type="monotone" dataKey="organicReach" name="Organic reach" stroke="#ff6a1a" strokeWidth={2} dot={dot} activeDot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="paidReach" name="Paid reach" stroke="#f59e0b" strokeWidth={2} dot={dot} activeDot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="engaged" name="Accounts engaged" stroke="#7dd3fc" strokeWidth={2} dot={dot} activeDot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="interactions" name="Interactions" stroke="#a7a7a7" strokeWidth={2} dot={dot} activeDot={{ r: 4 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PublishingActivityChart({ data }: { data: InstagramContentSummary[] }) {
  const byWeek = new Map<string, { week: string; image: number; carousel: number; reel: number; other: number; total: number }>();

  data.forEach((row) => {
    if (!row.published_at) return;
    const week = weekLabel(row.published_at);
    const current = byWeek.get(week) ?? { week, image: 0, carousel: 0, reel: 0, other: 0, total: 0 };
    const type = (row.media_type ?? "").toLowerCase();
    if (type.includes("carousel")) current.carousel += 1;
    else if (type.includes("reel") || type.includes("video")) current.reel += 1;
    else if (type.includes("image") || type.includes("photo")) current.image += 1;
    else current.other += 1;
    current.total += 1;
    byWeek.set(week, current);
  });

  const rows = Array.from(byWeek.values()).sort((a, b) => a.week.localeCompare(b.week));
  const totalPosts = rows.reduce((sum, row) => sum + row.total, 0);
  const averagePerWeek = rows.length ? totalPosts / rows.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-white/45">Published</p>
          <p className="mt-1 text-2xl font-semibold text-white">{totalPosts}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-white/45">Avg. per week</p>
          <p className="mt-1 text-2xl font-semibold text-white">{averagePerWeek.toFixed(1)}</p>
        </div>
      </div>
      <div className="h-60 w-full">
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="week" tick={axisStyle} tickLine={false} axisLine={false} />
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
    </div>
  );
}

function weekLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(5, 10);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + mondayOffset);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getUTCDate()).padStart(2, "0");
  return `${month}-${dayOfMonth}`;
}
