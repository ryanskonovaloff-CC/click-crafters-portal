import { Badge, Card, Table } from "@/components/ui";
import { getAdminData } from "@/lib/data";

export default async function AdminUsersPage() {
  const { profiles } = await getAdminData();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <Badge>Admin</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Users</h1>
      </header>
      <Card>
        <Table headers={["Name", "Email", "Role", "Created"]} rows={profiles.map((profile: any) => [
          profile.full_name ?? "Not set",
          profile.email,
          profile.role.replace("_", " "),
          new Date(profile.created_at).toLocaleDateString()
        ])} />
      </Card>
    </div>
  );
}
