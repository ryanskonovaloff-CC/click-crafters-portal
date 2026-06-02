import type { MonthlyReport } from "@/lib/types";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 44;
const LINE_HEIGHT = 15;
const ORANGE = [1, 0.416, 0.102] as const;
const OFF_WHITE = [0.957, 0.945, 0.91] as const;
const MUTED = [0.68, 0.68, 0.68] as const;
const DARK = [0.027, 0.027, 0.027] as const;
const PANEL = [0.065, 0.065, 0.065] as const;
const BORDER = [0.19, 0.19, 0.19] as const;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1
});

export function generateMonthlyReportPdf(report: MonthlyReport) {
  const pdf = new PdfBuilder();
  const paid = report.paid_ads_summary ? readObject(report.paid_ads_summary, "current") ?? report.paid_ads_summary : null;
  const seo = report.seo_summary ? readObject(report.seo_summary, "summary") ?? report.seo_summary : null;
  const clientName = report.client_name ?? "Client";
  const reportTitle = `${clientName} Monthly Performance Report`;

  pdf.title(clientName, reportTitle);
  pdf.text([formatMonth(report.report_month), periodLabel(report), report.published_at ? `Published ${formatDate(report.published_at)}` : null].filter(Boolean).join("  |  "), { color: MUTED });
  pdf.gap(16);

  pdf.section("Executive Summary");
  pdf.paragraph(hasMeaningfulCopy(report.executive_summary) ? report.executive_summary! : fallbackExecutiveSummary(report, paid, seo));

  pdf.section("KPI Overview");
  pdf.metrics([
    ["Spend", formatCurrency(paid ? readNumber(paid, "spend", "total_spend") : null)],
    ["Revenue", formatCurrency(paid ? readNumber(paid, "revenue", "conversion_value", "total_revenue") : null)],
    ["Estimated total revenue", formatCurrency(paid ? readNumber(paid, "estimated_total_revenue", "estimatedTotalRevenue") : null)],
    ["Online orders", formatCount(paid ? readNumber(paid, "conversions", "online_orders") : null)],
    ["ROAS", formatMultiplier(paid ? readNumber(paid, "roas") : null)],
    ["Estimated blended ROAS", formatMultiplier(paid ? readNumber(paid, "estimated_blended_roas", "estimatedBlendedRoas") : null)],
    ["Organic clicks", formatCount(seo ? readNumber(seo, "organic_clicks", "clicks") : null)],
    ["Organic impressions", formatCount(seo ? readNumber(seo, "organic_impressions", "impressions") : null)]
  ]);

  pdf.section("Paid Ads");
  if (report.paid_ads_commentary) pdf.paragraph(report.paid_ads_commentary);
  pdf.metrics([
    ["Spend", formatCurrency(paid ? readNumber(paid, "spend", "total_spend") : null)],
    ["Revenue", formatCurrency(paid ? readNumber(paid, "revenue", "conversion_value", "total_revenue") : null)],
    ["Estimated total revenue", formatCurrency(paid ? readNumber(paid, "estimated_total_revenue", "estimatedTotalRevenue") : null)],
    ["CPA", formatCurrency(paid ? readNumber(paid, "cpa") : null)],
    ["Store visits", formatCount(paid ? readNumber(paid, "store_visits", "storeVisits") : null)],
    ["Est. in-store orders", formatCount(paid ? readNumber(paid, "estimated_in_store_purchases", "estimatedInStorePurchases") : null)]
  ]);
  pdf.ranked("Top campaigns", reportRows(readArray(report.paid_ads_summary, "top_campaigns"), "campaign"));
  pdf.ranked("Top ads by ROAS", reportRows(readArray(report.paid_ads_summary, "top_ads_by_roas"), "ad"));

  pdf.section("SEO");
  if (report.seo_commentary) pdf.paragraph(report.seo_commentary);
  pdf.metrics([
    ["Organic clicks", formatCount(seo ? readNumber(seo, "organic_clicks", "clicks") : null)],
    ["Organic impressions", formatCount(seo ? readNumber(seo, "organic_impressions", "impressions") : null)],
    ["Organic CTR", formatRatio(seo ? readNumber(seo, "organic_ctr", "ctr") : null)],
    ["Average position", formatDecimal(seo ? readNumber(seo, "average_position", "position") : null)]
  ]);
  pdf.ranked("Top landing pages", reportRows(readArray(report.seo_summary, "top_pages"), "page"));
  pdf.ranked("Top queries", reportRows(readArray(report.seo_summary, "top_queries"), "query"));

  if (report.mom_commentary) {
    pdf.section("Month-over-Month");
    pdf.paragraph(report.mom_commentary);
  }

  pdf.section("Wins");
  pdf.bullets(report.wins.length > 0 ? report.wins : fallbackWins(report, paid, seo));

  pdf.section("Watchouts");
  pdf.bullets(report.watchouts.length > 0 ? report.watchouts : fallbackWatchouts(report, paid));

  pdf.section("Recommended Next Steps");
  pdf.bullets(report.next_steps.length > 0 ? report.next_steps : fallbackNextSteps(report, paid, seo));

  return pdf.render();
}

