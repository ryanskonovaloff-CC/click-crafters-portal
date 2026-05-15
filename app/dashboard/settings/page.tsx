import { Badge, Card } from "@/components/ui";
import { getSessionProfile } from "@/lib/data";

export default async function SettingsPage() {
  const { profile } = await getSessionProfile();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <Badge>Account</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Settings</h1>
      </header>
      <Card>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-white/50">Name</dt><dd className="mt-1 text-white/80">{profile.full_name ?? "Not set"}</dd></div>
          <div><dt className="text-sm text-white/50">Email</dt><dd className="mt-1 text-white/80">{profile.email}</dd></div>
          <div><dt className="text-sm text-white/50">Role</dt><dd className="mt-1 capitalize text-white/80">{profile.role.replace("_", " ")}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
