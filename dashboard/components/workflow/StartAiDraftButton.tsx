"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StartAiDraftButton({
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
      const res = await fetch("/api/workflows/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_size: 3 }),
      });
      const data = await res.json();

      if (!data.ok) {
        const detail = data.detail
          ? `\n${String(data.detail).slice(0, 300)}`
          : "";
        setError((data.error || "Could not start AI draft") + detail);
        return;
      }

      setMessage(data.message);
      setTimeout(() => {
        router.push("/drafts");
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
      <h2>Create AI Emails</h2>
      <p className="muted">
        Runs AI audit + personalized email draft for leads with status{" "}
        <strong>enriched</strong> and an email address. Results appear on the
        Drafts page.
      </p>

      <p className="stat-line">
        Ready for AI draft: <strong>{waitingCount}</strong> lead(s)
      </p>

      {loading && (
        <div className="banner banner-loading">
          AI draft starting… please wait.
        </div>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={loading || waitingCount === 0}
      >
        {loading ? "Starting…" : "Create AI Emails"}
      </button>

      <Link href="/drafts" className="btn-link">
        View drafts →
      </Link>

      {waitingCount === 0 && (
        <p className="muted" style={{ marginTop: 12 }}>
          No enriched leads with email. Finish{" "}
          <Link href="/research">Research</Link> first.
        </p>
      )}

      {message && <p className="ok">{message}</p>}
      {error && <p className="error-box">{error}</p>}
    </div>
  );
}
