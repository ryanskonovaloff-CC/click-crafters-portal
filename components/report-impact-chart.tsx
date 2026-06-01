"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPerformance } from "@/lib/types";
import { currency } from "@/lib/utils";

type ImpactPoint = {
  label: string;
  spend: number;
  revenue: number;
};

export function ReportImpactChart({ data }: { data: DailyPerformance[] }) {
  const chartData = cumulativeImpactData(data);

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
          formatter={(value, name) => [currency.format(Number(value)), name === "revenue" ? "Revenue" : "Spend"]}
        />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#f7f2e8" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
        <Line type="monotone" dataKey="spend" name="Spend" stroke="#ff6a1a" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
        <Legend content={<ImpactLegend />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function cumulativeImpactData(data: DailyPerformance[]): ImpactPoint[] {
  const byDate = data.reduce<Record<string, { label: string; spend: number; revenue: number }>>((acc, item) => {
    acc[item.date] ??= { label: item.date.slice(5), spend: 0, revenue: 0 };
    acc[item.date].spend += item.spend;
    acc[item.date].revenue += item.revenue;
    return acc;
  }, {});

  let runningSpend = 0;
  let runningRevenue = 0;

  return Object.entries(byDate)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, item]) => {
      runningSpend += item.spend;
      runningRevenue += item.revenue;
      return {
        label: item.label,
        spend: runningSpend,
        revenue: runningRevenue
      };
    });
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
