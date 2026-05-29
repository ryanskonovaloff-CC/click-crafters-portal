import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-xl border border-border bg-panel p-4 shadow-glow sm:p-5", className)}>
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

export function AccentText({ children }: { children: ReactNode }) {
  return <span className="text-accent">{children}</span>;
}

export function ClientPageTitle({ logoSrc, logoAlt, children, className }: { logoSrc?: string | null; logoAlt?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-2 flex min-w-0 items-center gap-3 sm:mt-3 sm:gap-4", className)}>
      {logoSrc ? (
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-black/35 p-1.5 shadow-[0_0_35px_rgba(255,255,255,0.06)] sm:size-14">
          <img src={logoSrc} alt={logoAlt ?? ""} className="h-full w-full object-contain" />
        </span>
      ) : null}
      <h1 className="min-w-0 text-2xl font-semibold tracking-normal sm:text-3xl">{children}</h1>
    </div>
  );
}

export function StatCard({ label, value, helper, valueTitle, state = "ready" }: { label: ReactNode; value: string; helper?: string; valueTitle?: string; state?: "ready" | "empty" | "error" | "loading" }) {
  const muted = state !== "ready";
  return (
    <Card className="min-h-[92px] sm:min-h-28">
      <p className="text-xs text-white/60 sm:text-sm">{label}</p>
      <p title={valueTitle} className={cn("mt-2 break-words text-xl font-semibold tracking-normal sm:mt-3 sm:text-2xl", valueTitle && "cursor-help", muted ? "text-white/45" : "text-white")}>{value}</p>
      {helper ? <p className="mt-1.5 text-[11px] leading-4 text-white/50 sm:mt-2 sm:text-xs">{helper}</p> : null}
    </Card>
  );
}

export function MetricGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export function Table({ headers, rows }: { headers: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm sm:min-w-[680px]">
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
                <td key={cellIndex} className="max-w-[18rem] break-words py-3 pr-4 text-white/80">{cell}</td>
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
    <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-white/10 bg-black/20 px-4 text-center text-sm text-white/45 sm:min-h-48">
      {children}
    </div>
  );
}

export function TileSkeleton() {
  return (
    <Card className="min-h-[92px] animate-pulse sm:min-h-28">
      <div className="h-4 w-24 rounded bg-white/10" />
      <div className="mt-3 h-6 w-28 rounded bg-white/10 sm:mt-4 sm:h-7 sm:w-32" />
      <div className="mt-2 h-3 w-24 rounded bg-white/5 sm:mt-3 sm:w-28" />
    </Card>
  );
}
