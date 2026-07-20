"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StartResearchButton({
  waitingCount,
}: {
  waitingCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onStart() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/workflows/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_size: 5 }),
      });
      const data = await res.json();

      if (!data.ok) {
        const detail = data.detail
          ? `\n${String(data.detail).slice(0, 300)}`
          : "";
        setError((data.error || "Could not start research") + detail);
        return;
      }

      setMessage(data.message);
      setTimeout(() => {
        router.push("/leads");
        router.refresh();
      }, 1500);
    } catch {
      setError("Network error — is the dashboard server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card form-card">
      <h2>Start Research</h2>
      <p className="muted">
        This runs website research (email, speed scores) for leads with status{" "}
        <strong>new</strong>. Results appear on the Leads page.
      </p>

      <p className="stat-line">
        Ready to research: <strong>{waitingCount}</strong> lead(s)
      </p>

      {loading && (
        <div className="banner banner-loading">
          Research starting… please wait.
        </div>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={loading || waitingCount === 0}
      >
        {loading ? "Starting…" : "Start Research"}
      </button>

      <Link href="/leads" className="btn-link">
        View leads →
      </Link>

      {waitingCount === 0 && (
        <p className="muted" style={{ marginTop: 12 }}>
          No new leads waiting.{" "}
          <Link href="/find-leads">Find Leads</Link> first.
        </p>
      )}

      {message && <p className="ok">{message}</p>}
      {error && <p className="error-box">{error}</p>}
    </div>
  );
}
