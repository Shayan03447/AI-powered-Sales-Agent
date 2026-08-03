import type { Lead } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Link from "next/link";
import EmptyState, { LeadsIcon } from "@/components/ui/EmptyState";

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<LeadsIcon />}
        title="No leads yet"
        description="Start finding businesses to build your pipeline."
        action={
          <Link href="/find-leads" className="btn-primary-link">
            Find Leads
          </Link>
        }
      />
    );
  }

  return (
    <div className="card table-wrap leads-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Business</th>
            <th>City</th>
            <th>Status</th>
            <th>Email</th>
            <th>Speed</th>
            <th>SEO</th>
            <th>Campaign</th>
            <th>Website</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.business_name}</td>
              <td>{lead.city ?? "—"}</td>
              <td>
                <StatusBadge status={lead.status} />
                {lead.status === "enriching" && (
                  <div className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
                    researching…
                  </div>
                )}
              </td>
              <td>
                {lead.status === "enriching"
                  ? "…"
                  : lead.email ?? "—"}
              </td>
              <td>
                {lead.status === "enriching"
                  ? "…"
                  : lead.pagespeed_score ?? "—"}
              </td>
              <td>
                {lead.status === "enriching"
                  ? "…"
                  : lead.seo_score ?? "—"}
              </td>
              <td>{lead.campaign_id ? `#${lead.campaign_id}` : "—"}</td>
              <td>
                {lead.website_url ? (
                  <a
                    href={lead.website_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Visit ${lead.business_name} website`}
                  >
                    open
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
