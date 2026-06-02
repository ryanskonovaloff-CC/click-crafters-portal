import { notFound } from "next/navigation";
import { getMonthlyReportData } from "@/lib/data";
import { generateMonthlyReportPdf, reportPdfFilename } from "@/lib/report-pdf";

type RouteContext = {
  params: Promise<{ reportId: string }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteContext) {
  const { reportId } = await params;
  const { report, status } = await getMonthlyReportData(reportId);

  if (!report && !status.error) notFound();
  if (!report) {
    return new Response("Unable to load report.", { status: 500 });
  }

  const pdf = generateMonthlyReportPdf(report);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reportPdfFilename(report)}"`,
      "Cache-Control": "no-store"
    }
  });
}
