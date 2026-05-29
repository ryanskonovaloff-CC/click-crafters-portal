import { Card } from "@/components/ui";
import { LoadingMark } from "@/components/loading-mark";

export default function ReportsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
      <div className="h-24 animate-pulse rounded-xl bg-white/5" />
      <LoadingMark className="py-2" />
      <div className="grid gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="h-36 animate-pulse">
            <div />
          </Card>
        ))}
      </div>
    </div>
  );
}
