import { AccentText, Badge, Card, ClientPageTitle } from "@/components/ui";
import { getActiveClient } from "@/lib/data";
import { clientLogoSrc } from "@/lib/client-branding";

export default async function SettingsPage() {
  const { profile, client } = await getActiveClient();
  const logoSrc = clientLogoSrc(client?.name);
  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <header>
        <Badge>Account</Badge>
        <ClientPageTitle logoSrc={logoSrc} logoAlt={client?.name ?? undefined}><AccentText>Settings</AccentText></ClientPageTitle>
      </header>
      <Card>
        <dl className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="min-w-0"><dt className="text-xs text-white/50 sm:text-sm">Name</dt><dd className="mt-1 break-words text-sm text-white/80 sm:text-base">{profile.full_name ?? "Not set"}</dd></div>
          <div className="min-w-0"><dt className="text-xs text-white/50 sm:text-sm">Email</dt><dd className="mt-1 break-words text-sm text-white/80 sm:text-base">{profile.email}</dd></div>
          <div className="min-w-0"><dt className="text-xs text-white/50 sm:text-sm">Role</dt><dd className="mt-1 break-words text-sm capitalize text-white/80 sm:text-base">{profile.role.replace("_", " ")}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
