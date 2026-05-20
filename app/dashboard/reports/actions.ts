"use server";

import { revalidatePath } from "next/cache";
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
  const { error } = await supabase
    .from("monthly_reports")
    .update({
      status: "published",
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
