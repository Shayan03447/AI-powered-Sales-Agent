"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StepLockNotice from "@/components/workflow/StepLockNotice";

export default function StartAiDraftButton({
  waitingCount,
}: {
  waitingCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const locked = waitingCount === 0;

  async function onStart() {
    if (locked) return;
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/workflows/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_size: 1 }),
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
    <div className={`card form-card ${locked ? "card-locked" : ""}`}>
      <h2>Create AI Emails</h2>
      <p className="muted">
        Runs only for leads with status <strong>enriched</strong> and an email.
        If no lead is enriched yet, finish Research first.
      </p>

      <p className="stat-line">
        Ready for AI draft (<code>enriched</code>):{" "}
        <strong>{waitingCount}</strong> lead(s)
      </p>

      <StepLockNotice
        locked={locked}
        title="AI Draft locked"
        reason="No enriched leads with email. Run Research on new leads first."
        href="/research"
        linkLabel="Go to Research →"
      />

      {loading && (
        <div className="banner banner-loading">
          AI draft starting… please wait.
        </div>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={loading || locked}
      >
        {loading
          ? "Starting…"
          : locked
            ? "Locked — need enriched leads"
            : "Create AI Emails"}
      </button>

      <Link href="/drafts" className="btn-link">
        View drafts →
      </Link>
      {locked && (
        <Link href="/research" className="btn-link">
          Back to Research →
        </Link>
      )}

      {message && <p className="ok">{message}</p>}
      {error && <p className="error-box">{error}</p>}
    </div>
  );
}
