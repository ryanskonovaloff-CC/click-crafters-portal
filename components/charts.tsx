"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CampaignPerformance, DailyPerformance } from "@/lib/types";
import { currency } from "@/lib/utils";

function tooltipStyle() {
  return {
    background: "#101010",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "white"
  };
}

export function TrendChart({ data, metric }: { data: DailyPerformance[]; metric: "spend" | "conversions" | "cpa" | "roas" }) {
  const byDate = data.reduce<Record<string, { date: string; spend: number; revenue: number; conversions: number }>>((acc, item) => {
    acc[item.date] ??= { date: item.date.slice(5), spend: 0, revenue: 0, conversions: 0 };
    acc[item.date].spend += item.spend;
    acc[item.date].revenue += item.revenue;
    acc[item.date].conversions += item.conversions;
    return acc;
  }, {});

  const chartData = Object.values(byDate).map((item) => ({
    ...item,
    cpa: item.conversions ? item.spend / item.conversions : 0,
    roas: item.spend ? item.revenue / item.spend : 0
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle()} formatter={(value: number) => metric === "spend" || metric === "cpa" ? currency.format(value) : value.toFixed(metric === "roas" ? 2 : 0)} />
        <Line type="monotone" dataKey={metric} stroke="#ff6a1a" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PlatformBreakdown({ data }: { data: DailyPerformance[] }) {
  const platforms = Object.values(data.reduce<Record<string, { name: string; spend: number }>>((acc, item) => {
    acc[item.platform] ??= { name: item.platform, spend: 0 };
    acc[item.platform].spend += item.spend;
    return acc;
  }, {}));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={platforms} dataKey="spend" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={3}>
          {platforms.map((entry, index) => (
            <Cell key={entry.name} fill={index === 0 ? "#ff6a1a" : "#ffffff"} opacity={index === 0 ? 1 : 0.72} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle()} formatter={(value: number) => currency.format(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CampaignComparison({ data }: { data: CampaignPerformance[] }) {
  const chartData = data.slice(0, 6).map((item) => ({
    name: item.campaign_name.replace("Press Burger ", ""),
    spend: item.spend,
    revenue: item.revenue,
    conversions: item.conversions
  }));

  return (
    <ResponsiveContainer width="100%" height={310}>
      <BarChart data={chartData}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle()} formatter={(value: number, name: string) => name === "conversions" ? value : currency.format(value)} />
        <Legend />
        <Bar dataKey="spend" fill="#ff6a1a" radius={[6, 6, 0, 0]} />
        <Bar dataKey="revenue" fill="rgba(255,255,255,0.72)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
