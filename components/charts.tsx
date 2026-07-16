"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { estimatedInStorePurchasesForRows, IN_STORE_AOV } from "@/lib/paid-estimates";
import type { DailyPerformance } from "@/lib/types";
import { cn, currency } from "@/lib/utils";

const ONLINE_ORDER_TRACKING_START = "2026-05-14";

function tooltipStyle() {
  return {
    background: "#101010",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "white"
  };
}

export function TrendChart({ data, metric, previousData = [], compare = false }: { data: DailyPerformance[]; metric: "spend" | "conversions" | "store_visits" | "cpa" | "roas"; previousData?: DailyPerformance[]; compare?: boolean }) {
  const height = useMobileChartHeight();
  const byDate = aggregateByDate(data);
  const previousPoints = Object.values(aggregateByDate(previousData)).map(toChartPoint);
  const showEstimatedRoas = metric === "roas" && Object.values(byDate).some((item) => item.has_store_visits);
  const metricName = metricLabel(metric);
  const chartData = Object.values(byDate).map((item, index) => {
    const point = toChartPoint(item);
    const previousPoint = previousPoints[index];
    return {
      ...point,
      previous_metric: previousPoint?.[metric] ?? null,
      previous_estimated_blended_roas: previousPoint?.estimated_blended_roas ?? null
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
            if (seriesKey === "estimated_blended_roas") return [`${numericValue.toFixed(2)}x`, "Est. blended ROAS"];
            if (seriesKey === "previous_estimated_blended_roas") return [`${numericValue.toFixed(2)}x`, "Prev. est. blended ROAS"];
            if (seriesKey === "previous_metric") return [`${numericValue.toFixed(2)}x`, "Prev. online order ROAS"];
            return [`${numericValue.toFixed(2)}x`, "Online Order ROAS"];
          }
          return numericValue.toFixed(0);
        }}
        />
        {showEstimatedRoas ? <Line type="monotone" dataKey="estimated_blended_roas" name="Est. blended ROAS" stroke="#f7f2e8" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls /> : null}
        <Line type="monotone" dataKey={metric} name={metricName} stroke="#ff6a1a" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls={metric === "roas"} />
        {compare && showEstimatedRoas ? <Line type="monotone" dataKey="previous_estimated_blended_roas" name="Prev. est. blended ROAS" stroke="#f7f2e8" strokeWidth={2} dot={false} strokeDasharray="6 5" opacity={0.75} connectNulls /> : null}
        {compare ? <Line type="monotone" dataKey="previous_metric" name={metric === "roas" ? "Prev. online order ROAS" : `Prev. ${metricName.toLowerCase()}`} stroke="#ff6a1a" strokeWidth={2} dot={false} strokeDasharray="6 5" opacity={0.75} connectNulls={metric === "roas"} /> : null}
        {showEstimatedRoas || compare ? <Legend content={<LineLegend />} /> : null}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PlatformCpaChart({ data, previousData = [], compare = false }: { data: DailyPerformance[]; previousData?: DailyPerformance[]; compare?: boolean }) {
  const height = useMobileChartHeight();
  const currentPoints = buildPlatformCpaPoints(data);
  const previousPoints = buildPlatformCpaPoints(previousData);
  const chartData = currentPoints.map((point, index) => ({
    ...point,
    previous_google_cpa: previousPoints[index]?.google_cpa ?? null,
    previous_meta_cpa: previousPoints[index]?.meta_cpa ?? null
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => currency.format(Number(value))} />
        <Tooltip
          contentStyle={tooltipStyle()}
          cursor={{ stroke: "rgba(247,242,232,0.22)", strokeWidth: 1 }}
          formatter={(value, name) => {
            const numericValue = Number(value);
            if (value === null || Number.isNaN(numericValue)) return ["Unavailable", name];
            return [currency.format(numericValue), name];
          }}
        />
        <Line type="monotone" dataKey="google_cpa" name="Google CPA" stroke="#ff6a1a" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls />
        <Line type="monotone" dataKey="meta_cpa" name="Meta CPA" stroke="#f7f2e8" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls />
        {compare ? <Line type="monotone" dataKey="previous_google_cpa" name="Prev. Google CPA" stroke="#ff6a1a" strokeWidth={2} dot={false} strokeDasharray="6 5" opacity={0.75} connectNulls /> : null}
        {compare ? <Line type="monotone" dataKey="previous_meta_cpa" name="Prev. Meta CPA" stroke="#f7f2e8" strokeWidth={2} dot={false} strokeDasharray="6 5" opacity={0.75} connectNulls /> : null}
        <Legend content={<LineLegend />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PlatformRoasChart({ data, previousData = [], compare = false }: { data: DailyPerformance[]; previousData?: DailyPerformance[]; compare?: boolean }) {
  const height = useMobileChartHeight();
  const currentPoints = buildPlatformRoasPoints(data);
  const previousPoints = buildPlatformRoasPoints(previousData);
  const chartData = currentPoints.map((point, index) => ({
    ...point,
    previous_google_roas: previousPoints[index]?.google_roas ?? null,
    previous_meta_roas: previousPoints[index]?.meta_roas ?? null,
    previous_blended_roas: previousPoints[index]?.blended_roas ?? null
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value).toFixed(0)}x`} />
        <Tooltip
          contentStyle={tooltipStyle()}
          cursor={{ stroke: "rgba(247,242,232,0.22)", strokeWidth: 1 }}
          formatter={(value, name) => {
            const numericValue = Number(value);
            if (value === null || Number.isNaN(numericValue)) return ["Unavailable", name];
            return [`${numericValue.toFixed(2)}x`, name];
          }}
        />
        <Line type="monotone" dataKey="blended_roas" name="Total est. blended ROAS" stroke="#7dd3fc" strokeWidth={2.75} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls />
        <Line type="monotone" dataKey="google_roas" name="Google ROAS" stroke="#ff6a1a" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls />
        <Line type="monotone" dataKey="meta_roas" name="Meta ROAS" stroke="#f7f2e8" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls />
        {compare ? <Line type="monotone" dataKey="previous_blended_roas" name="Prev. total est. blended ROAS" stroke="#7dd3fc" strokeWidth={2} dot={false} strokeDasharray="6 5" opacity={0.75} connectNulls /> : null}
        {compare ? <Line type="monotone" dataKey="previous_google_roas" name="Prev. Google ROAS" stroke="#ff6a1a" strokeWidth={2} dot={false} strokeDasharray="6 5" opacity={0.75} connectNulls /> : null}
        {compare ? <Line type="monotone" dataKey="previous_meta_roas" name="Prev. Meta ROAS" stroke="#f7f2e8" strokeWidth={2} dot={false} strokeDasharray="6 5" opacity={0.75} connectNulls /> : null}
        <Legend content={<LineLegend />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function LineLegend({ payload }: { payload?: Array<{ value?: string; color?: string; dataKey?: string | number }> }) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 text-sm text-white/70">
      {payload.map((entry) => {
        const dataKey = String(entry.dataKey ?? "");
        const previous = dataKey.startsWith("previous_");
        return (
          <div key={`${dataKey}-${entry.value}`} className="inline-flex items-center gap-2">
            <span className={cn("h-0 w-8 border-t-2", previous && "border-dashed")} style={{ borderColor: entry.color ?? "#ffffff" }} />
            <span>{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function buildPlatformCpaPoints(data: DailyPerformance[]) {
  const byDate = data.reduce<Record<string, { date: string; label: string; googleSpend: number; googleOrders: number; metaSpend: number; metaOrders: number }>>((acc, row) => {
    acc[row.date] ??= { date: row.date, label: row.date.slice(5), googleSpend: 0, googleOrders: 0, metaSpend: 0, metaOrders: 0 };
    const platform = row.platform.toLowerCase();
    const onlineOrders = row.conversions;

    if (platform.includes("google")) {
      acc[row.date].googleSpend += row.spend;
      acc[row.date].googleOrders += onlineOrders;
    } else if (platform.includes("meta") || platform.includes("facebook") || platform.includes("instagram")) {
      acc[row.date].metaSpend += row.spend;
      acc[row.date].metaOrders += onlineOrders;
    }

    return acc;
  }, {});

  return Object.values(byDate).map((row) => ({
    date: row.date,
    label: row.label,
    google_cpa: row.googleOrders > 0 ? row.googleSpend / row.googleOrders : null,
    meta_cpa: row.metaOrders > 0 ? row.metaSpend / row.metaOrders : null
  }));
}

function buildPlatformRoasPoints(data: DailyPerformance[]) {
  const byDate = data.reduce<Record<string, { date: string; label: string; googleSpend: number; googleRevenue: number; metaSpend: number; metaRevenue: number; totalSpend: number; totalRevenue: number; rows: DailyPerformance[] }>>((acc, row) => {
    acc[row.date] ??= { date: row.date, label: row.date.slice(5), googleSpend: 0, googleRevenue: 0, metaSpend: 0, metaRevenue: 0, totalSpend: 0, totalRevenue: 0, rows: [] };
    const platform = row.platform.toLowerCase();
    acc[row.date].totalSpend += row.spend;
    acc[row.date].totalRevenue += row.revenue;
    acc[row.date].rows.push(row);

    if (platform.includes("google")) {
      if (row.date >= ONLINE_ORDER_TRACKING_START) {
        acc[row.date].googleSpend += row.spend;
        acc[row.date].googleRevenue += row.revenue;
      }
    } else if (platform.includes("meta") || platform.includes("facebook") || platform.includes("instagram")) {
      acc[row.date].metaSpend += row.spend;
      acc[row.date].metaRevenue += row.revenue;
    }

    return acc;
  }, {});

  return Object.values(byDate).map((row) => {
    const estimatedInStorePurchases = estimatedInStorePurchasesForRows(row.rows);
    const estimatedTotalRevenue = row.totalRevenue + (estimatedInStorePurchases ?? 0) * IN_STORE_AOV;

    return {
      date: row.date,
      label: row.label,
      google_roas: row.googleSpend > 0 ? row.googleRevenue / row.googleSpend : null,
      meta_roas: row.metaSpend > 0 ? row.metaRevenue / row.metaSpend : null,
      blended_roas: estimatedInStorePurchases !== null && row.totalSpend > 0 ? estimatedTotalRevenue / row.totalSpend : null
    };
  });
}

function metricLabel(metric: "spend" | "conversions" | "store_visits" | "cpa" | "roas") {
  if (metric === "conversions") return "Online orders";
  if (metric === "store_visits") return "Store visits";
  if (metric === "cpa") return "CPA";
  if (metric === "roas") return "Online Order ROAS";
  return "Spend";
}

function aggregateByDate(data: DailyPerformance[]) {
  return data.reduce<Record<string, { date: string; label: string; spend: number; tracked_spend: number; revenue: number; conversions: number; store_visits: number; has_store_visits: boolean; rows: DailyPerformance[] }>>((acc, item) => {
    acc[item.date] ??= { date: item.date, label: item.date.slice(5), spend: 0, tracked_spend: 0, revenue: 0, conversions: 0, store_visits: 0, has_store_visits: false, rows: [] };
    acc[item.date].spend += item.spend;
    if (item.platform !== "Google Ads" || item.date >= ONLINE_ORDER_TRACKING_START) acc[item.date].tracked_spend += item.spend;
    acc[item.date].revenue += item.revenue;
    acc[item.date].conversions += item.conversions;
    acc[item.date].store_visits += item.store_visits ?? 0;
    acc[item.date].has_store_visits ||= item.store_visits !== null;
    acc[item.date].rows.push(item);
    return acc;
  }, {});
}

function toChartPoint(item: { date: string; label: string; spend: number; tracked_spend: number; revenue: number; conversions: number; store_visits: number; has_store_visits: boolean; rows: DailyPerformance[] }) {
  const dailyEstimatedInStorePurchases = estimatedInStorePurchasesForRows(item.rows);
  const estimatedTotalRevenue = item.revenue + (dailyEstimatedInStorePurchases ?? 0) * IN_STORE_AOV;

  return {
    ...item,
    cpa: item.conversions ? item.spend / item.conversions : 0,
    roas: item.tracked_spend ? item.revenue / item.tracked_spend : null,
    estimated_blended_roas: item.has_store_visits && item.spend ? estimatedTotalRevenue / item.spend : null
  };
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
        <Tooltip content={<PlatformTooltip />} cursor={false} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function PlatformTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }> }) {
  const item = payload?.[0];
  if (!active || !item) return null;

  return (
    <div className="rounded-lg border border-white/12 bg-[#101010] px-3 py-2 text-left text-xs font-semibold leading-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.48)]">
      <span className="text-accent">{item.name ?? "Platform"}</span>
      <span className="text-white/70"> : </span>
      <span className="text-white">{currency.format(Number(item.value ?? 0))}</span>
    </div>
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
