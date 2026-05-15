import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdPerformance, CampaignPerformance, Client, DailyPerformance, Profile, Report, SeoPerformance } from "@/lib/types";

export async function getSessionProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return { supabase, user, profile };
}

export async function getActiveClient() {
  const { supabase, profile } = await getSessionProfile();
  const query = supabase
    .from("clients")
    .select("id,name,slug,industry,status,last_updated_at")
    .order("name", { ascending: true })
    .limit(1);

  const { data: clients } = profile.role === "admin"
    ? await query
    : await supabase
      .from("client_users")
      .select("clients(id,name,slug,industry,status,last_updated_at)")
      .eq("user_id", profile.id)
      .limit(1);

  const rows = clients as any[] | null;
  const client = Array.isArray(rows) && rows.length > 0
    ? ("clients" in rows[0] ? rows[0].clients : rows[0])
    : null;

  if (!client) {
    return { supabase, profile, client: null as Client | null };
  }

  return { supabase, profile, client: client as Client };
}

export async function getDashboardData() {
  const { supabase, profile, client } = await getActiveClient();

  if (!client) {
    return { profile, client, daily: [], campaigns: [], ads: [], seo: null, reports: [] };
  }

  const [daily, campaigns, ads, seo, reports] = await Promise.all([
    supabase.from("daily_performance").select("*").eq("client_id", client.id).order("date"),
    supabase.from("campaign_performance").select("*").eq("client_id", client.id).order("spend", { ascending: false }),
    supabase.from("ad_performance").select("*").eq("client_id", client.id).order("roas", { ascending: false }),
    supabase.from("seo_performance").select("*").eq("client_id", client.id).order("period_start", { ascending: false }).limit(1).single(),
    supabase.from("reports").select("*").eq("client_id", client.id).order("month", { ascending: false })
  ]);

  return {
    profile,
    client,
    daily: (daily.data ?? []) as DailyPerformance[],
    campaigns: (campaigns.data ?? []) as CampaignPerformance[],
    ads: (ads.data ?? []) as AdPerformance[],
    seo: (seo.data ?? null) as SeoPerformance | null,
    reports: (reports.data ?? []) as Report[]
  };
}

export async function getAdminData() {
  const { supabase, profile } = await getSessionProfile();
  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const [clients, profiles] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("profiles").select("id,email,full_name,role,created_at").order("created_at", { ascending: false })
  ]);

  return {
    profile,
    clients: clients.data ?? [],
    profiles: profiles.data ?? []
  };
}