export function reportPdfFilename(report: MonthlyReport) {
  return `${slug(report.client_name ?? "client")}-${formatMonth(report.report_month).toLowerCase().replace(/\s+/g, "-")}-performance-report.pdf`;
}

class PdfBuilder {
  private pages: string[] = [];
  private commands: string[] = [];
  private y = PAGE_HEIGHT - MARGIN;
  private pageNumber = 0;

  constructor() {
    this.newPage();
  }

  title(clientName: string, text: string) {
    this.ensure(64);
    this.text("CLICK CRAFTERS", { size: 9, bold: true, color: ORANGE, leading: 14 });
    this.text(text, { size: 24, bold: true, color: OFF_WHITE, leading: 28 });
    this.text(clientName, { size: 13, bold: true, color: MUTED, leading: 18 });
    this.gap(4);
  }

  section(text: string) {
    this.gap(12);
    this.ensure(30);
    this.text(text, { size: 15, bold: true, color: ORANGE, leading: 20 });
  }

  paragraph(text: string) {
    this.wrap(text, PAGE_WIDTH - MARGIN * 2, { size: 10, color: OFF_WHITE, leading: 15 });
    this.gap(3);
  }

  bullets(items: string[]) {
    if (items.length === 0) {
      this.text("No callouts recorded for this report.", { size: 10, color: MUTED });
      return;
    }

    for (const item of items) {
      this.ensure(34);
      this.text("-", { x: MARGIN, size: 11, bold: true, color: ORANGE });
      this.wrap(item, PAGE_WIDTH - MARGIN * 2 - 18, { x: MARGIN + 18, size: 10, color: OFF_WHITE, leading: 15 });
      this.gap(2);
    }
  }

  metrics(metrics: Array<[string, string]>) {
    const rows = metrics.filter(([, value]) => value !== "Not available");
    if (rows.length === 0) return;

    const gap = 10;
    const columns = 3;
    const colWidth = (PAGE_WIDTH - MARGIN * 2 - gap * (columns - 1)) / columns;
    for (let index = 0; index < rows.length; index += columns) {
      this.ensure(44);
      for (let column = 0; column < columns; column += 1) {
        const row = rows[index + column];
        if (row) this.metricCell(MARGIN + column * (colWidth + gap), this.y, colWidth, row[0], row[1]);
      }
      this.y -= 42;
    }
    this.gap(4);
  }

  ranked(title: string, rows: Array<{ name: string; details: string[] }>) {
    if (rows.length === 0) return;
    this.ensure(36);
    this.text(title, { size: 11, bold: true, color: OFF_WHITE, leading: 16 });
    rows.slice(0, 5).forEach((row, index) => {
      this.ensure(30);
      this.wrap(`${index + 1}. ${row.name}${row.details.length ? ` - ${row.details.join(" | ")}` : ""}`, PAGE_WIDTH - MARGIN * 2, { size: 9.5, color: MUTED, leading: 14 });
    });
    this.gap(3);
  }

