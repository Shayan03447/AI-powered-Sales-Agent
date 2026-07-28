import Link from "next/link";
import { getPipelineCounts } from "@/lib/pipeline/counts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const pipeline = await getPipelineCounts();
  const c = pipeline.counts;

  const researchOpen = c.newReady > 0;
  const aiDraftOpen = c.enrichedReady > 0;
  const sendOpen = c.approved > 0;

  return (
    <main className="fade-in">
      <section className="hero-panel">
        <p className="eyebrow">Atrium Solution</p>
        <h1>Atrium Reach</h1>
        <p className="lede">
          Find businesses, research websites, draft AI emails, approve, then
          send from your company domain via Resend.
        </p>
        <div className="hero-actions">
          <Link href="/find-leads" className="btn-primary-link">
            Start Find Leads
          </Link>
          <Link href="/send" className="btn-secondary-link">
            Send Approved
          </Link>
        </div>
      </section>

      {pipeline.ok && (
        <div className="card pipeline-status">
          <h2>Pipeline status</h2>
          <p className="muted">
            Next step unlocks only when the previous status exists.
          </p>
          <ul className="pipeline-list">
            <li>
              <strong>new</strong> (Research): {c.newReady}
              {researchOpen ? " — open" : " — locked"}
            </li>
            <li>
              <strong>enriched</strong> (AI Draft): {c.enrichedReady}
              {aiDraftOpen ? " — open" : " — locked"}
            </li>
            <li>
              <strong>pending_review</strong> (Drafts): {c.pendingReview}
            </li>
            <li>
              <strong>approved</strong> (Send): {c.approved}
              {sendOpen ? " — Send open" : " — Send locked"}
            </li>
          </ul>
        </div>
      )}

      {!pipeline.ok && (
        <div className="card error-box">
          <strong>Could not read pipeline</strong>
          <p>{pipeline.error}</p>
        </div>
      )}

      <section className="action-grid action-grid-5">
        <Link href="/find-leads" className="action-tile">
          <span className="tile-step">01</span>
          <h2>Find Leads</h2>
          <p>Search by business type and city.</p>
        </Link>

        <Link
          href="/research"
          className={`action-tile ${researchOpen ? "" : "action-tile-locked"}`}
        >
          <span className="tile-step">02</span>
          <h2>Research</h2>
          <p>
            {researchOpen
              ? `${c.newReady} new lead(s) ready.`
              : "Locked — needs status new."}
          </p>
        </Link>

        <Link
          href="/ai-draft"
          className={`action-tile ${aiDraftOpen ? "" : "action-tile-locked"}`}
        >
          <span className="tile-step">03</span>
          <h2>AI Draft</h2>
          <p>
            {aiDraftOpen
              ? `${c.enrichedReady} enriched lead(s) ready.`
              : "Locked — needs status enriched."}
          </p>
        </Link>

        <Link href="/drafts" className="action-tile">
          <span className="tile-step">04</span>
          <h2>Drafts</h2>
          <p>Approve, edit, or reject AI emails.</p>
        </Link>

        <Link
          href="/send"
          className={`action-tile ${sendOpen ? "" : "action-tile-locked"}`}
        >
          <span className="tile-step">05</span>
          <h2>Send</h2>
          <p>
            {sendOpen
              ? `${c.approved} approved lead(s) ready.`
              : "Locked — approve drafts first."}
          </p>
        </Link>
      </section>
    </main>
  );
}
