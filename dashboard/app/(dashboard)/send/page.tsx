import Link from "next/link";
import { query } from "@/lib/db";
import StartSendButton from "@/components/workflow/StartSendButton";
import StatusBadge from "@/components/ui/StatusBadge";
import SendRefresh from "@/components/workflow/SendRefresh";
import Card from "@/components/ui/Card";
import EmptyState, { SendIcon } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Send — Atrium Reach" };

/** Format a raw PostgreSQL timestamp into a user-friendly short date. */
function formatSentAt(raw: string | null): string {
  if (!raw) return "Sent";
  try {
    return new Date(raw).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Sent";
  }
}

type RecentLead = {
  id: number;
  business_name: string;
  email: string | null;
  status: string;
  failure_reason: string | null;
  sent_at: string | null;
  updated_at: string | null;
};

async function getApprovedReadyCount() {
  try {
    const rows = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM leads l
       WHERE l.status = 'approved'
         AND l.email IS NOT NULL
         AND TRIM(l.email) <> ''
         AND EXISTS (
           SELECT 1
           FROM email_drafts ed
           WHERE ed.lead_id = l.id
             AND ed.status = 'approved'
         )`
    );
    return { ok: true as const, count: Number(rows[0]?.count || 0) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, error: message, count: 0 };
  }
}

async function getRecentSendResults() {
  try {
    const rows = await query<RecentLead>(
      `SELECT id, business_name, email, status, failure_reason,
              sent_at::text, updated_at::text
       FROM leads
       WHERE status IN ('sending', 'sent', 'send_failed', 'approved')
       ORDER BY
         CASE status
           WHEN 'sending' THEN 0
           WHEN 'send_failed' THEN 1
           WHEN 'sent' THEN 2
           ELSE 3
         END,
         updated_at DESC NULLS LAST
       LIMIT 30`
    );
    return { ok: true as const, rows };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, error: message, rows: [] as RecentLead[] };
  }
}

export default async function SendPage() {
  const ready = await getApprovedReadyCount();
  const recent = await getRecentSendResults();
  const hasInProgress =
    recent.ok && recent.rows.some((r) => r.status === "sending");

  return (
    <main className="fade-in">
      <div className="page-head">
        <div>
          <p className="eyebrow">Step 5</p>
          <h1>Send</h1>
          <p className="muted">
            Send approved emails via your configured email domain. Make sure
            your email API is set up before sending.
          </p>
        </div>
        <div className="page-head-actions">
          <SendRefresh hasInProgress={!!hasInProgress} />
          <Link href="/drafts" className="btn-secondary-link">
            Drafts
          </Link>
        </div>
      </div>

      {!ready.ok && (
        <Card variant="error">
          <strong>Could not read send queue</strong>
          <p>{ready.error}</p>
        </Card>
      )}

      {/* Only render the send action card when DB query succeeded */}
      {ready.ok && <StartSendButton waitingCount={ready.count} />}

      {/* Show a positive confirmation when all approved emails have been sent */}
      {ready.ok && ready.count === 0 && recent.ok && recent.rows.some((r) => r.status === "sent") && (
        <div className="banner banner-ok" style={{ marginBottom: 0 }}>
          All approved emails have been sent. Start a new campaign to find more leads.
        </div>
      )}

      <Card as="section" style={{ marginTop: "var(--space-3)" }}>
        <h2 style={{ marginTop: 0 }}>Recent send status</h2>
        <p className="muted">
          Approved · Sending · Sent · Failed — refresh after running Send.
        </p>

        {!recent.ok && <p className="error-box">{recent.error}</p>}

        {recent.ok && recent.rows.length === 0 && (
          <EmptyState
            icon={<SendIcon />}
            title="No sends yet"
            description="Approved leads will appear here once you run the send step."
            action={
              <Link href="/drafts" className="btn-secondary-link">
                Review Drafts
              </Link>
            }
          />
        )}

        {recent.ok && recent.rows.length > 0 && (
          <div className="table-wrap send-table">
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {recent.rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.business_name}</td>
                    <td>{r.email ?? "—"}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="muted">
                      {r.status === "sent" ? formatSentAt(r.sent_at) : "—"}
                    </td>
                    <td className="muted">
                      {r.status === "send_failed"
                        ? (r.failure_reason?.slice(0, 120) || "Send failed")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
