import Link from "next/link";
import { getPipelineCounts } from "@/lib/pipeline/counts";
import type { PipelineCounts } from "@/lib/pipeline/counts";
import Card from "@/components/ui/Card";
import PipelineTracker from "@/components/ui/PipelineTracker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Dashboard — Atrium Reach" };

/* ─── Hero CTA decision logic ───────────────────────────────────────────── */

type HeroAction = { label: string; href: string };

/**
 * Resolves the primary and optional secondary CTA based on pipeline state.
 * Priority: highest-urgency stage first (Approved → Review → AI Draft → Research → Find).
 * Secondary CTA is only returned when a parallel action is genuinely available.
 */
function resolveActions(c: PipelineCounts): {
  primary: HeroAction;
  secondary: HeroAction | null;
  context: string;
} {
  const plural = (n: number, word: string) =>
    `${n} ${word}${n !== 1 ? "s" : ""}`;

  if (c.approved > 0) {
    return {
      context: `${plural(c.approved, "lead")} approved and ready to send.`,
      primary: { label: "Send Campaign", href: "/send" },
      secondary:
        c.pendingReview > 0
          ? { label: "Review Drafts", href: "/drafts" }
          : null,
    };
  }

  if (c.pendingReview > 0) {
    return {
      context: `${plural(c.pendingReview, "draft")} waiting for your review.`,
      primary: { label: "Review Drafts", href: "/drafts" },
      secondary:
        c.enrichedReady > 0
          ? { label: "Start AI Draft", href: "/ai-draft" }
          : null,
    };
  }

  if (c.enrichedReady > 0) {
    return {
      context: `${plural(c.enrichedReady, "lead")} enriched and ready for AI drafting.`,
      primary: { label: "Start AI Draft", href: "/ai-draft" },
      secondary:
        c.newReady > 0
          ? { label: "Start Research", href: "/research" }
          : null,
    };
  }

  if (c.newReady > 0) {
    return {
      context: `${plural(c.newReady, "lead")} ready for research.`,
      primary: { label: "Start Research", href: "/research" },
      secondary: null,
    };
  }

  // Leads exist but all are already sent / rejected — not a fresh pipeline
  if (c.totalLeads > 0) {
    return {
      context: "All emails have been sent. Start a new campaign to find more leads.",
      primary: { label: "Find More Leads", href: "/find-leads" },
      secondary: { label: "View Leads", href: "/leads" },
    };
  }

  // Truly empty — no leads at all
  return {
    context: "No leads yet. Start by finding businesses in your target market.",
    primary: { label: "Find Leads", href: "/find-leads" },
    secondary: null,
  };
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default async function HomePage() {
  const pipeline = await getPipelineCounts();
  const c = pipeline.counts;

  const researchOpen = c.newReady > 0;
  const aiDraftOpen = c.enrichedReady > 0;
  const sendOpen = c.approved > 0;

  const { primary, secondary, context } = resolveActions(c);

  return (
    <main className="fade-in">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="hero-panel">
        <h1>Outreach Pipeline</h1>

        {pipeline.ok ? (
          <>
            <p className="hero-context">{context}</p>
            <div className="hero-actions">
              <Link href={primary.href} className="btn-primary-link">
                {primary.label}
              </Link>
              {secondary && (
                <Link href={secondary.href} className="btn-secondary-link">
                  {secondary.label}
                </Link>
              )}
            </div>
          </>
        ) : (
          <p className="hero-context">
            Pipeline data is temporarily unavailable — check the error below.
          </p>
        )}
      </section>

      {/* ── Pipeline tracker ────────────────────────────────────────────── */}
      {pipeline.ok && <PipelineTracker counts={c} />}

      {/* Pipeline read error */}
      {!pipeline.ok && (
        <Card variant="error">
          <strong>Could not read pipeline</strong>
          <p>{pipeline.error}</p>
        </Card>
      )}

      {/* ── Stage tiles ────────────────────────────────────────────────── */}
      <section className="action-grid action-grid-5" aria-label="Pipeline stage shortcuts">
        <Link href="/find-leads" className="action-tile">
          <span className="tile-step">01</span>
          <h2>Find Leads</h2>
          <p>Search by business type and city.</p>
        </Link>

        <Link
          href="/research"
          className={`action-tile${researchOpen ? "" : " action-tile-locked"}`}
          aria-disabled={!researchOpen || undefined}
          tabIndex={researchOpen ? undefined : -1}
          onClick={!researchOpen ? (e) => e.preventDefault() : undefined}
        >
          <span className="tile-step">02</span>
          <h2>Research</h2>
          <p>
            {researchOpen
              ? `${c.newReady} new lead${c.newReady !== 1 ? "s" : ""} ready.`
              : "Locked — find new leads first."}
          </p>
        </Link>

        <Link
          href="/ai-draft"
          className={`action-tile${aiDraftOpen ? "" : " action-tile-locked"}`}
          aria-disabled={!aiDraftOpen || undefined}
          tabIndex={aiDraftOpen ? undefined : -1}
          onClick={!aiDraftOpen ? (e) => e.preventDefault() : undefined}
        >
          <span className="tile-step">03</span>
          <h2>AI Draft</h2>
          <p>
            {aiDraftOpen
              ? `${c.enrichedReady} enriched lead${c.enrichedReady !== 1 ? "s" : ""} ready.`
              : "Locked — run Research first."}
          </p>
        </Link>

        <Link href="/drafts" className="action-tile">
          <span className="tile-step">04</span>
          <h2>Drafts</h2>
          <p>Approve, edit, or reject AI emails.</p>
        </Link>

        <Link
          href="/send"
          className={`action-tile${sendOpen ? "" : " action-tile-locked"}`}
          aria-disabled={!sendOpen || undefined}
          tabIndex={sendOpen ? undefined : -1}
          onClick={!sendOpen ? (e) => e.preventDefault() : undefined}
        >
          <span className="tile-step">05</span>
          <h2>Send</h2>
          <p>
            {sendOpen
              ? `${c.approved} approved lead${c.approved !== 1 ? "s" : ""} ready.`
              : "Locked — approve drafts first."}
          </p>
        </Link>
      </section>
    </main>
  );
}
