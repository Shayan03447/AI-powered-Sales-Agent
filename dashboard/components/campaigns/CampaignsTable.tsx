import type { Campaign } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Link from "next/link";
import EmptyState, { CampaignIcon } from "@/components/ui/EmptyState";

export default function CampaignsTable({
  campaigns,
}: {
  campaigns: Campaign[];
}) {
  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={<CampaignIcon />}
        title="No campaigns yet"
        description="Create your first outreach campaign."
        action={
          <Link href="/find-leads" className="btn-primary-link">
            Find Leads
          </Link>
        }
      />
    );
  }

  return (
    <div className="card table-wrap campaigns-table">
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
