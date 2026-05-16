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
  indexedPages: number | null;
  technicalIssues: Array<string>;
};

export type DashboardQueryStatus = {
  error: string | null;
  isEmpty: boolean;
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
