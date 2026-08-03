import { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

/* ─── Primitive bone ────────────────────────────────────────────────────── */

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
}

/**
 * A single animated shimmer block.
 * Use width/height props for one-off inline bones, or use the
 * named layout exports below for full-page skeleton screens.
 */
export default function Skeleton({
  width,
  height = 14,
  className = "",
  style,
}: SkeletonProps) {
  return (
    <span
      className={[styles.bone, className].filter(Boolean).join(" ")}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/* ─── Leads table skeleton ──────────────────────────────────────────────── */

/**
 * Matches the column layout of LeadsTable:
 * ID · Business · City · Status · Email · Speed · SEO · Campaign · Website
 */
export function LeadsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className={styles.tableWrap} aria-hidden="true" aria-label="Loading leads">
      {/* Header */}
      <div className={styles.tableHead}>
        <span className={`${styles.bone} ${styles.cellNarrow}`} />
        <span className={`${styles.bone} ${styles.cellWide}`} />
        <span className={`${styles.bone} ${styles.cell}`} />
        <span className={`${styles.bone} ${styles.cellPill}`} />
        <span className={`${styles.bone} ${styles.cellWide}`} />
        <span className={`${styles.bone} ${styles.cellNarrow}`} />
        <span className={`${styles.bone} ${styles.cellNarrow}`} />
        <span className={`${styles.bone} ${styles.cellMedium}`} />
        <span className={`${styles.bone} ${styles.cellMedium}`} />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.tableRow}>
          <span className={`${styles.bone} ${styles.cellNarrow}`} />
          <span className={`${styles.bone} ${styles.cellWide}`} />
          <span className={`${styles.bone} ${styles.cell}`} />
          <span className={`${styles.bone} ${styles.cellPill}`} />
          <span className={`${styles.bone} ${styles.cellWide}`} />
          <span className={`${styles.bone} ${styles.cellNarrow}`} />
          <span className={`${styles.bone} ${styles.cellNarrow}`} />
          <span className={`${styles.bone} ${styles.cellMedium}`} />
          <span className={`${styles.bone} ${styles.cellMedium}`} />
        </div>
      ))}
    </div>
  );
}

/* ─── Campaigns table skeleton ──────────────────────────────────────────── */

/**
 * Matches the column layout of CampaignsTable:
 * ID · Business type · City · Status · Found · Inserted · Leads
 */
export function CampaignsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.tableWrap} aria-hidden="true" aria-label="Loading campaigns">
      {/* Header */}
      <div className={styles.tableHead}>
        <span className={`${styles.bone} ${styles.cellNarrow}`} />
        <span className={`${styles.bone} ${styles.cellWide}`} />
        <span className={`${styles.bone} ${styles.cell}`} />
        <span className={`${styles.bone} ${styles.cellPill}`} />
        <span className={`${styles.bone} ${styles.cellNarrow}`} />
        <span className={`${styles.bone} ${styles.cellNarrow}`} />
        <span className={`${styles.bone} ${styles.cellMedium}`} />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.tableRow}>
          <span className={`${styles.bone} ${styles.cellNarrow}`} />
          <span className={`${styles.bone} ${styles.cellWide}`} />
          <span className={`${styles.bone} ${styles.cell}`} />
          <span className={`${styles.bone} ${styles.cellPill}`} />
          <span className={`${styles.bone} ${styles.cellNarrow}`} />
          <span className={`${styles.bone} ${styles.cellNarrow}`} />
          <span className={`${styles.bone} ${styles.cellMedium}`} />
        </div>
      ))}
    </div>
  );
}

/* ─── Dashboard card skeleton (home page) ───────────────────────────────── */

/**
 * Matches home page structure:
 * hero panel → pipeline tracker → 5 action tiles
 */
export function DashboardCardSkeleton() {
  return (
    <div aria-hidden="true" aria-label="Loading dashboard">
      {/* Hero panel */}
      <div className={styles.hero}>
        <span className={`${styles.bone}`} style={{ width: "55%", height: 28 }} />
        <span className={`${styles.bone}`} style={{ width: "80%", height: 16 }} />
        <span className={`${styles.bone}`} style={{ width: "140px", height: 38, borderRadius: "var(--radius-md)" }} />
      </div>

      {/* Pipeline tracker */}
      <div className={styles.trackerWrap}>
        <span className={`${styles.bone}`} style={{ width: 110, height: 12 }} />
        <div className={styles.trackerRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "contents" }}>
              <span className={`${styles.bone} ${styles.trackerNode}`} />
              {i < 4 && <span className={`${styles.bone} ${styles.trackerConnector}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Action tiles */}
      <div className={styles.cardGrid}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.card}>
            <span className={`${styles.bone}`} style={{ width: 32, height: 12 }} />
            <span className={`${styles.bone}`} style={{ width: "60%", height: 18 }} />
            <span className={`${styles.bone}`} style={{ width: "85%", height: 13 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page head skeleton (shared across data pages) ────────────────────── */

export function PageHeadSkeleton() {
  return (
    <div className={styles.pageHead} aria-hidden="true">
      <div className={styles.pageHeadLeft}>
        <Skeleton width={64} height={11} />
        <Skeleton width={180} height={28} />
        <Skeleton width={260} height={14} />
      </div>
      <div className={styles.pageHeadActions}>
        <Skeleton width={90} height={38} style={{ borderRadius: "var(--radius-md)" }} />
        <Skeleton width={110} height={38} style={{ borderRadius: "var(--radius-md)" }} />
      </div>
    </div>
  );
}
