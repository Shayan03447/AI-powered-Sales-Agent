"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StepLockNotice from "@/components/workflow/StepLockNotice";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import WorkflowProgress from "@/components/ui/WorkflowProgress";

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
        setLoading(false);
        return;
      }

      setMessage(data.message);
      // Keep button disabled until redirect completes to prevent double-submit.
      setTimeout(() => {
        router.push("/leads");
        router.refresh();
      }, 1500);
    } catch {
      setError("Network error — is the dashboard server running?");
      setLoading(false);
    }
  }

  return (
    <Card variant="action" className={locked ? "card-locked" : ""}>
      <h2>Start Research</h2>
      <p className="muted">
        Runs only for leads with status <strong>new</strong> (and a website).
        If every lead is already <strong>enriched</strong>, this step stays
        locked — use AI Draft instead.
      </p>

      <p className="stat-line">
        <strong>{waitingCount}</strong> lead{waitingCount !== 1 ? "s" : ""} ready for research
      </p>

      <StepLockNotice
        locked={locked}
        title="Research locked"
        reason="No new leads ready. Find Leads first, or go to AI Draft if your leads are already enriched."
        href="/find-leads"
        linkLabel="Go to Find Leads →"
      />

      {loading && (
        <WorkflowProgress
          title="Research running…"
          activeIndex={0}
          steps={[
            { label: "Triggering research workflow" },
            { label: "Scraping websites & scoring leads" },
            { label: "Saving enriched data to Leads" },
          ]}
        />
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
    </Card>
  );
}
