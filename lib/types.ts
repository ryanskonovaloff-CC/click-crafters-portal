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
  platform: string;
  channel: string | null;
  spend: number;
  revenue: number;
  conversions: number;
  clicks: number;
  impressions: number;
  cpa: number | null;
  roas: number | null;
  ctr: number | null;
  cpc: number | null;
};

export type CampaignDailyPerformance = DailyPerformance & {
  campaign_id: string;
  campaign_name: string | null;
  wasted_spend: number;
};

export type AdDailyPerformance = DailyPerformance & {
  campaign_id: string | null;
  campaign_name: string | null;
  ad_group_id: string | null;
  ad_group_name: string | null;
  ad_id: string;
  ad_name: string | null;
  creative_id: string | null;
  creative_name: string | null;
  creative_preview_url: string | null;
};

export type AdLifetimePerformance = {
  platform: string;
  channel: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  ad_group_id: string | null;
  ad_group_name: string | null;
  ad_id: string;
  ad_name: string | null;
  creative_id: string | null;
  creative_name: string | null;
  creative_preview_url: string | null;
  spend: number;
  revenue: number;
  conversions: number;
  clicks: number;
  impressions: number;
  cpa: number | null;
  roas: number | null;
  ctr: number | null;
  cpc: number | null;
};

export type DateRangeKey = "today" | "yesterday" | "last3" | "last7" | "last14" | "mtd" | "last30" | "last_month" | "custom";

export type DateRange = {
  key: DateRangeKey;
  label: string;
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
};

export type MetricTotals = {
  spend: number;
  revenue: number;
  conversions: number;
  clicks: number;
  impressions: number;
};

export type SeoTotals = {
  organicClicks: number | null;
  organicImpressions: number | null;
  ctr: number | null;
  averagePosition: number | null;
  organicSessions: number | null;
  organicConversions: number | null;
  outboundClicks: number | null;
  indexedPages: number | null;
  technicalIssues: Array<string>;
};

export type SeoTechnicalIssue = {
  id: string;
  detected_date: string;
  issue_type: string;
  severity: string | null;
  page_url: string | null;
  issue_description: string | null;
  recommendation: string | null;
  status: string | null;
  source: string | null;
};

export type DashboardQueryStatus = {
  error: string | null;
  isEmpty: boolean;
};

export type Report = {
  id: string;
  period_start: string;
  period_end: string;
  report_month: string | null;
  headline: string | null;
  wins: string[];
  issues: string[];
  actions_taken: string[];
  next_steps: string[];
  source_metrics: Record<string, unknown>;
  generated_by: string | null;
  status: string | null;
};
