import type { Campaign } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function CampaignsTable({
  campaigns,
}: {
  campaigns: Campaign[];
}) {
  if (campaigns.length === 0) {
    return (
      <Card variant="empty">
        <p className="muted">
          No campaigns yet. Go to <Link href="/find-leads">Find Leads</Link> to
          start a search.
        </p>
      </Card>
    );
  }

  return (
    <div className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Business type</th>
            <th>City</th>
            <th>Status</th>
            <th>Found</th>
            <th>Inserted</th>
            <th>Leads</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td>#{c.id}</td>
              <td>{c.business_type || "—"}</td>
              <td>{c.city || "—"}</td>
              <td>
                <StatusBadge status={c.status} />
              </td>
              <td>{c.leads_found}</td>
              <td>{c.leads_inserted}</td>
              <td>
                <Link href={`/leads?campaign_id=${c.id}`}>View leads</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
