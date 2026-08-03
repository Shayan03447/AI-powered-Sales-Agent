"use client";

/**
 * Root error boundary — catches unhandled exceptions from any route.
 * Next.js requires this to be a Client Component.
 * Shown when a component throws during render (not caught by try/catch).
 */

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error);
  }, [error]);

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "80px auto",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          padding: "32px 28px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--bad)",
            marginBottom: 8,
          }}
        >
          Something went wrong
        </p>

        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 600,
            marginBottom: 10,
            fontFamily: "var(--font-sans)",
          }}
        >
          Unexpected Error
        </h1>

        <p style={{ color: "var(--ink-soft)", marginBottom: 24 }}>
          An unexpected error occurred. Try refreshing or return to the
          dashboard.
        </p>

        {error.digest && (
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--muted)",
              marginBottom: 24,
            }}
          >
            Error ref: <code>{error.digest}</code>
          </p>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 18px",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Try again
          </button>

          <Link
            href="/"
            style={{
              padding: "10px 18px",
              background: "var(--bg-elevated)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
