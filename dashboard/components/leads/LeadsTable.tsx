import type { Lead } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <Card variant="empty">
        <p className="muted">
          No leads yet. Start from <Link href="/find-leads">Find Leads</Link>.
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
                  <a href={lead.website_url} target="_blank" rel="noreferrer">
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
