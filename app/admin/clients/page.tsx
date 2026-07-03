import { AccentText, Badge, Card, Table } from "@/components/ui";
import { getAdminData } from "@/lib/data";

export default async function AdminClientsPage() {
  const { clients } = await getAdminData();

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
      <header>
        <Badge>Admin</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:mt-3 sm:text-3xl"><AccentText>Clients</AccentText></h1>
      </header>
      <Card>
        <Table headers={["Client", "Slug", "Industry", "Status", "Last updated", ""]} rows={clients.map((client: any) => [
          client.name,
          client.slug,
          client.industry ?? "Not set",
          client.status,
          new Date(client.last_updated_at).toLocaleString(),
          <a
            key={client.id}
            href={`/admin/clients/select?client=${client.slug}`}
            className="inline-flex items-center justify-center rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition hover:border-accent hover:bg-accent/15"
          >
            View account
          </a>
        ])} />
      </Card>
    </div>
  );
}
