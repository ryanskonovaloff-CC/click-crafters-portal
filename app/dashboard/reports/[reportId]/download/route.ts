import { NextResponse } from "next/server";
import { getMonthlyReportData } from "@/lib/data";
import { generateMonthlyReportPdf, reportPdfFilename } from "@/lib/report-pdf";

type RouteProps = {
  params: Promise<{ reportId: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { reportId } = await params;
  const { report, status } = await getMonthlyReportData(reportId);

  if (!report) {
    return NextResponse.json({ error: status.error ?? "Report not found." }, { status: status.error ? 500 : 404 });
  }

  const pdf = generateMonthlyReportPdf(report);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reportPdfFilename(report)}"`
    }
  });
}
