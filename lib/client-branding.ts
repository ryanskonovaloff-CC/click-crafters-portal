import type { Client } from "@/lib/types";

type ClientBrandInput = Pick<Client, "id" | "name" | "slug"> | string | null | undefined;

export function clientLogoSrc(client: ClientBrandInput) {
  const keys = typeof client === "string"
    ? [client]
    : [client?.id, client?.slug, client?.name];

  if (keys.some((key) => normalizeBrandKey(key) === "press-burger")) return "/assets/press-burger-logo-white.png";
  if (keys.some((key) => key === "22aec740-3ab4-49f9-9d39-516ff4e25071" || normalizeBrandKey(key) === "re-root-collaborative" || normalizeBrandKey(key) === "reroot-collaborative")) {
    return "/assets/reroot-collaborative-logo-white.png";
  }

  return null;
}

function normalizeBrandKey(value?: string | null) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ?? null;
}
