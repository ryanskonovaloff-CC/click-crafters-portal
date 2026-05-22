"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPerformance } from "@/lib/types";
import { currency } from "@/lib/utils";

function tooltipStyle() {
  return {
    background: "#101010",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "white"
  };
}

export function TrendChart({ data, metric }: { data: DailyPerformance[]; metric: "spend" | "conversions" | "store_visits" | "cpa" | "roas" }) {
  const height = useMobileChartHeight();
  const byDate = data.reduce<Record<string, { date: string; spend: number; revenue: number; conversions: number; store_visits: number }>>((acc, item) => {
    acc[item.date] ??= { date: item.date.slice(5), spend: 0, revenue: 0, conversions: 0, store_visits: 0 };
    acc[item.date].spend += item.spend;
    acc[item.date].revenue += item.revenue;
    acc[item.date].conversions += item.conversions;
    acc[item.date].store_visits += item.store_visits ?? 0;
    return acc;
  }, {});

  const chartData = Object.values(byDate).map((item) => ({
    ...item,
    cpa: item.conversions ? item.spend / item.conversions : 0,
    roas: item.spend ? item.revenue / item.spend : 0
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle()} formatter={(value: number) => {
          if (metric === "spend" || metric === "cpa") return currency.format(value);
          if (metric === "roas") return `${value.toFixed(2)}x`;
          return value.toFixed(0);
        }} />
        <Line type="monotone" dataKey={metric} stroke="#ff6a1a" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PlatformBreakdown({ data }: { data: DailyPerformance[] }) {
  const height = useMobileChartHeight();
  const platforms = Object.values(data.reduce<Record<string, { name: string; spend: number }>>((acc, item) => {
    acc[item.platform] ??= { name: item.platform, spend: 0 };
    acc[item.platform].spend += item.spend;
    return acc;
  }, {}));

  return (
    <ResponsiveContainer width="100%" height={height}>
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

function useMobileChartHeight() {
  const [height, setHeight] = useState(260);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setHeight(media.matches ? 220 : 260);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return height;
}
