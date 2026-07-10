import type { Client } from "@/lib/types";

export type ReportingProfile = "restaurant" | "nonprofit";

export type ClientReportingConfig = {
  profile: ReportingProfile;
  industryLabel: string | null;
  showGoogleBusinessProfile: boolean;
  showStoreVisitMetrics: boolean;
  showOfflineRevenueEstimates: boolean;
  primaryConversionLabel: string;
  primaryConversionRevenueLabel: string;
  primaryConversionRoasLabel: string;
  primaryConversionCpaLabel: string;
  secondaryConversionLabel?: string;
};

const defaultConfig: ClientReportingConfig = {
  profile: "restaurant",
  industryLabel: null,
  showGoogleBusinessProfile: true,
  showStoreVisitMetrics: true,
  showOfflineRevenueEstimates: true,
  primaryConversionLabel: "Online orders",
  primaryConversionRevenueLabel: "Online order revenue",
  primaryConversionRoasLabel: "ROAS",
  primaryConversionCpaLabel: "CPA"
};

const rerootConfig: Partial<ClientReportingConfig> = {
  profile: "nonprofit",
  industryLabel: "Environmental nonprofit",
  showGoogleBusinessProfile: false,
  showStoreVisitMetrics: false,
  showOfflineRevenueEstimates: false,
  primaryConversionLabel: "Donations",
  primaryConversionRevenueLabel: "Donation revenue",
  primaryConversionRoasLabel: "Donation ROAS",
  primaryConversionCpaLabel: "Cost per donation",
  secondaryConversionLabel: "Fundraiser leads"
};

const configsByClientKey: Record<string, Partial<ClientReportingConfig>> = {
  "22aec740-3ab4-49f9-9d39-516ff4e25071": rerootConfig,
  "re-root-collaborative": rerootConfig,
  "reroot-collaborative": rerootConfig
};

export function getClientReportingConfig(client?: Client | null): ClientReportingConfig {
  const override = [
    client?.id,
    client?.slug,
    normalizeClientKey(client?.name)
  ].map((key) => key ? configsByClientKey[key] : null).find(Boolean);

  return {
    ...defaultConfig,
    ...override,
    industryLabel: override?.industryLabel ?? client?.industry ?? defaultConfig.industryLabel
  };
}

export function isNonprofitReporting(config: ClientReportingConfig) {
  return config.profile === "nonprofit";
}

function normalizeClientKey(value?: string | null) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ?? null;
}
