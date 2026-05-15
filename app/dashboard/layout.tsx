import type { ReactNode } from "react";
import { getSessionProfile } from "@/lib/data";
import { PortalShell } from "@/components/portal-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = await getSessionProfile();
  return <PortalShell profile={profile}>{children}</PortalShell>;
}
