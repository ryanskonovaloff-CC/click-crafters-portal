import { Badge, Card, Table } from "@/components/ui";
import { getAdminData } from "@/lib/data";
import { saveUserAccess } from "./actions";

export default async function AdminUsersPage() {
  const { profiles, clients, clientUsers } = await getAdminData();
  const assignmentsByUser = clientUsers.reduce<Record<string, string[]>>((acc: Record<string, string[]>, assignment: any) => {
    const name = assignment.clients?.name ?? assignment.client_id;
    acc[assignment.user_id] = [...(acc[assignment.user_id] ?? []), name];
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
            <select name="clientId" required className="h-11 w-full rounded-lg border border-border bg-black/25 px-3 text-sm text-white outline-none transition focus:border-accent/70">
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
        <Table headers={["Name", "Email", "Role", "Client access", "Created"]} rows={profiles.map((profile: any) => [
          profile.full_name ?? "Not set",
          profile.email,
          profile.role.replace("_", " "),
          assignmentsByUser[profile.id]?.join(", ") ?? (profile.role === "admin" ? "All clients" : "Not assigned"),
          new Date(profile.created_at).toLocaleDateString()
        ])} />
      </Card>
    </div>
  );
}
