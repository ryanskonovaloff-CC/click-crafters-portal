import { Badge, Card, Table } from "@/components/ui";
import { getAdminData } from "@/lib/data";

export default async function AdminClientsPage() {
  const { clients } = await getAdminData();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <Badge>Admin</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Clients</h1>
      </header>
      <Card>
        <Table headers={["Client", "Slug", "Industry", "Status", "Last updated"]} rows={clients.map((client: any) => [
          client.name,
          client.slug,
          client.industry ?? "Not set",
          client.status,
          new Date(client.last_updated_at).toLocaleString()
        ])} />
      </Card>
    </div>
  );
}
