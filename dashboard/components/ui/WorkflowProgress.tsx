"use client";

import Spinner from "@/components/ui/Spinner";
import styles from "./WorkflowProgress.module.css";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface WorkflowStep {
  /** Human-readable description of this step */
  label: string;
}

interface WorkflowProgressProps {
  /** Shown in the header, e.g. "Research running…" */
  title: string;
  /** Ordered list of steps in the workflow */
  steps: WorkflowStep[];
  /**
   * Zero-based index of the step currently in progress.
   * Steps before this index are shown as completed.
   * Steps after are shown as pending.
   * Defaults to 0 (first step active).
   */
  activeIndex?: number;
}

/* ─── Step state icons ──────────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1" />
      <path
        d="M4 7l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PendingDot() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function WorkflowProgress({
  title,
  steps,
  activeIndex = 0,
}: WorkflowProgressProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      {/* Header */}
      <div className={styles.header}>
        <Spinner size="sm" label={title} />
        <p className={styles.title}>{title}</p>
      </div>

      {/* Step list */}
      <ol className={styles.steps}>
        {steps.map((step, i) => {
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;
          const stateClass = isCompleted
            ? styles.completed
            : isActive
              ? styles.active
              : styles.pending;

          return (
            <li key={i} className={`${styles.step} ${stateClass}`}>
              <span className={styles.stepIcon} aria-hidden="true">
                {isCompleted ? (
                  <CheckIcon />
                ) : isActive ? (
                  <Spinner size="sm" />
                ) : (
                  <PendingDot />
                )}
              </span>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