  text(text: string, options: TextOptions = {}) {
    const size = options.size ?? 10;
    const x = options.x ?? MARGIN;
    const y = options.y ?? this.y;
    const color = options.color ?? OFF_WHITE;
    const font = options.bold ? "F2" : "F1";
    this.commands.push(`BT /${font} ${size} Tf ${color.join(" ")} rg ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
    if (options.y === undefined) this.y -= options.leading ?? LINE_HEIGHT;
  }

  wrap(text: string, width: number, options: TextOptions = {}) {
    const size = options.size ?? 10;
    const words = sanitizeText(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (estimateWidth(next, size) <= width) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);

    for (const line of lines.length ? lines : [""]) {
      this.ensure(options.leading ?? LINE_HEIGHT);
      this.text(line, options);
    }
  }

  gap(amount: number) {
    this.y -= amount;
  }

  render() {
    this.finishPage();
    return buildPdf(this.pages);
  }

  private metricCell(x: number, y: number, width: number, label: string, value: string) {
    this.commands.push(`q ${PANEL.join(" ")} rg ${x} ${y - 34} ${width} 38 re f Q`);
    this.commands.push(`q ${BORDER.join(" ")} RG ${x} ${y - 34} ${width} 38 re S Q`);
    this.text(label, { x: x + 10, y: y - 13, size: 8.5, color: MUTED });
    this.text(value, { x: x + 10, y: y - 28, size: 12.5, bold: true, color: OFF_WHITE });
  }

  private ensure(space: number) {
    if (this.y - space < MARGIN + 30) this.newPage();
  }

  private newPage() {
    if (this.commands.length > 0) this.finishPage();
    this.pageNumber += 1;
    this.commands = [];
    this.y = PAGE_HEIGHT - MARGIN;
    this.drawPageBase();
  }

  private finishPage() {
    this.text(`Click Crafters - clickcrafters.click - Page ${this.pageNumber}`, { x: MARGIN, y: 28, size: 8, color: MUTED });
    this.pages.push(this.commands.join("\n"));
    this.commands = [];
  }

  private drawPageBase() {
    this.commands.push(`q ${DARK.join(" ")} rg 0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re f Q`);
    this.commands.push(`q ${ORANGE.join(" ")} rg 0 ${PAGE_HEIGHT - 6} ${PAGE_WIDTH} 6 re f Q`);
    this.commands.push("q 0.04 0.035 0.03 rg 0 0 612 96 re f Q");
    this.commands.push("BT /F2 18 Tf 0.08 0.06 0.045 rg 1 0 0 1 44 54 Tm (CLICK CRAFTERS - clickcrafters.click) Tj ET");
  }
}

type TextOptions = {
  x?: number;
  y?: number;
  size?: number;
  bold?: boolean;
  color?: readonly [number, number, number];
  leading?: number;
};

function buildPdf(pageStreams: string[]) {
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
  ];
  const contentStart = objects.length + 1;
  const pageStart = contentStart + pageStreams.length;

  pageStreams.forEach((stream) => {
    objects.push(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
  });

  pageStreams.forEach((_, index) => {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentStart + index} 0 R >>`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageStreams.map((_, index) => `${pageStart + index} 0 R`).join(" ")}] /Count ${pageStreams.length} >>`;

  let output = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(output, "latin1"));
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(output, "latin1");
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(output, "latin1");
}

function fallbackExecutiveSummary(report: MonthlyReport, paid: Record<string, unknown> | null, seo: Record<string, unknown> | null) {
  const parts = [`${formatMonth(report.report_month)} performance report for ${report.client_name ?? "this client"}.`];
  const spend = paid ? readNumber(paid, "spend", "total_spend") : null;
  const revenue = paid ? readNumber(paid, "revenue", "conversion_value", "total_revenue") : null;
  const estimatedRevenue = paid ? readNumber(paid, "estimated_total_revenue", "estimatedTotalRevenue") : null;
  const blendedRoas = paid ? readNumber(paid, "estimated_blended_roas", "estimatedBlendedRoas") : null;
  const organicClicks = seo ? readNumber(seo, "organic_clicks", "clicks") : null;

  if (spend !== null && revenue !== null) parts.push(`Paid ads generated ${formatCurrency(revenue)} in reported revenue on ${formatCurrency(spend)} spend.`);
  if (estimatedRevenue !== null && blendedRoas !== null) parts.push(`Estimated total revenue was ${formatCurrency(estimatedRevenue)} with ${formatMultiplier(blendedRoas)} estimated blended ROAS.`);
  if (organicClicks !== null) parts.push(`Organic search delivered ${formatCount(organicClicks)} clicks.`);
  return parts.join(" ");
}

function hasMeaningfulCopy(value: string | null) {
  if (!value?.trim()) return false;
  const normalized = value.trim().toLowerCase();
  return ![
    "monthly report draft generated from compact source metrics.",
    "monthly performance report draft generated from available portal data."
  ].includes(normalized);
}

function fallbackWins(report: MonthlyReport, paid: Record<string, unknown> | null, seo: Record<string, unknown> | null) {
  const rows: string[] = [];
  const estimatedRevenue = paid ? readNumber(paid, "estimated_total_revenue", "estimatedTotalRevenue") : null;
  const blendedRoas = paid ? readNumber(paid, "estimated_blended_roas", "estimatedBlendedRoas") : null;
  const revenue = paid ? readNumber(paid, "revenue", "conversion_value", "total_revenue") : null;
  const spend = paid ? readNumber(paid, "spend", "total_spend") : null;
  const organicClicks = seo ? readNumber(seo, "organic_clicks", "clicks") : null;

  if (estimatedRevenue !== null && blendedRoas !== null) rows.push(`Estimated total revenue reached ${formatCurrency(estimatedRevenue)} with ${formatMultiplier(blendedRoas)} estimated blended ROAS.`);
  if (revenue !== null && spend !== null) rows.push(`Paid ads produced ${formatCurrency(revenue)} in reported revenue on ${formatCurrency(spend)} spend.`);
  if (organicClicks !== null) rows.push(`Organic search delivered ${formatCount(organicClicks)} clicks.`);
  return rows.length ? rows : ["Current-month performance data is available for client review."];
}

function fallbackWatchouts(_report: MonthlyReport, paid: Record<string, unknown> | null) {
  const roas = paid ? readNumber(paid, "roas") : null;
  const blendedRoas = paid ? readNumber(paid, "estimated_blended_roas", "estimatedBlendedRoas") : null;
  const rows = ["Review any estimates with the client before treating them as final revenue."];
  if (roas !== null && blendedRoas !== null && blendedRoas > roas) rows.push("Platform ROAS may understate impact because in-store purchases are not captured as online revenue.");
  return rows;
}

function fallbackNextSteps(_report: MonthlyReport, paid: Record<string, unknown> | null, seo: Record<string, unknown> | null) {
  return [
    paid ? "Review top paid campaigns and budget allocation for next month." : null,
    seo ? "Use top SEO pages and queries to prioritize content and conversion improvements." : null,
    "Validate tracking assumptions before publishing the next monthly report."
  ].filter((item): item is string => Boolean(item));
}

function reportRows(rows: Record<string, unknown>[], kind: "campaign" | "ad" | "page" | "query") {
  return rows.map((row) => {
    const name = entityName(row, kind);
    const details = kind === "page" || kind === "query"
      ? compactDetailValues([
        ["Clicks", formatCount(readNumber(row, "clicks", "organic_clicks"))],
        ["Impressions", formatCount(readNumber(row, "impressions", "organic_impressions"))],
        ["CTR", formatRatio(readNumber(row, "ctr", "organic_ctr"))]
      ])
      : compactDetailValues([
        ["Spend", formatCurrency(readNumber(row, "spend", "total_spend"))],
        ["Revenue", formatCurrency(readNumber(row, "revenue", "conversion_value", "total_revenue"))],
        ["Conversions", formatCount(readNumber(row, "conversions"))],
        ["ROAS", formatMultiplier(readNumber(row, "roas"))]
      ]);
    return { name, details };
  }).filter((row) => row.name);
}

function compactDetailValues(rows: Array<[string, string]>) {
  return rows.filter(([, value]) => value !== "Not available").slice(0, 4).map(([label, value]) => `${label}: ${value}`);
}

function entityName(row: Record<string, unknown>, kind: "campaign" | "ad" | "page" | "query") {
  if (kind === "campaign") return stringValue(row, "campaign_name") ?? stringValue(row, "campaign_id") ?? "Unnamed campaign";
  if (kind === "ad") return stringValue(row, "ad_name") ?? stringValue(row, "headline") ?? stringValue(row, "ad_id") ?? "Unnamed ad";
  if (kind === "page") return cleanPageLabel(stringValue(row, "page") ?? stringValue(row, "url") ?? "Unknown page");
  return stringValue(row, "query") ?? "Unknown query";
}

function readArray(source: Record<string, unknown> | null, key: string) {
  if (!source) return [];
  const value = source[key];
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function readObject(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readNumber(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    const number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : null;
    if (number !== null && Number.isFinite(number)) return number;
  }
  return null;
}

function stringValue(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanPageLabel(value: string) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname === "/" ? "/" : url.pathname}`;
  } catch {
    return value;
  }
}

function formatCurrency(value: number | null) {
  return value === null ? "Not available" : currency.format(value);
}

function formatCount(value: number | null) {
  return value === null ? "Not available" : compact.format(value);
}

function formatMultiplier(value: number | null) {
  return value === null ? "Not available" : `${value.toFixed(2)}x`;
}

function formatDecimal(value: number | null) {
  return value === null ? "Not available" : value.toFixed(1);
}

function formatRatio(value: number | null) {
  if (value === null) return "Not available";
  const normalized = value > 1 ? value : value * 100;
  return `${normalized.toFixed(2)}%`;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function periodLabel(report: MonthlyReport) {
  return `${formatDate(`${report.period_start}T00:00:00Z`)} - ${formatDate(`${report.period_end}T00:00:00Z`)}`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";
}

function estimateWidth(text: string, size: number) {
  return text.length * size * 0.5;
}

function escapePdfText(value: string) {
  return sanitizeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function sanitizeText(value: string) {
  return value
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[•·]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[×]/g, "x")
    .replace(/[^\x20-\x7E\n\r\t]/g, "");
}
