"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPerformance } from "@/lib/types";
import { currency } from "@/lib/utils";

const IN_STORE_AOV = 24.87;

type MonthlyPoint = {
  month: string;
  label: string;
  spend: number;
  revenue: number;
  estimated_total_revenue: number;
};

export function ReportImpactChart({ data }: { data: DailyPerformance[] }) {
  const chartData = aggregateByMonth(data);

  if (chartData.length === 0) {
    return <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-white/45">No monthly paid ads trend data available.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 10, right: 18, bottom: 6, left: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => currency.format(Number(value))} width={76} />
        <Tooltip
          contentStyle={{
            background: "#101010",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 8,
            color: "white"
          }}
          cursor={{ stroke: "rgba(247,242,232,0.22)", strokeWidth: 1 }}
          formatter={(value, name) => [currency.format(Number(value)), labelForSeries(String(name))]}
        />
        <Line type="monotone" dataKey="spend" name="Spend" stroke="#ff6a1a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="revenue" name="Online order revenue" stroke="#f7f2e8" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="estimated_total_revenue" name="Estimated total revenue" stroke="#a7a7a7" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}

function aggregateByMonth(data: DailyPerformance[]): MonthlyPoint[] {
  const months = data.reduce<Record<string, MonthlyPoint & { conversions: number; store_visits: number }>>((acc, row) => {
    const month = row.date.slice(0, 7);
    if (!month) return acc;

    acc[month] ??= {
      month,
      label: monthLabel(month),
      spend: 0,
      revenue: 0,
      estimated_total_revenue: 0,
      conversions: 0,
      store_visits: 0
    };
    acc[month].spend += row.spend;
    acc[month].revenue += row.revenue;
    acc[month].conversions += row.conversions;
    acc[month].store_visits += row.store_visits ?? 0;
    return acc;
  }, {});

  return Object.values(months)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => {
      const estimatedInStorePurchases = Math.max(row.store_visits - row.conversions, 0);
      return {
        month: row.month,
        label: row.label,
        spend: row.spend,
        revenue: row.revenue,
        estimated_total_revenue: row.revenue + estimatedInStorePurchases * IN_STORE_AOV
      };
    });
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${value}-01T00:00:00Z`));
}

function labelForSeries(value: string) {
  if (value === "revenue") return "Online order revenue";
  if (value === "estimated_total_revenue") return "Estimated total revenue";
  return value;
}
