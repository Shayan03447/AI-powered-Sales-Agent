"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StepLockNotice from "@/components/workflow/StepLockNotice";
import Button from "@/components/ui/Button";

export default function StartResearchButton({
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
    <div className={`card form-card ${locked ? "card-locked" : ""}`}>
      <h2>Start Research</h2>
      <p className="muted">
        Runs only for leads with status <strong>new</strong> (and a website).
        If every lead is already <strong>enriched</strong>, this step stays
        locked — use AI Draft instead.
      </p>

      <p className="stat-line">
        Ready to research (<code>new</code>):{" "}
        <strong>{waitingCount}</strong> lead(s)
      </p>

      <StepLockNotice
        locked={locked}
        title="Research locked"
        reason="No leads with status new. Find Leads first, or if leads are already enriched, go to AI Draft."
        href="/find-leads"
        linkLabel="Go to Find Leads →"
      />

      {loading && (
        <div className="banner banner-loading">
          Research starting… please wait.
        </div>
      )}

      <Button
        onClick={onStart}
        disabled={locked}
        loading={loading}
      >
        {loading ? "Starting…" : locked ? "Locked — need new leads" : "Start Research"}
      </Button>

      <Link href="/leads" className="btn-link">
        View leads →
      </Link>
      {!locked && (
        <Link href="/ai-draft" className="btn-link">
          Next: AI Draft →
        </Link>
      )}
      {locked && (
        <Link href="/ai-draft" className="btn-link">
          Try AI Draft (if enriched) →
        </Link>
      )}

      {message && <p className="ok">{message}</p>}
      {error && <p className="error-box">{error}</p>}
    </div>
  );
}
