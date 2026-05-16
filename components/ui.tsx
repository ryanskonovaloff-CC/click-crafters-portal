import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-border bg-panel p-5 shadow-glow", className)}>
      {children}
    </section>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border border-border bg-panelStrong px-2.5 py-1 text-xs text-white/70", className)}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, helper, state = "ready" }: { label: string; value: string; helper?: string; state?: "ready" | "empty" | "error" | "loading" }) {
  const muted = state !== "ready";
  return (
    <Card className="min-h-28">
      <p className="text-sm text-white/60">{label}</p>
      <p className={cn("mt-3 text-2xl font-semibold tracking-normal", muted ? "text-white/45" : "text-white")}>{value}</p>
      {helper ? <p className="mt-2 text-xs text-white/50">{helper}</p> : null}
    </Card>
  );
}

export function Table({ headers, rows }: { headers: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-white/50">
            {headers.map((header) => (
              <th key={header} className="py-3 pr-4 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-white/5 last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="py-3 pr-4 text-white/80">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <div className="rounded-b-lg border-t border-white/5 py-8 text-center text-sm text-white/45">No data available for this date range yet.</div> : null}
    </div>
  );
}

export function EmptyState({ children = "No data available for this date range yet." }: { children?: ReactNode }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-white/10 bg-black/20 px-4 text-center text-sm text-white/45">
      {children}
    </div>
  );
}

export function TileSkeleton() {
  return (
    <Card className="min-h-28 animate-pulse">
      <div className="h-4 w-24 rounded bg-white/10" />
      <div className="mt-4 h-7 w-32 rounded bg-white/10" />
      <div className="mt-3 h-3 w-28 rounded bg-white/5" />
    </Card>
  );
}
