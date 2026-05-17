import { DateRangePicker } from "@/components/date-range-picker";
import { Badge, Card, EmptyState } from "@/components/ui";
import { getReportsData } from "@/lib/data";

type PageProps = {
  searchParams?: Promise<{ range?: string; start?: string; end?: string }>;
};

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { range, reports, status } = await getReportsData(params?.range, params?.start, params?.end);

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <Badge>Monthly reporting</Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:mt-3 sm:text-3xl">Reports</h1>
          <p className="mt-1.5 text-xs text-white/50 sm:mt-2 sm:text-sm">{range.label}</p>
        </div>
        <DateRangePicker range={range} />
      </header>
      {status.error ? <Card className="border-red-400/30 text-sm text-red-100/80">Unable to load reports: {status.error}</Card> : null}
      <div className="grid gap-3 sm:gap-4">
        {reports.length > 0 ? reports.map((report) => (
          <Card key={report.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-accent">{report.report_month ?? `${report.period_start} - ${report.period_end}`}</p>
                <h2 className="mt-1.5 text-lg font-semibold sm:mt-2 sm:text-xl">{report.headline ?? "Monthly performance report"}</h2>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/40">{report.status ?? "draft"}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 xl:grid-cols-4">
              <ReportList title="Wins" items={report.wins} />
              <ReportList title="Issues" items={report.issues} />
              <ReportList title="Actions Taken" items={report.actions_taken} />
              <ReportList title="Next Steps" items={report.next_steps} />
            </div>
          </Card>
        )) : <EmptyState>No data available for this date range yet.</EmptyState>}
      </div>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-white/80 sm:text-sm">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-xs leading-5 text-white/60 sm:mt-3 sm:space-y-2 sm:text-sm">
        {items.length > 0 ? items.map((item) => <li key={item}>{item}</li>) : <li className="text-white/35">No items recorded.</li>}
      </ul>
    </div>
  );
}
