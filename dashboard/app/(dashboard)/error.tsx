"use client";

/**
 * Dashboard-level error boundary.
 * Scoped to all routes inside (dashboard) — AppNav remains visible.
 * Catches unhandled render-time exceptions (not DB query errors,
 * which are handled via try/catch inside each page).
 */

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <main className="fade-in" style={{ maxWidth: 560, margin: "48px auto", padding: "0 24px" }}>
      <div className="card" style={{ textAlign: "center", padding: "32px 28px" }}>
        <p className="eyebrow" style={{ color: "var(--bad)" }}>Page error</p>

        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "1.4rem", marginBottom: 10 }}>
          Something went wrong
        </h1>

        <p className="muted" style={{ marginBottom: 24 }}>
          This page ran into an unexpected error. You can try again or go to a
          different page — your data is safe.
        </p>

        {error.digest && (
          <p className="muted" style={{ marginBottom: 24, fontSize: "0.78rem" }}>
            Error ref: <code>{error.digest}</code>
          </p>
        )}

        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <button
            className="btn-primary-link"
            onClick={reset}
            style={{ cursor: "pointer", border: "none" }}
          >
            Try again
          </button>

          <Link href="/" className="btn-secondary-link">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
