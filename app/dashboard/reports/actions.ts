"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/data";

const REPORT_COPY_EDITOR_EMAIL = "ryanskonovaloff@gmail.com";

export async function publishMonthlyReport(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    throw new Error("Missing report ID.");
  }

  const { supabase, profile } = await getSessionProfile();

  if (profile.role !== "admin") {
    throw new Error("You do not have permission to publish reports.");
  }

  const now = new Date().toISOString();
  const { data: report, error: lookupError } = await supabase
    .from("monthly_reports")
    .select("report_month")
    .eq("id", reportId)
    .single();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const { error } = await supabase
    .from("monthly_reports")
    .update({
      status: "published",
      title: `${formatReportMonth(String(report.report_month))} Performance Report`,
      published_at: now,
      updated_at: now
    })
    .eq("id", reportId)
    .eq("status", "draft");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/reports");
  revalidatePath(`/dashboard/reports/${reportId}`);
}

export async function unpublishMonthlyReport(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    throw new Error("Missing report ID.");
  }

  const { supabase, profile } = await getSessionProfile();

  if (profile.role !== "admin") {
    throw new Error("You do not have permission to unpublish reports.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("monthly_reports")
    .update({
      status: "draft",
      published_at: null,
      updated_at: now
    })
    .eq("id", reportId)
    .eq("status", "published");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/reports");
  revalidatePath(`/dashboard/reports/${reportId}`);
}

export async function updateMonthlyReportCopy(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    throw new Error("Missing report ID.");
  }

  const { supabase, profile } = await getSessionProfile();

  if (profile.role !== "admin" || profile.email.toLowerCase() !== REPORT_COPY_EDITOR_EMAIL) {
    throw new Error("You do not have permission to edit report copy.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("monthly_reports")
    .update({
      executive_summary: textValue(formData, "executive_summary"),
      paid_ads_commentary: textValue(formData, "paid_ads_commentary"),
      seo_commentary: textValue(formData, "seo_commentary"),
      mom_commentary: textValue(formData, "mom_commentary"),
      wins: listValue(formData, "wins"),
      watchouts: listValue(formData, "watchouts"),
      next_steps: listValue(formData, "next_steps"),
      updated_at: now
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/reports");
  revalidatePath(`/dashboard/reports/${reportId}`);
  redirect(`/dashboard/reports/${reportId}`);
}

function formatReportMonth(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function listValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}
