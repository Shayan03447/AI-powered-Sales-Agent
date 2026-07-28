import Link from "next/link";
import { getPipelineCounts } from "@/lib/pipeline/counts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const pipeline = await getPipelineCounts();
  const c = pipeline.counts;

  const researchOpen = c.newReady > 0;
  const aiDraftOpen = c.enrichedReady > 0;

  return (
    <main className="fade-in">
      <section className="hero-panel">
        <p className="eyebrow">Atrium Solution</p>
        <h1>Atrium Reach</h1>
        <p className="lede">
          Find businesses, research websites, draft AI emails, and approve
          before anything is sent. Email send enables later with your company
          domain.
        </p>
        <div className="hero-actions">
          <Link href="/find-leads" className="btn-primary-link">
            Start Find Leads
          </Link>
          <Link href="/ai-draft" className="btn-secondary-link">
            Create AI Emails
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
              <strong>new</strong> (ready for Research): {c.newReady}
              {researchOpen ? " — Research open" : " — Research locked"}
            </li>
            <li>
              <strong>enriched</strong> (ready for AI Draft): {c.enrichedReady}
              {aiDraftOpen ? " — AI Draft open" : " — AI Draft locked"}
            </li>
            <li>
              <strong>pending_review</strong> (Drafts): {c.pendingReview}
            </li>
            <li>
              <strong>approved</strong> (queued for send later): {c.approved}
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

      <section className="action-grid action-grid-4">
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
      </section>
    </main>
  );
}
