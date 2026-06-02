import { Download } from "lucide-react";

export function ReportDownloadButton({ reportId }: { reportId: string }) {
  return (
    <a
      href={`/dashboard/reports/${reportId}/pdf`}
      className="portal-print-hidden inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/72 transition hover:border-accent/50 hover:text-white sm:w-auto"
    >
      <Download size={16} />
      Download PDF
    </a>
  );
}
