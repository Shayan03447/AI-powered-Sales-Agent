"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StepLockNotice from "@/components/workflow/StepLockNotice";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import WorkflowProgress from "@/components/ui/WorkflowProgress";

export default function StartSendButton({
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
      const res = await fetch("/api/workflows/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_size: 5 }),
      });
      const data = await res.json();

      if (!data.ok) {
        const detail = data.detail
          ? `\n${String(data.detail).slice(0, 300)}`
          : "";
        setError((data.error || "Could not start send") + detail);
        setLoading(false);
        return;
      }

      setMessage(data.message);
      // Keep button disabled until refresh completes to prevent double-submit.
      setTimeout(() => {
        router.refresh();
        setLoading(false);
      }, 1500);
    } catch {
      setError("Network error — is the dashboard server running?");
      setLoading(false);
    }
  }

  return (
    <Card variant="action" className={locked ? "card-locked" : ""}>
      <h2>Send Approved Emails</h2>
      <p className="muted">
        Sends all approved leads via your configured email domain. Only leads
        with status <strong>approved</strong> and an approved draft are
        processed.
      </p>

      <p className="stat-line">
        <strong>{waitingCount}</strong> lead{waitingCount !== 1 ? "s" : ""} approved and ready to send
      </p>

      <StepLockNotice
        locked={locked}
        title="Send locked"
        reason="No approved leads waiting. Approve drafts on the Drafts page first."
        href="/drafts"
        linkLabel="Go to Drafts →"
      />

      {loading && (
        <WorkflowProgress
          title="Send running…"
          activeIndex={0}
          steps={[
            { label: "Triggering send workflow" },
            { label: "Delivering emails via your configured domain" },
            { label: "Status updates appear on this page" },
          ]}
        />
      )}

      <Button
        onClick={onStart}
        disabled={locked}
        loading={loading}
      >
        {loading
          ? "Starting…"
          : locked
            ? "Locked — need approved leads"
            : "Send Approved"}
      </Button>

      <Link href="/drafts" className="btn-link">
        Review drafts →
      </Link>
      <Link href="/leads" className="btn-link">
        View leads →
      </Link>

      {message && <p className="ok">{message}</p>}
      {error && <p className="error-box">{error}</p>}
    </Card>
  );
}
