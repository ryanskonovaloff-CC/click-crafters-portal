"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { estimatedInStorePurchasesForRows, IN_STORE_AOV } from "@/lib/paid-estimates";
import type { DailyPerformance } from "@/lib/types";
import { currency } from "@/lib/utils";

type ImpactPoint = {
  label: string;
  month: string;
  spend: number;
  revenue: number;
  estimated_total_revenue: number | null;
};

export function ReportImpactChart({ data }: { data: DailyPerformance[] }) {
  const chartData = monthlyImpactData(data);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => currency.format(Number(value))} width={76} />
        <Tooltip
          contentStyle={{
            background: "#101010",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            color: "white"
          }}
          cursor={{ stroke: "rgba(247,242,232,0.22)", strokeWidth: 1 }}
          formatter={(value, name) => [currency.format(Number(value)), String(name)]}
        />
        <Line type="monotone" dataKey="estimated_total_revenue" name="Estimated total revenue" stroke="#a7a7a7" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5, strokeWidth: 2 }} connectNulls />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#f7f2e8" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5, strokeWidth: 2 }} />
        <Line type="monotone" dataKey="spend" name="Spend" stroke="#ff6a1a" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5, strokeWidth: 2 }} />
        <Legend content={<ImpactLegend />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function monthlyImpactData(data: DailyPerformance[]): ImpactPoint[] {
  const byMonth = data.reduce<Record<string, { spend: number; revenue: number; hasStoreVisits: boolean; rows: DailyPerformance[] }>>((acc, item) => {
    const monthKey = item.date.slice(0, 7);
    acc[monthKey] ??= { spend: 0, revenue: 0, hasStoreVisits: false, rows: [] };
    acc[monthKey].spend += item.spend;
    acc[monthKey].revenue += item.revenue;
    acc[monthKey].hasStoreVisits ||= item.store_visits !== null;
    acc[monthKey].rows.push(item);
    return acc;
  }, {});

  return Object.entries(byMonth)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([monthKey, item]) => {
      const estimatedInStorePurchases = estimatedInStorePurchasesForRows(item.rows);
      const estimatedTotalRevenue = item.hasStoreVisits ? item.revenue + (estimatedInStorePurchases ?? 0) * IN_STORE_AOV : null;

      return {
        label: shortMonthLabel(monthKey),
        month: longMonthLabel(monthKey),
        spend: item.spend,
        revenue: item.revenue,
        estimated_total_revenue: estimatedTotalRevenue
      };
    });
}

function shortMonthLabel(monthKey: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${monthKey}-01T00:00:00Z`));
}

function longMonthLabel(monthKey: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${monthKey}-01T00:00:00Z`));
}

function ImpactLegend({ payload }: { payload?: Array<{ value?: string; color?: string }> }) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-sm text-white/70">
      {payload.map((entry) => (
        <div key={entry.value} className="inline-flex items-center gap-2">
          <span className="h-0 w-8 border-t-2" style={{ borderColor: entry.color ?? "#ffffff" }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
