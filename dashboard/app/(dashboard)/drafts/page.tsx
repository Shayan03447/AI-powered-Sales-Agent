import { query } from "@/lib/db";
import DraftsTable, { type DraftLead } from "@/components/drafts/DraftsTable";
import DraftsRefresh from "@/components/drafts/DraftsRefresh";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getDrafts() {
  try {
    const rows = await query<DraftLead>(
      `SELECT id, business_name, city, status, website_url, campaign_id,
              email, email_subject, personalized_email, audit_summary,
              pagespeed_score, seo_score, failure_reason
       FROM leads
       WHERE status IN (
         'auditing',
         'pending_review',
         'audit_failed',
         'approved',
         'rejected'
       )
       ORDER BY
         CASE status
           WHEN 'auditing' THEN 0
           WHEN 'pending_review' THEN 1
           WHEN 'approved' THEN 2
           WHEN 'rejected' THEN 3
           ELSE 4
         END,
         updated_at DESC NULLS LAST,
         id DESC
       LIMIT 50`
    );
    return { ok: true as const, drafts: rows };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, error: message };
  }
}

export default async function DraftsPage() {
  const result = await getDrafts();
  const hasInProgress =
    result.ok && result.drafts.some((d) => d.status === "auditing");

  return (
    <main className="fade-in">
      <div className="page-head">
        <div>
          <p className="eyebrow">Data</p>
          <h1>Drafts</h1>
          <p className="muted">
            Review AI emails — Approve, Edit, or Reject before send
          </p>
        </div>
        <div className="page-head-actions">
          {result.ok && <DraftsRefresh hasInProgress={!!hasInProgress} />}
          <Link href="/ai-draft" className="btn-primary-link">
            + Create AI Emails
          </Link>
        </div>
      </div>

      {!result.ok && (
        <div className="card error-box">
          <strong>Could not load drafts</strong>
          <p>{result.error}</p>
        </div>
      )}

      {result.ok && <DraftsTable drafts={result.drafts} />}
    </main>
  );
}
