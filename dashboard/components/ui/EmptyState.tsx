import { ReactNode } from "react";
import Card from "@/components/ui/Card";
import styles from "./EmptyState.module.css";

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface EmptyStateProps {
  /**
   * Optional icon rendered inside a teal-tinted circle.
   * Pass any SVG or React element — sized to 28 × 28 px recommended.
   */
  icon?: ReactNode;
  /** Primary empty-state headline. e.g. "No leads yet" */
  title: string;
  /** Supporting sentence. e.g. "Start finding businesses…" */
  description: string;
  /**
   * Optional call-to-action. Accepts any ReactNode so callers can
   * pass a <Button> for click actions or a <Link className="btn-primary-link">
   * for navigation.
   */
  action?: ReactNode;
}

/* ─── Preset SVG icons ──────────────────────────────────────────────────── */

/** Single person / leads icon */
export function LeadsIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
    </svg>
  );
}

/** Broadcast / campaign icon */
export function CampaignIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

/** Envelope / draft icon */
export function DraftIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

/** Magnifying glass / research icon */
export function ResearchIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

/** Send / outbox icon */
export function SendIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card variant="empty">
      <div className={styles.wrapper}>
        {icon && (
          <div className={styles.iconWrap} aria-hidden="true">
            {icon}
          </div>
        )}

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>

        {action && <div className={styles.action}>{action}</div>}
      </div>
    </Card>
  );
}
