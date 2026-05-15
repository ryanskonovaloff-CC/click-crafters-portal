export type Role = "admin" | "client_admin" | "client_viewer";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
};

export type Client = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  status: string;
  last_updated_at: string;
};

export type DailyPerformance = {
  date: string;
  platform: "Google Ads" | "Meta Ads";
  spend: number;
  revenue: number;
  conversions: number;
  clicks: number;
  impressions: number;
};

export type CampaignPerformance = {
  campaign_name: string;
  platform: "Google Ads" | "Meta Ads";
  spend: number;
  revenue: number;
  conversions: number;
  clicks: number;
  impressions: number;
  wasted_spend: number;
};

export type AdPerformance = CampaignPerformance & {
  ad_name: string;
  preview_url: string | null;
};

export type SeoPerformance = {
  organic_clicks: number;
  organic_impressions: number;
  average_position: number;
  organic_sessions: number;
  organic_conversions: number;
  top_queries: Array<{ query: string; clicks: number; impressions: number; position: number }>;
  top_landing_pages: Array<{ page: string; clicks: number; sessions: number; conversions: number }>;
};

export type Report = {
  id: string;
  month: string;
  summary: string;
  wins: string[];
  issues: string[];
  actions_taken: string[];
  next_steps: string[];
};
