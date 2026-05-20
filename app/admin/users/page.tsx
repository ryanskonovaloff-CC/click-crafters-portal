import Link from "next/link";
import { Badge, Card, Table } from "@/components/ui";
import { getAdminData } from "@/lib/data";
import { removeUserAccess, saveUserAccess, updateUserAccess } from "./actions";
import { ConfirmRemoveButton } from "./confirm-remove-button";

type PageProps = {
  searchParams?: Promise<{ selected?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { profiles, clients, clientUsers, authUsers, profile: currentProfile } = await getAdminData();
  const selectedUserId = params?.selected ?? null;
  const authById = authUsers.reduce<Record<string, any>>((acc: Record<string, any>, user: any) => {
    acc[user.id] = user;
    return acc;
  }, {});
  const assignmentsByUser = clientUsers.reduce<Record<string, Array<{ id: string; name: string }>>>((acc: Record<string, Array<{ id: string; name: string }>>, assignment: any) => {
    const name = assignment.clients?.name ?? assignment.client_id;
    acc[assignment.user_id] = [...(acc[assignment.user_id] ?? []), { id: assignment.client_id, name }];
    return acc;
  }, {});
  const selectedProfile = profiles.find((profile: any) => profile.id === selectedUserId) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
      <header>
        <Badge>Admin</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:mt-3 sm:text-3xl">Users</h1>
      </header>

      <Card>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Add user access</h2>
          <p className="text-sm text-white/50">Invite a user, assign them to a client, and set their portal permissions.</p>
        </div>
        <form action={saveUserAccess} className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_1.1fr_1fr_1fr_auto]">
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.08em] text-white/45">Email</span>
            <input name="email" type="email" required className="h-11 w-full rounded-lg border border-border bg-black/25 px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-accent/70" placeholder="client@example.com" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.08em] text-white/45">Name</span>
            <input name="fullName" type="text" className="h-11 w-full rounded-lg border border-border bg-black/25 px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-accent/70" placeholder="Full name" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.08em] text-white/45">Client</span>
            <select name="clientId" className="h-11 w-full rounded-lg border border-border bg-black/25 px-3 text-sm text-white outline-none transition focus:border-accent/70">
              <option value="">Select client</option>
              {clients.map((client: any) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.08em] text-white/45">Permissions</span>
            <select name="role" defaultValue="client_viewer" className="h-11 w-full rounded-lg border border-border bg-black/25 px-3 text-sm text-white outline-none transition focus:border-accent/70">
              <option value="client_viewer">Client viewer</option>
              <option value="client_admin">Client admin</option>
              <option value="admin">Portal admin</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="h-11 w-full rounded-lg border border-accent/50 bg-accent/15 px-4 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent/20">
              Add access
            </button>
          </div>
        </form>
      </Card>

      {selectedProfile ? (
        <ManageUserCard
          profile={selectedProfile}
          authUser={authById[selectedProfile.id]}
          assignments={assignmentsByUser[selectedProfile.id] ?? []}
          clients={clients}
          isSelf={currentProfile.id === selectedProfile.id}
        />
      ) : null}

      <Card>
        <Table headers={["Name", "Email", "Status", "Last visited", "Access", "Action"]} rows={profiles.map((profile: any) => {
          const authUser = authById[profile.id];
          const assignments = assignmentsByUser[profile.id] ?? [];
          const isSelected = selectedUserId === profile.id;

          return [
            profile.full_name ?? "Not set",
            profile.email,
            accessStatus(authUser),
            formatDateTime(profile.last_seen_at),
            profile.role === "admin" ? "All clients" : assignments.map((assignment) => assignment.name).join(", ") || "Not assigned",
            <Link
              key={profile.id}
              href={`/admin/users?selected=${profile.id}`}
              className="inline-flex rounded-lg border border-border bg-panelStrong px-3 py-2 text-xs text-white/80 transition hover:border-accent/60 hover:text-white"
            >
              {isSelected ? "Selected" : "Manage"}
            </Link>
          ];
        })} />
      </Card>
    </div>
  );
}

function ManageUserCard({ profile, authUser, assignments, clients, isSelf }: {
  profile: any;
  authUser: any;
  assignments: Array<{ id: string; name: string }>;
  clients: any[];
  isSelf: boolean;
}) {
  const selectedClientId = assignments[0]?.id ?? "";

  return (
    <Card className="border-accent/35">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge>{accessStatus(authUser)}</Badge>
          <h2 className="mt-2 text-xl font-semibold">{profile.full_name ?? profile.email}</h2>
          <p className="mt-1 text-sm text-white/50">{profile.email}</p>
          <p className="mt-2 text-xs text-white/45">Last visited: {formatDateTime(profile.last_seen_at)} · Last login: {formatDateTime(authUser?.last_sign_in_at)}</p>
        </div>
        <Link href="/admin/users" className="text-sm text-white/50 transition hover:text-white">Clear selection</Link>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <form action={updateUserAccess} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="userId" value={profile.id} />
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.08em] text-white/45">Client</span>
            <select name="clientId" defaultValue={selectedClientId} className="h-11 w-full rounded-lg border border-border bg-black/25 px-3 text-sm text-white outline-none transition focus:border-accent/70">
              <option value="">Select client</option>
              {clients.map((client: any) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.08em] text-white/45">Permissions</span>
            <select name="role" defaultValue={profile.role} className="h-11 w-full rounded-lg border border-border bg-black/25 px-3 text-sm text-white outline-none transition focus:border-accent/70">
              <option value="client_viewer">Client viewer</option>
              <option value="client_admin">Client admin</option>
              <option value="admin">Portal admin</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="h-11 w-full rounded-lg border border-border bg-panelStrong px-4 text-sm text-white/80 transition hover:border-accent/60 hover:text-white">
              Save changes
            </button>
          </div>
        </form>
        <form action={removeUserAccess} className="flex items-end">
          <input type="hidden" name="userId" value={profile.id} />
          <ConfirmRemoveButton disabled={isSelf} userLabel={profile.full_name ?? profile.email} />
        </form>
      </div>
    </Card>
  );
}

function accessStatus(authUser: any) {
  if (!authUser) return "Profile only";
  if (authUser.last_sign_in_at) return "Active";
  if (authUser.invited_at || !authUser.email_confirmed_at) return "Pending";
  return "Not logged in";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
  return `${formatted} PT`;
}
