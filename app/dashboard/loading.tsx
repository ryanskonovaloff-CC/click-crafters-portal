import { TileSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="h-24 animate-pulse rounded-xl bg-white/5" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => <TileSkeleton key={index} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl border border-border bg-panel" />
        <div className="h-80 animate-pulse rounded-xl border border-border bg-panel" />
      </div>
    </div>
  );
}
