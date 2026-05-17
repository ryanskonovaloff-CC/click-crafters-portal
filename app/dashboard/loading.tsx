import { MetricGrid, TileSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <div className="h-20 animate-pulse rounded-xl bg-white/5 sm:h-24" />
      <MetricGrid>
        {Array.from({ length: 8 }).map((_, index) => <TileSkeleton key={index} />)}
      </MetricGrid>
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border border-border bg-panel sm:h-80" />
        <div className="h-64 animate-pulse rounded-xl border border-border bg-panel sm:h-80" />
      </div>
    </div>
  );
}
