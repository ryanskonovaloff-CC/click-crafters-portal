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
  ad_type: string | null;
  status: string | null;
  headline: string | null;
  headline_2: string | null;
  headline_3: string | null;
  description: string | null;
  description_2: string | null;
  display_url: string | null;
  final_url: string | null;
  preview_url: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
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
  ad_type: string | null;
  status: string | null;
  headline: string | null;
  headline_2: string | null;
  headline_3: string | null;
  description: string | null;
  description_2: string | null;
  display_url: string | null;
  final_url: string | null;
  preview_url: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
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
  date_range: string | null;
  source_updated_at: string | null;
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

export type ReportStatus = "draft" | "published" | "archived";

export type MonthlyReport = {
  id: string;
  client_id: string;
  client_name: string | null;
  report_month: string;
  period_start: string;
  period_end: string;
  previous_period_start: string | null;
  previous_period_end: string | null;
  status: ReportStatus;
  title: string | null;
  executive_summary: string | null;
  paid_ads_commentary: string | null;
  seo_commentary: string | null;
  mom_commentary: string | null;
  wins: string[];
  watchouts: string[];
  next_steps: string[];
  paid_ads_summary: Record<string, unknown> | null;
  seo_summary: Record<string, unknown> | null;
  mom_summary: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
