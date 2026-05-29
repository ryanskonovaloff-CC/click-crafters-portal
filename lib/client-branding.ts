export function clientLogoSrc(clientName: string | null | undefined) {
  const normalized = clientName?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (normalized === "press-burger") return "/assets/press-burger-logo-white.png";
  return null;
}
