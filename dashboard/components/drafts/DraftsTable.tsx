import type { Lead } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import DraftReviewActions from "@/components/drafts/DraftReviewActions";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";
import EmptyState, { DraftIcon } from "@/components/ui/EmptyState";

export type DraftLead = Lead & {
  email_subject?: string | null;
  personalized_email?: string | null;
  audit_summary?: string | null;
};

export default function DraftsTable({ drafts }: { drafts: DraftLead[] }) {
  if (drafts.length === 0) {
    return (
      <EmptyState
        icon={<DraftIcon />}
        title="No drafts waiting"
        description="AI generated emails will appear here once you run the AI Draft step."
        action={
          <Link href="/ai-draft" className="btn-primary-link">
            Start AI Draft
          </Link>
        }
      />
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
            <div className="banner banner-loading" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Spinner size="sm" label="AI is writing this draft" />
              AI writing draft… this may take a minute.
            </div>
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

          {d.status === "audit_failed" && (
            <div className="banner banner-bad">
              <strong>Draft generation failed.</strong>{" "}
              {d.failure_reason
                ? d.failure_reason.slice(0, 200)
                : "The AI step encountered an error."}{" "}
              Go to{" "}
              <Link href="/ai-draft" className="btn-link" style={{ display: "inline", padding: 0 }}>
                AI Draft
              </Link>{" "}
              and run it again to retry.
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
              <div className="draft-text">{d.personalized_email}</div>
            </div>
          )}

          {!d.email_subject && d.status === "pending_review" && (
            <p className="muted">
              Email draft is empty — the AI generation step may not have saved
              correctly. Try running{" "}
              <Link href="/ai-draft" className="btn-link" style={{ display: "inline", padding: 0 }}>
                AI Draft
              </Link>{" "}
              again for this lead.
            </p>
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
