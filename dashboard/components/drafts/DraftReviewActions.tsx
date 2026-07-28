"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  leadId: number;
  subject: string;
  body: string;
};

export default function DraftReviewActions({
  leadId,
  subject: initialSubject,
  body: initialBody,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function callReview(payload: Record<string, unknown>) {
    setLoading(String(payload.action));
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/drafts/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Action failed");
        return;
      }

      setMessage(data.message || "Done");
      setEditing(false);
      setShowReject(false);
      router.refresh();
    } catch {
      setError("Network error — is the dashboard server running?");
    } finally {
      setLoading(null);
    }
  }

  function onApprove() {
    if (editing) {
      void callReview({
        action: "approve",
        subject: subject.trim(),
        body: body.trim(),
      });
      return;
    }
    void callReview({ action: "approve" });
  }

  function onSaveEdit() {
    void callReview({
      action: "edit",
      subject: subject.trim(),
      body: body.trim(),
    });
  }

  function onReject() {
    void callReview({
      action: "reject",
      reason: reason.trim() || undefined,
    });
  }

  const busy = loading !== null;

  return (
    <div className="draft-actions">
      {editing && (
        <div className="draft-edit-form">
          <label>
            Subject
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={busy}
            />
          </label>
          <label>
            Email body
            <textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={busy}
            />
          </label>
        </div>
      )}

      {showReject && (
        <div className="draft-edit-form">
          <label>
            Reject reason (optional)
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Wrong fit / bad email"
              disabled={busy}
            />
          </label>
        </div>
      )}

      <div className="draft-action-row">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy || (!initialSubject && !editing)}
        >
          {loading === "approve" ? "Approving…" : "Approve"}
        </button>

        {!editing ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setEditing(true);
              setShowReject(false);
              setError("");
              setMessage("");
            }}
            disabled={busy}
          >
            Edit
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={onSaveEdit}
              disabled={busy}
            >
              {loading === "edit" ? "Saving…" : "Save edit"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditing(false);
                setSubject(initialSubject);
                setBody(initialBody);
              }}
              disabled={busy}
            >
              Cancel
            </button>
          </>
        )}

        {!showReject ? (
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              setShowReject(true);
              setEditing(false);
              setError("");
              setMessage("");
            }}
            disabled={busy}
          >
            Reject
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-danger"
              onClick={onReject}
              disabled={busy}
            >
              {loading === "reject" ? "Rejecting…" : "Confirm reject"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowReject(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {message && <p className="ok">{message}</p>}
      {error && <p className="error-box">{error}</p>}
    </div>
  );
}
