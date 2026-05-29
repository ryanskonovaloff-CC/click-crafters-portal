import { cn } from "@/lib/utils";

export function LoadingMark({ className }: { className?: string }) {
  return (
    <div className={cn("grid place-items-center py-8", className)}>
      <div className="relative grid size-20 place-items-center rounded-2xl border border-white/10 bg-black/45 shadow-[0_0_60px_rgba(255,106,26,0.18)]">
        <div className="absolute inset-[-2px] animate-spin rounded-[1.15rem] bg-[conic-gradient(from_0deg,rgba(255,106,26,0),#ff6a1a,#f7f2e8,rgba(255,106,26,0))] opacity-90" />
        <div className="absolute inset-[2px] rounded-2xl bg-[#080604]" />
        <img src="/assets/logo-mark.svg" alt="" className="relative z-10 size-10" aria-hidden="true" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/45">Loading</p>
    </div>
  );
}
