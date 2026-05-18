import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { getReportsData } from "@/lib/data";
import type { MonthlyReport } from "@/lib/types";

export default async function ReportsPage() {
  const { profile, reports, status } = await getReportsData();
  const isAdmin = profile.role === "admin";

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <Badge>Monthly reporting</Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:mt-3 sm:text-3xl">Reports</h1>
          <p className="mt-1.5 text-xs text-white/50 sm:mt-2 sm:text-sm">Completed monthly reports</p>
        </div>
      </header>

      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load reports: {status.error}</Card> : null}

      <div className="grid gap-3 sm:gap-4">
        {reports.length > 0 ? reports.map((report) => (
          <ReportCard key={report.id} report={report} showStatus={isAdmin} />
        )) : (
          <EmptyState>No monthly reports have been published yet. Completed reports will appear here after each month closes.</EmptyState>
        )}
      </div>
    </div>
  );
}

function ReportCard({ report, showStatus }: { report: MonthlyReport; showStatus: boolean }) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1"><CalendarDays size={13} /> {formatMonth(report.report_month)}</Badge>
            {showStatus ? <StatusBadge status={report.status} /> : null}
          </div>
          <h2 className="mt-3 text-lg font-semibold sm:text-xl">{report.title ?? "Monthly Performance Report"}</h2>
          <p className="mt-1 text-xs text-white/45">
            {report.published_at ? `Published ${formatDate(report.published_at)}` : "Not published yet"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
            {previewText(report.executive_summary) ?? "Monthly report details are being prepared."}
          </p>
        </div>
        <Link
          href={`/dashboard/reports/${report.id}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-panelStrong px-3 py-2 text-sm text-white/80 transition hover:border-accent/60 hover:text-white"
        >
          View report <ArrowRight size={15} />
        </Link>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: MonthlyReport["status"] }) {
  const tone = status === "published" ? "border-emerald-400/30 text-emerald-100/80" : status === "archived" ? "border-white/15 text-white/50" : "border-amber-400/30 text-amber-100/80";
  return <Badge className={tone}>{status}</Badge>;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function previewText(value: string | null) {
  if (!value) return null;
  return value.length > 220 ? `${value.slice(0, 217).trim()}...` : value;
}
