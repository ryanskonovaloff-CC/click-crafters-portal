"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

const clientRoles: Role[] = ["client_admin", "client_viewer"];
const allowedRoles: Role[] = ["admin", ...clientRoles];

export async function saveUserAccess(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "client_viewer") as Role;
  const clientId = String(formData.get("clientId") ?? "").trim();

  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  if (!allowedRoles.includes(role)) {
    throw new Error("Select a valid access level.");
  }

  if (clientRoles.includes(role) && !clientId) {
    throw new Error("Select a client for client access.");
  }

  const { profile } = await getSessionProfile();

  if (profile.role !== "admin") {
    throw new Error("You do not have permission to manage users.");
  }

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://portal.clickcrafters.click";
  const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/callback`;

  let userId: string | null = null;
  const { data: existingProfile, error: profileLookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profileLookupError) {
    throw new Error(profileLookupError.message);
  }

  userId = existingProfile?.id ?? null;

  if (!userId) {
    const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: fullName ? { full_name: fullName } : undefined,
      redirectTo
    });

    if (inviteError) {
      throw new Error(inviteError.message);
    }

    userId = invite.user?.id ?? null;
  }

  if (!userId) {
    throw new Error("Unable to create or find this user.");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({
      id: userId,
      email,
      full_name: fullName || null,
      role,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (clientId) {
    const { error: assignmentError } = await admin
      .from("client_users")
      .upsert({
        client_id: clientId,
        user_id: userId
      }, { onConflict: "client_id,user_id" });

    if (assignmentError) {
      throw new Error(assignmentError.message);
    }
  }

  revalidatePath("/admin/users");
}
