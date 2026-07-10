import { ClientSwitcher } from "@/components/client-switcher";
import { AccentText, Badge, Card, ClientPageTitle } from "@/components/ui";
import { getActiveClient } from "@/lib/data";
import { clientLogoSrc } from "@/lib/client-branding";

export default async function SettingsPage() {
  const { profile, client, clients } = await getActiveClient();
  const logoSrc = clientLogoSrc(client);
  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge>Account</Badge>
          <ClientSwitcher currentClient={client} clients={clients} profile={profile} variant="badge" />
        </div>
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
