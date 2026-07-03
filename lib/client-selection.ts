export const SELECTED_CLIENT_COOKIE = "selected_client_slug";

export function normalizeClientSlug(value?: string | null) {
  const slug = String(value ?? "").trim().toLowerCase();

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }

  return slug;
}
