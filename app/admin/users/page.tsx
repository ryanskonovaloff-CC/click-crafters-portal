import { Badge, Card, Table } from "@/components/ui";
import { getAdminData } from "@/lib/data";
import { removeUserAccess, saveUserAccess, updateUserAccess } from "./actions";

export default async function AdminUsersPage() {
  const { profiles, clients, clientUsers, authUsers, profile: currentProfile } = await getAdminData();
  const authById = authUsers.reduce<Record<string, any>>((acc: Record<string, any>, user: any) => {
    acc[user.id] = user;
    return acc;
  }, {});
  const assignmentsByUser = clientUsers.reduce<Record<string, Array<{ id: string; name: string }>>>((acc: Record<string, Array<{ id: string; name: string }>>, assignment: any) => {
    const name = assignment.clients?.name ?? assignment.client_id;
    acc[assignment.user_id] = [...(acc[assignment.user_id] ?? []), { id: assignment.client_id, name }];
    return acc;
  }, {});

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

      <Card>
        <Table headers={["Name", "Email", "Status", "Last login", "Access", "Actions"]} rows={profiles.map((profile: any) => {
          const authUser = authById[profile.id];
          const assignments = assignmentsByUser[profile.id] ?? [];
          const selectedClientId = assignments[0]?.id ?? "";
          const isSelf = currentProfile.id === profile.id;

          return [
            profile.full_name ?? "Not set",
            profile.email,
            accessStatus(authUser),
            lastLogin(authUser),
            profile.role === "admin" ? "All clients" : assignments.map((assignment) => assignment.name).join(", ") || "Not assigned",
            <div key={profile.id} className="flex min-w-[26rem] flex-col gap-2">
              <form action={updateUserAccess} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="userId" value={profile.id} />
                <select name="clientId" defaultValue={selectedClientId} className="h-10 rounded-lg border border-border bg-black/25 px-2 text-xs text-white outline-none transition focus:border-accent/70">
                  <option value="">Select client</option>
                  {clients.map((client: any) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
                <select name="role" defaultValue={profile.role} className="h-10 rounded-lg border border-border bg-black/25 px-2 text-xs text-white outline-none transition focus:border-accent/70">
                  <option value="client_viewer">Client viewer</option>
                  <option value="client_admin">Client admin</option>
                  <option value="admin">Portal admin</option>
                </select>
                <button type="submit" className="h-10 rounded-lg border border-border bg-panelStrong px-3 text-xs text-white/80 transition hover:border-accent/60 hover:text-white">
                  Save
                </button>
              </form>
              <form action={removeUserAccess}>
                <input type="hidden" name="userId" value={profile.id} />
                <button type="submit" disabled={isSelf} className="h-9 rounded-lg border border-red-400/30 bg-red-500/10 px-3 text-xs text-red-100/80 transition hover:border-red-300/60 disabled:cursor-not-allowed disabled:opacity-40">
                  Remove user
                </button>
              </form>
            </div>
          ];
        })} />
      </Card>
    </div>
  );
}

function accessStatus(authUser: any) {
  if (!authUser) return "Profile only";
  if (authUser.last_sign_in_at) return "Active";
  if (authUser.invited_at || !authUser.email_confirmed_at) return "Pending";
  return "Not logged in";
}

function lastLogin(authUser: any) {
  if (!authUser?.last_sign_in_at) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(authUser.last_sign_in_at));
}
