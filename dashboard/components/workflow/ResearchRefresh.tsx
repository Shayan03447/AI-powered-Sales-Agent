"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

/**
 * Manual + auto-refresh component for long-running workflow pages.
 * Auto-refreshes every 8s when an operation is in progress.
 *
 * @param hasInProgress - triggers auto-refresh + status label
 * @param inProgressLabel - status text shown while in progress (default: "Enriching…")
 */
export default function ResearchRefresh({
  hasInProgress,
  inProgressLabel = "Enriching…",
}: {
  hasInProgress?: boolean;
  inProgressLabel?: string;
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
      <Button variant="secondary" onClick={() => router.refresh()}>
        Refresh
      </Button>
      {hasInProgress && (
        <span className="banner banner-loading" style={{ margin: 0 }}>
          {inProgressLabel} auto-refresh every 8s ({seconds}s)
        </span>
      )}
    </div>
  );
}
