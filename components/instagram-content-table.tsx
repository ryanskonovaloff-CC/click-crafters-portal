"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import type { InstagramContentSummary } from "@/lib/data";
import { compact } from "@/lib/utils";
import { cn } from "@/lib/utils";

const pageSize = 10;
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 2 });
const selectClass = "h-9 rounded-lg border border-white/10 bg-[#090909] px-3 py-2 text-sm text-white [color-scheme:dark] outline-none transition focus:border-accent";
const optionClass = "bg-[#090909] text-white";

type SortKey = "published" | "reach" | "interactions" | "engagement" | "views";

export function InstagramContentTable({ rows }: { rows: InstagramContentSummary[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SortKey>("published");
  const [page, setPage] = useState(1);

  const mediaTypes = useMemo(() => Array.from(new Set(rows.map((row) => row.media_type).filter(Boolean) as string[])).sort(), [rows]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = rows.filter((row) => {
      const matchesQuery = !q || (row.caption ?? "").toLowerCase().includes(q);
      const matchesType = type === "all" || row.media_type === type;
      return matchesQuery && matchesType;
    });
    return visible.sort((a, b) => sortValue(b, sort) - sortValue(a, sort));
  }, [query, rows, sort, type]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Search captions"
            className="h-9 rounded-lg border border-white/10 bg-[#090909] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-accent"
          />
          <select
            value={type}
            onChange={(event) => { setType(event.target.value); setPage(1); }}
            className={selectClass}
          >
            <option className={optionClass} value="all">All content types</option>
            {mediaTypes.map((item) => <option className={optionClass} key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          className={selectClass}
        >
          <option className={optionClass} value="published">Newest first</option>
          <option className={optionClass} value="reach">Top reach</option>
          <option className={optionClass} value="interactions">Top interactions</option>
          <option className={optionClass} value="engagement">Top engagement rate</option>
          <option className={optionClass} value="views">Top video views</option>
        </select>
      </div>

      <div className="max-h-[36rem] w-full overflow-auto pr-1">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-white/50">
              {["Content", "Published", "Type", "Reach", "Impressions", "Likes", "Comments", "Shares", "Saves", "Interactions", "Eng. rate", "Views", "Watch time", "Profile activity", "Link"].map((header) => (
                <th key={header} className="py-3 pr-4 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 last:border-0">
                <td className="max-w-[22rem] py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-black/35 text-[10px] text-white/35">
                      {row.thumbnail_url || row.media_url ? <img src={row.thumbnail_url ?? row.media_url ?? ""} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : "No image"}
                    </div>
                    <p className="line-clamp-2 text-white/78">{row.caption || "No caption"}</p>
                  </div>
                </td>
                <td className="py-3 pr-4 text-white/70">{formatDate(row.published_at)}</td>
                <td className="py-3 pr-4 text-white/70">{row.media_type ?? "Unknown"}</td>
                <td className="py-3 pr-4 text-white/80">{formatNumber(row.reachTotal)}</td>
                <td className="py-3 pr-4 text-white/80">{formatNumber(row.impressionsTotal)}</td>
                <td className="py-3 pr-4 text-white/80">{formatNumber(row.likes)}</td>
                <td className="py-3 pr-4 text-white/80">{formatNumber(row.comments)}</td>
                <td className="py-3 pr-4 text-white/80">{formatNumber(row.shares)}</td>
                <td className="py-3 pr-4 text-white/80">{formatNumber(row.saves)}</td>
                <td className="py-3 pr-4 text-white/80">{formatNumber(row.totalInteractions)}</td>
                <td className="py-3 pr-4 text-white/80">{row.engagementRate === null ? "Unavailable" : percent.format(row.engagementRate)}</td>
                <td className="py-3 pr-4 text-white/80">{formatNumber(row.videoViews)}</td>
                <td className="py-3 pr-4 text-white/80">{row.averageWatchTimeSeconds === null ? "Unavailable" : `${Math.round(row.averageWatchTimeSeconds)}s`}</td>
                <td className="py-3 pr-4 text-white/80">{formatNumber(row.profileActivity)}</td>
                <td className="py-3 pr-4">
                  {row.permalink ? (
                    <Link href={row.permalink} target="_blank" className="inline-flex items-center gap-1 text-accent hover:text-accent/80">
                      Open <ExternalLink size={14} />
                    </Link>
                  ) : "Unavailable"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageRows.length === 0 ? <div className="rounded-b-lg border-t border-white/5 py-8 text-center text-sm text-white/45">No content matches this filter.</div> : null}
      </div>

      <div className="flex items-center justify-between text-sm text-white/55">
        <span>{filtered.length} content item{filtered.length === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className={cn("rounded-lg border border-white/10 px-3 py-1.5 text-white/75", currentPage <= 1 && "cursor-not-allowed opacity-40")}>Previous</button>
          <span>{currentPage} / {pageCount}</span>
          <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className={cn("rounded-lg border border-white/10 px-3 py-1.5 text-white/75", currentPage >= pageCount && "cursor-not-allowed opacity-40")}>Next</button>
        </div>
      </div>
    </div>
  );
}

export function TopInstagramContent({ rows }: { rows: InstagramContentSummary[] }) {
  const [rankBy, setRankBy] = useState<SortKey>("reach");
  const topRows = [...rows].sort((a, b) => sortValue(b, rankBy) - sortValue(a, rankBy)).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white/45">Rank by the metric that matters for the client conversation.</p>
        <select value={rankBy} onChange={(event) => setRankBy(event.target.value as SortKey)} className={selectClass}>
          <option className={optionClass} value="reach">Reach</option>
          <option className={optionClass} value="interactions">Interactions</option>
          <option className={optionClass} value="engagement">Engagement rate</option>
          <option className={optionClass} value="views">Video views</option>
        </select>
      </div>
      <div className="max-h-[33rem] space-y-3 overflow-y-auto pr-1">
        {topRows.map((row, index) => (
          <article key={row.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-accent/45 bg-accent/10 text-sm font-bold text-accent">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-white/85">{row.caption || row.media_type || "Instagram content"}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-white/52">
                  <div><dt>Reach</dt><dd className="mt-0.5 text-sm font-semibold text-white">{formatNumber(row.reachTotal)}</dd></div>
                  <div><dt>Interactions</dt><dd className="mt-0.5 text-sm font-semibold text-white">{formatNumber(row.totalInteractions)}</dd></div>
                  <div><dt>Eng. rate</dt><dd className="mt-0.5 text-sm font-semibold text-white">{row.engagementRate === null ? "Unavailable" : percent.format(row.engagementRate)}</dd></div>
                  <div><dt>Views</dt><dd className="mt-0.5 text-sm font-semibold text-white">{formatNumber(row.videoViews)}</dd></div>
                </dl>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function sortValue(row: InstagramContentSummary, key: SortKey) {
  if (key === "published") return row.published_at ? new Date(row.published_at).getTime() : 0;
  if (key === "reach") return row.reachTotal ?? 0;
  if (key === "interactions") return row.totalInteractions ?? 0;
  if (key === "engagement") return row.engagementRate ?? 0;
  return row.videoViews ?? 0;
}

function formatDate(value: string | null) {
  if (!value) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatNumber(value: number | null) {
  return value === null ? "Unavailable" : compact.format(value);
}
