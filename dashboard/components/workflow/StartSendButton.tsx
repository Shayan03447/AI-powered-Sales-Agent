"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StepLockNotice from "@/components/workflow/StepLockNotice";
import Button from "@/components/ui/Button";

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
        return;
      }

      setMessage(data.message);
      setTimeout(() => {
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
      <h2>Send Approved Emails</h2>
      <p className="muted">
        Starts WF4. Only leads with status <strong>approved</strong> and an
        approved draft are sent via Resend (from your company domain email).
      </p>

      <p className="stat-line">
        Ready to send (<code>approved</code>):{" "}
        <strong>{waitingCount}</strong> lead(s)
      </p>

      <StepLockNotice
        locked={locked}
        title="Send locked"
        reason="No approved leads waiting. Approve drafts on the Drafts page first."
        href="/drafts"
        linkLabel="Go to Drafts →"
      />

      {loading && (
        <div className="banner banner-loading">
          Send starting… please wait.
        </div>
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
    </div>
  );
}
