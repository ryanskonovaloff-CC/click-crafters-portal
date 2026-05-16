"use client";

import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { DateRange, DateRangeKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const presets: Array<{ key: DateRangeKey; label: string; compact?: string }> = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last3", label: "Last 3 days", compact: "Last 3" },
  { key: "last7", label: "Last 7 days", compact: "Last 7" },
  { key: "last14", label: "Last 14 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "mtd", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "custom", label: "Custom range" }
];

export function DateRangePicker({ range }: { range: DateRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(range.start);
  const [end, setEnd] = useState(range.end);

  const label = useMemo(() => `${range.start} - ${range.end}`, [range.start, range.end]);

  function setRange(key: DateRangeKey, nextStart = start, nextEnd = end) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", key);
    if (key === "custom") {
      params.set("start", nextStart);
      params.set("end", nextEnd);
    } else {
      params.delete("start");
      params.delete("end");
    }
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function applyCustom() {
    setRange("custom", start, end);
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center rounded-xl border border-sky-400/45 bg-[#101721]/90 text-sm shadow-[0_0_40px_rgba(56,148,218,0.12)]">
        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-3 border-r border-white/10 px-4 py-3 font-mono text-base text-white/90">
          <CalendarDays size={16} className="text-sky-300" />
          {label}
          <ChevronDown size={16} className={cn("text-white/45 transition", open && "rotate-180")} />
        </button>
        <span className="hidden border-r border-white/10 px-4 py-3 font-mono text-white/55 sm:inline">00 - 23</span>
        {presets.slice(0, 4).map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => setRange(preset.key)}
            className={cn("border-r border-white/10 px-4 py-3 font-semibold text-white/45 transition last:border-r-0 hover:text-white", range.key === preset.key && "bg-sky-400/20 text-sky-300")}
          >
            {preset.compact ?? preset.label}
          </button>
        ))}
      </div>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-[min(92vw,760px)] overflow-hidden rounded-xl border border-white/12 bg-[#202833] shadow-2xl">
          <div className="grid md:grid-cols-[255px_1fr]">
            <div className="border-r border-white/15 bg-[#161d26] py-3">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => preset.key === "custom" ? setRange("custom", start, end) : setRange(preset.key)}
                  className={cn("flex w-full items-center justify-between px-5 py-3 text-left text-sm text-white/62 transition hover:bg-white/5 hover:text-white", range.key === preset.key && "bg-sky-400 text-black hover:bg-sky-400 hover:text-black")}
                >
                  {preset.label}
                  {range.key === preset.key ? <Check size={15} /> : null}
                </button>
              ))}
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Custom Range</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-white/60">
                  <span>Start date</span>
                  <input type="date" value={start} onChange={(event) => setStart(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-white outline-none focus:border-sky-300" />
                </label>
                <label className="space-y-2 text-sm text-white/60">
                  <span>End date</span>
                  <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-white outline-none focus:border-sky-300" />
                </label>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <p className="font-mono text-sm text-white/70">{start} - {end}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black">Cancel</button>
                  <button type="button" onClick={applyCustom} className="rounded-lg border border-sky-300 bg-sky-400 px-4 py-2 text-sm font-semibold text-black">Apply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
