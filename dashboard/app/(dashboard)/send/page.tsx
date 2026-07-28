import Link from "next/link";

export default function SendPage() {
  return (
    <main className="fade-in">
      <div className="page-head">
        <div>
          <p className="eyebrow">Coming soon</p>
          <h1>Send emails</h1>
          <p className="muted">
            Outbound send (WF4) will be enabled after your company domain and
            email delivery (Resend) are set up. Until then, use Drafts to
            approve or reject emails.
          </p>
        </div>
      </div>

      <div className="card">
        <p>
          <strong>What works now:</strong> Find Leads → Research → AI Draft →
          Approve / Edit / Reject on Drafts.
        </p>
        <p className="muted" style={{ marginTop: 12 }}>
          Approved leads stay ready in the queue. Nothing is emailed until Send
          is turned on.
        </p>
        <div className="hero-actions" style={{ marginTop: 8 }}>
          <Link href="/drafts" className="btn-primary-link">
            Go to Drafts
          </Link>
          <Link href="/" className="btn-secondary-link">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
