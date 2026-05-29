"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPerformance } from "@/lib/types";
import { currency } from "@/lib/utils";

const IN_STORE_AOV = 24.87;
const ONLINE_ORDER_TRACKING_START = "2026-05-14";

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
  const byDate = data.reduce<Record<string, { date: string; label: string; spend: number; tracked_spend: number; revenue: number; conversions: number; store_visits: number; has_store_visits: boolean }>>((acc, item) => {
    acc[item.date] ??= { date: item.date, label: item.date.slice(5), spend: 0, tracked_spend: 0, revenue: 0, conversions: 0, store_visits: 0, has_store_visits: false };
    acc[item.date].spend += item.spend;
    if (item.date >= ONLINE_ORDER_TRACKING_START) acc[item.date].tracked_spend += item.spend;
    acc[item.date].revenue += item.revenue;
    acc[item.date].conversions += item.conversions;
    acc[item.date].store_visits += item.store_visits ?? 0;
    acc[item.date].has_store_visits ||= item.store_visits !== null;
    return acc;
  }, {});

  const showEstimatedRoas = metric === "roas" && Object.values(byDate).some((item) => item.has_store_visits);
  const chartData = Object.values(byDate).map((item) => {
    const dailyEstimatedInStorePurchases = Math.max(item.store_visits - item.conversions, 0);
    const estimatedTotalRevenue = item.revenue + dailyEstimatedInStorePurchases * IN_STORE_AOV;

    return {
      ...item,
      cpa: item.conversions ? item.spend / item.conversions : 0,
      roas: metric === "roas" ? (item.tracked_spend ? item.revenue / item.tracked_spend : null) : (item.spend ? item.revenue / item.spend : 0),
      estimated_blended_roas: item.has_store_visits && item.spend ? estimatedTotalRevenue / item.spend : null
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={tooltipStyle()}
          cursor={{ stroke: "rgba(247,242,232,0.22)", strokeWidth: 1 }}
          formatter={(value, name, item) => {
          const numericValue = Number(value);
          if (value === null || Number.isNaN(numericValue)) return ["Unavailable", name];
          if (metric === "spend" || metric === "cpa") return currency.format(numericValue);
          if (metric === "roas") {
            const seriesKey = String(item.dataKey ?? name);
            return [`${numericValue.toFixed(2)}x`, seriesKey === "estimated_blended_roas" ? "Est. blended ROAS" : "Platform ROAS"];
          }
          return numericValue.toFixed(0);
        }}
        />
        {showEstimatedRoas ? <Line type="monotone" dataKey="estimated_blended_roas" name="Est. blended ROAS" stroke="#f7f2e8" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} strokeDasharray="6 5" connectNulls /> : null}
        <Line type="monotone" dataKey={metric} name={metric === "roas" ? "Platform ROAS" : metric} stroke="#ff6a1a" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls={metric === "roas"} />
        {showEstimatedRoas ? <Legend /> : null}
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
