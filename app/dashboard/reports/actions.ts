"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/data";

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

export async function deleteMonthlyReport(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    throw new Error("Missing report ID.");
  }

  const { supabase, profile } = await getSessionProfile();

  if (profile.role !== "admin") {
    throw new Error("You do not have permission to delete reports.");
  }

  const { error } = await supabase
    .from("monthly_reports")
    .delete()
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/reports");
  revalidatePath(`/dashboard/reports/${reportId}`);
  redirect("/dashboard/reports");
}

function formatReportMonth(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
