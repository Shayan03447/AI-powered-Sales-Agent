"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Auto-refresh while any lead is still enriching */
export default function LeadsRefresh({
  hasInProgress,
}: {
  hasInProgress: boolean;
}) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!hasInProgress) return;

    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    const refresh = setInterval(() => router.refresh(), 8000);

    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [hasInProgress, router]);

  return (
    <div className="page-head-actions">
      <button
        type="button"
        className="btn-secondary-link"
        style={{ cursor: "pointer", border: "1px solid var(--line)" }}
        onClick={() => router.refresh()}
      >
        Refresh now
      </button>
      {hasInProgress && (
        <span className="banner banner-loading" style={{ margin: 0 }}>
          Research in progress… auto-refresh every 8s ({seconds}s)
        </span>
      )}
    </div>
  );
}
