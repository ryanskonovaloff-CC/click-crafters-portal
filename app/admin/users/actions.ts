"use server";

import { revalidatePath } from "next/cache";
import { getActiveClient, getSessionProfile } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

const clientRoles: Role[] = ["client_admin", "client_viewer"];
const allowedRoles: Role[] = ["admin", ...clientRoles];

async function requireAdmin() {
  const { profile } = await getSessionProfile();

  if (profile.role !== "admin") {
    throw new Error("You do not have permission to manage users.");
  }

  return profile;
}

async function requireUserManager() {
  const { profile, client } = await getActiveClient();

  if (profile.role !== "admin" && profile.role !== "client_admin") {
    throw new Error("You do not have permission to manage users.");
  }

  if (profile.role === "client_admin" && !client) {
    throw new Error("No client is assigned to this account.");
  }

  return { profile, client };
}

function scopedRoleAndClient(currentRole: Role, requestedRole: Role, requestedClientId: string, assignedClientId?: string) {
  if (currentRole === "admin") {
    return { role: requestedRole, clientId: requestedClientId };
  }

  if (requestedRole === "admin") {
    throw new Error("Client admins cannot create Click Crafters admin users.");
  }

  return { role: (requestedRole === "client_admin" ? "client_admin" : "client_viewer") as Role, clientId: assignedClientId ?? requestedClientId };
}

async function findAuthUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw new Error(error.message);
  }

  return data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
}

async function setClientAccess(admin: ReturnType<typeof createAdminClient>, userId: string, role: Role, clientId: string) {
  const { error: deleteError } = await admin
    .from("client_users")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (role === "admin") return;

  const { error: assignmentError } = await admin
    .from("client_users")
    .insert({
      client_id: clientId,
      user_id: userId
    });

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }
}

async function assertManagedClientUser(admin: ReturnType<typeof createAdminClient>, managerRole: Role, userId: string, clientId?: string) {
  if (managerRole === "admin") return;

  const { data: assignment, error } = await admin
    .from("client_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("client_id", clientId ?? "")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!assignment) {
    throw new Error("You can only manage users assigned to your business.");
  }
}

export async function saveUserAccess(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "client_viewer") as Role;
  const clientId = String(formData.get("clientId") ?? "").trim();

  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const { profile, client } = await requireUserManager();
  const scoped = scopedRoleAndClient(profile.role, role, clientId, client?.id);

  if (!allowedRoles.includes(scoped.role)) {
    throw new Error("Select a valid access level.");
  }

  if (clientRoles.includes(scoped.role) && !scoped.clientId) {
    throw new Error("Select a client for client access.");
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
  userId = userId ?? (await findAuthUserByEmail(admin, email))?.id ?? null;

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
      role: scoped.role,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });

  if (profileError) {
    throw new Error(profileError.message);
  }

  await setClientAccess(admin, userId, scoped.role, scoped.clientId);

  revalidatePath("/admin/users");
}

export async function updateUserAccess(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "client_viewer") as Role;
  const clientId = String(formData.get("clientId") ?? "").trim();

  if (!userId) {
    throw new Error("Missing user ID.");
  }

  const { profile: currentProfile, client } = await requireUserManager();
  const scoped = scopedRoleAndClient(currentProfile.role, role, clientId, client?.id);

  if (!allowedRoles.includes(scoped.role)) {
    throw new Error("Select a valid access level.");
  }

  if (clientRoles.includes(scoped.role) && !scoped.clientId) {
    throw new Error("Select a client for client access.");
  }

  if (currentProfile.id === userId && currentProfile.role === "admin" && scoped.role !== "admin") {
    throw new Error("You cannot remove your own admin access.");
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await assertManagedClientUser(admin, currentProfile.role, userId, client?.id);

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: scoped.role,
      updated_at: now
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  await setClientAccess(admin, userId, scoped.role, scoped.clientId);

  revalidatePath("/admin/users");
}

export async function removeUserAccess(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    throw new Error("Missing user ID.");
  }

  const { profile: currentProfile, client } = await requireUserManager();

  if (currentProfile.id === userId) {
    throw new Error("You cannot remove your own account.");
  }

  const admin = createAdminClient();
  await assertManagedClientUser(admin, currentProfile.role, userId, client?.id);
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/admin/users");
}
