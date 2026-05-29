"use client";

import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { DateRange, DateRangeKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const presets: Array<{ key: DateRangeKey; label: string; compact?: string }> = [
  { key: "mtd", label: "Month to date", compact: "MTD" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days", compact: "Last 7" },
  { key: "custom", label: "Custom range" }
];

export function DateRangePicker({ range }: { range: DateRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const compare = searchParams.get("compare") === "previous";
  const [draftKey, setDraftKey] = useState<DateRangeKey>(range.key);
  const [draftStart, setDraftStart] = useState(range.start);
  const [draftEnd, setDraftEnd] = useState(range.end);
  const [draftCompare, setDraftCompare] = useState(compare);

  const label = useMemo(() => `${range.start} - ${range.end}`, [range.start, range.end]);

  useEffect(() => {
    if (open) return;
    setDraftKey(range.key);
    setDraftStart(range.start);
    setDraftEnd(range.end);
    setDraftCompare(compare);
  }, [compare, open, range.end, range.key, range.start]);

  function selectDraftRange(key: DateRangeKey) {
    setDraftKey(key);
    setOpen(true);
  }

  function applyDraft() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", draftKey);
    if (draftKey === "custom") {
      params.set("start", draftStart);
      params.set("end", draftEnd);
    } else {
      params.delete("start");
      params.delete("end");
    }
    if (draftCompare) {
      params.set("compare", "previous");
    } else {
      params.delete("compare");
    }
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function cancelDraft() {
    setDraftKey(range.key);
    setDraftStart(range.start);
    setDraftEnd(range.end);
    setDraftCompare(compare);
    setOpen(false);
  }

  return (
    <div className="relative w-full sm:w-auto">
      <div className="flex w-full flex-wrap items-center rounded-xl border border-white/10 bg-black/45 text-xs shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur sm:w-auto sm:text-sm">
        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex min-w-0 flex-1 basis-[calc(100%-58px)] items-center gap-2 border-r border-white/10 px-2.5 py-2 font-mono text-xs text-white/90 transition hover:bg-white/[0.03] sm:flex-none sm:basis-auto sm:gap-2.5 sm:px-3.5 sm:py-2.5 sm:text-sm">
          <CalendarDays size={15} className="shrink-0 text-accent sm:size-4" />
          <span className="truncate">{label}</span>
          <ChevronDown size={15} className={cn("shrink-0 text-white/45 transition sm:size-4", open && "rotate-180")} />
        </button>
        {presets.slice(0, 4).map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => selectDraftRange(preset.key)}
            className={cn(
              "border-r border-white/10 px-2.5 py-2 font-semibold text-white/48 transition last:border-r-0 hover:bg-white/[0.03] hover:text-white sm:px-3.5 sm:py-2.5",
              preset.key === "mtd" ? "basis-[58px] sm:basis-auto" : "flex-1 basis-1/3 sm:flex-none sm:basis-auto",
              draftKey === preset.key && "bg-accent/15 text-accent"
            )}
          >
            {preset.compact ?? preset.label}
          </button>
        ))}
      </div>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(92vw,460px)] overflow-hidden rounded-2xl border border-white/12 bg-[#0b0807]/95 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:mt-3">
          <div>
            <div className="border-b border-white/10 p-2">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => selectDraftRange(preset.key)}
                  className={cn("flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm text-white/64 transition hover:bg-white/5 hover:text-white", draftKey === preset.key && "bg-accent/15 text-accent hover:bg-accent/15 hover:text-accent")}
                >
                  {preset.label}
                  {draftKey === preset.key ? <Check size={15} /> : null}
                </button>
              ))}
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Custom Range</p>
              <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-white/60">
                  <span>Start date</span>
                  <input type="date" value={draftStart} onChange={(event) => { setDraftStart(event.target.value); setDraftKey("custom"); }} className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 font-mono text-white outline-none focus:border-accent" />
                </label>
                <label className="space-y-2 text-sm text-white/60">
                  <span>End date</span>
                  <input type="date" value={draftEnd} onChange={(event) => { setDraftEnd(event.target.value); setDraftKey("custom"); }} className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 font-mono text-white outline-none focus:border-accent" />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 sm:mt-5 sm:pt-4">
                <p className="font-mono text-xs text-white/70 sm:text-sm">{draftKey === "custom" ? `${draftStart} - ${draftEnd}` : presets.find((preset) => preset.key === draftKey)?.label}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={cancelDraft} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:px-4">Cancel</button>
                  <button type="button" onClick={applyDraft} className="rounded-lg border border-accent bg-accent px-3 py-2 text-sm font-semibold text-black transition hover:bg-accent/90 sm:px-4">Apply</button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white/80">Compare</p>
                  <p className="mt-1 text-xs text-white/45">Previous period: {range.previousStart} - {range.previousEnd}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draftCompare}
                  onClick={() => setDraftCompare((value) => !value)}
                  className={cn("relative h-6 w-11 rounded-full border border-white/10 transition", draftCompare ? "bg-accent" : "bg-white/10")}
                >
                  <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition", draftCompare ? "left-5" : "left-0.5")} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
