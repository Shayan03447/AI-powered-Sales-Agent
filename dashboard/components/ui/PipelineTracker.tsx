import Link from "next/link";
import type { PipelineCounts } from "@/lib/pipeline/counts";
import styles from "./PipelineTracker.module.css";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type StepState = "completed" | "active" | "locked";

interface PipelineStep {
  /** Internal identifier */
  id: string;
  /** Display name — never exposes DB enum values */
  label: string;
  /** Route this step links to */
  href: string;
  /** Current state drives visual treatment */
  state: StepState;
  /** Human-readable sub-label: count string or status phrase */
  info: string;
  /** Numeric lead count — shown as a chip when > 0 on active steps */
  count: number | null;
}

/* ─── Step derivation ───────────────────────────────────────────────────── */

/**
 * Converts raw PipelineCounts into display-ready PipelineStep objects.
 *
 * State priority rules (per step):
 *   active    — leads are waiting to be processed at this stage right now
 *   completed — leads have passed through and moved downstream
 *   locked    — nothing to act on; prerequisites not met
 *
 * No DB enum strings are ever surfaced to the user.
 */
function buildSteps(c: PipelineCounts): PipelineStep[] {
  const totalInPipeline =
    c.newReady + c.enrichedReady + c.pendingReview + c.approved;

  /* ── 1. Find Leads ───────────────────────────────────────────────────── */
  const findLeadsState: StepState =
    totalInPipeline > 0 ? "completed" : "active";

  /* ── 2. Research ─────────────────────────────────────────────────────── */
  const hasDownstreamOfResearch =
    c.enrichedReady > 0 || c.pendingReview > 0 || c.approved > 0;
  const researchState: StepState =
    c.newReady > 0
      ? "active"
      : hasDownstreamOfResearch
        ? "completed"
        : "locked";

  /* ── 3. AI Draft ─────────────────────────────────────────────────────── */
  const hasDownstreamOfDraft = c.pendingReview > 0 || c.approved > 0;
  const aiDraftState: StepState =
    c.enrichedReady > 0
      ? "active"
      : hasDownstreamOfDraft
        ? "completed"
        : "locked";

  /* ── 4. Review ───────────────────────────────────────────────────────── */
  const reviewState: StepState =
    c.pendingReview > 0
      ? "active"
      : c.approved > 0
        ? "completed"
        : "locked";

  /* ── 5. Send ─────────────────────────────────────────────────────────── */
  const sendState: StepState =
    c.approved > 0
      ? "active"
      : c.sent > 0
        ? "completed"
        : "locked";

  /* ── Info text helpers ───────────────────────────────────────────────── */
  const plural = (n: number, w: string) => `${n} ${w}${n !== 1 ? "s" : ""}`;

  function infoFor(state: StepState, count: number, readyWord: string): string {
    if (state === "active") return plural(count, readyWord);
    if (state === "completed") return "Complete";
    return "Locked";
  }

  return [
    {
      id: "find-leads",
      label: "Find Leads",
      href: "/find-leads",
      state: findLeadsState,
      info: findLeadsState === "completed" ? "Complete" : "Start here",
      count: null,
    },
    {
      id: "research",
      label: "Research",
      href: "/research",
      state: researchState,
      info: infoFor(researchState, c.newReady, "lead"),
      count: researchState === "active" ? c.newReady : null,
    },
    {
      id: "ai-draft",
      label: "AI Draft",
      href: "/ai-draft",
      state: aiDraftState,
      info: infoFor(aiDraftState, c.enrichedReady, "lead"),
      count: aiDraftState === "active" ? c.enrichedReady : null,
    },
    {
      id: "review",
      label: "Review",
      href: "/drafts",
      state: reviewState,
      info: infoFor(reviewState, c.pendingReview, "draft"),
      count: reviewState === "active" ? c.pendingReview : null,
    },
    {
      id: "send",
      label: "Send",
      href: "/send",
      state: sendState,
      info:
        sendState === "active"
          ? plural(c.approved, "approved")
          : sendState === "completed"
            ? `${plural(c.sent, "email")} sent`
            : "Locked",
      count: sendState === "active" ? c.approved : null,
    },
  ];
}

/* ─── Check-mark SVG for completed nodes ───────────────────────────────── */
function CheckIcon() {
  return (
    <svg
      width="11"
      height="9"
      viewBox="0 0 11 9"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 4.5l3 3L10 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

interface PipelineTrackerProps {
  counts: PipelineCounts;
}

export default function PipelineTracker({ counts }: PipelineTrackerProps) {
  const steps = buildSteps(counts);

  return (
    <div className={styles.tracker}>
      <p className={styles.trackerTitle}>Pipeline stages</p>

      <ol className={styles.steps} aria-label="Pipeline stages">
        {steps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const stateClass = styles[step.state];

          return (
            <li
              key={step.id}
              className={`${styles.step} ${stateClass}`}
              aria-label={`${step.label}: ${step.info}`}
            >
              {/* ── Marker: connector-left · node · connector-right ── */}
              <div className={styles.marker} aria-hidden="true">
                {/* Left connector half */}
                {!isFirst && <span className={styles.connLeft} />}

                {/* Node dot */}
                <span className={styles.node}>
                  {step.state === "completed" && <CheckIcon />}
                </span>

                {/* Right connector half */}
                {!isLast && <span className={styles.connRight} />}
              </div>

              {/* ── Body: label + info ─────────────────────────────── */}
              <Link
                href={step.href}
                className={styles.body}
                aria-current={step.state === "active" ? "step" : undefined}
              >
                <span className={styles.stepLabel}>{step.label}</span>

                <span className={styles.stepInfo}>{step.info}</span>

                {step.count !== null && step.count > 0 && (
                  <span className={styles.countChip} aria-label={`${step.count} leads`}>
                    {step.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
