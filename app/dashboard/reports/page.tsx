import { Badge, Card } from "@/components/ui";
import { getReportsData } from "@/lib/data";

export default async function ReportsPage() {
  const { reports } = await getReportsData();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <Badge>Monthly reporting</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Reports</h1>
      </header>
      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-accent">{new Date(`${report.month}-02`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                <h2 className="mt-2 text-xl font-semibold">{report.summary}</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ReportList title="Wins" items={report.wins} />
              <ReportList title="Issues" items={report.issues} />
              <ReportList title="Actions Taken" items={report.actions_taken} />
              <ReportList title="Next Steps" items={report.next_steps} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white/80">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-white/60">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
