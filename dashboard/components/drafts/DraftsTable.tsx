import type { Lead } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import DraftReviewActions from "@/components/drafts/DraftReviewActions";
import Card from "@/components/ui/Card";
import Link from "next/link";

export type DraftLead = Lead & {
  email_subject?: string | null;
  personalized_email?: string | null;
  audit_summary?: string | null;
};

export default function DraftsTable({ drafts }: { drafts: DraftLead[] }) {
  if (drafts.length === 0) {
    return (
      <Card variant="empty">
        <p className="muted">
          No drafts yet. Go to <Link href="/ai-draft">AI Draft</Link> to create
          emails.
        </p>
      </Card>
    );
  }

  return (
    <div className="drafts-list">
      {drafts.map((d) => (
        <article key={d.id} className="card draft-card">
          <div className="draft-head">
            <div>
              <h2>{d.business_name}</h2>
              <p className="muted">
                {d.city ?? "—"} · {d.email ?? "—"} · campaign{" "}
                {d.campaign_id ? `#${d.campaign_id}` : "—"}
              </p>
            </div>
            <StatusBadge status={d.status} />
          </div>

          {d.status === "auditing" && (
            <div className="banner banner-loading">AI writing draft…</div>
          )}

          {d.status === "approved" && (
            <div className="banner banner-ok">
              Approved — ready on the Send page.
            </div>
          )}

          {d.status === "rejected" && (
            <div className="banner banner-bad">
              Rejected — will not be sent
              {d.failure_reason ? `: ${d.failure_reason}` : "."}
            </div>
          )}

          {d.email_subject && (
            <p>
              <strong>Subject:</strong> {d.email_subject}
            </p>
          )}

          {d.audit_summary && (
            <div className="draft-block">
              <h3>Audit</h3>
              <p className="draft-text">{d.audit_summary}</p>
            </div>
          )}

          {d.personalized_email && (
            <div className="draft-block">
              <h3>Email draft</h3>
              <pre className="draft-text">{d.personalized_email}</pre>
            </div>
          )}

          {!d.email_subject && d.status === "pending_review" && (
            <p className="muted">Draft fields empty — check WF3 save step.</p>
          )}

          {d.status === "pending_review" && (
            <DraftReviewActions
              leadId={d.id}
              subject={d.email_subject ?? ""}
              body={d.personalized_email ?? ""}
            />
          )}
        </article>
      ))}
    </div>
  );
}
