import type { DailyPerformance } from "@/lib/types";

export const IN_STORE_AOV = 24.87;

type StoreVisitEstimate = {
  storeVisits: number;
  onlineOrders: number;
  estimatedInStorePurchases: number;
};

export function storeVisitEstimateForRows(rows: DailyPerformance[]): StoreVisitEstimate | null {
  const byPlatform = new Map<string, { storeVisits: number; onlineOrders: number; hasStoreVisits: boolean }>();

  for (const row of rows) {
    const current = byPlatform.get(row.platform) ?? { storeVisits: 0, onlineOrders: 0, hasStoreVisits: false };
    current.onlineOrders += row.conversions;
    if (row.store_visits !== null) {
      current.storeVisits += row.store_visits;
      current.hasStoreVisits = true;
    }
    byPlatform.set(row.platform, current);
  }

  const attributedPlatforms = [...byPlatform.values()].filter((item) => item.hasStoreVisits);
  if (attributedPlatforms.length === 0) return null;

  return attributedPlatforms.reduce<StoreVisitEstimate>((total, item) => ({
    storeVisits: total.storeVisits + item.storeVisits,
    onlineOrders: total.onlineOrders + item.onlineOrders,
    estimatedInStorePurchases: total.estimatedInStorePurchases + Math.max(item.storeVisits - item.onlineOrders, 0)
  }), { storeVisits: 0, onlineOrders: 0, estimatedInStorePurchases: 0 });
}

export function estimatedInStorePurchasesForRows(rows: DailyPerformance[]) {
  return storeVisitEstimateForRows(rows)?.estimatedInStorePurchases ?? null;
}
