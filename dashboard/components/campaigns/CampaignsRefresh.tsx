"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

/**
 * Manual + auto-refresh for the Campaigns page.
 * Auto-refreshes every 8s when a campaign is actively running.
 */
export default function CampaignsRefresh({
  hasInProgress,
}: {
  hasInProgress?: boolean;
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
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Button variant="secondary" onClick={() => router.refresh()}>
        Refresh
      </Button>
      {hasInProgress && (
        <span className="banner banner-loading" style={{ margin: 0 }}>
          Running… auto-refresh every 8s ({seconds}s)
        </span>
      )}
    </div>
  );
}
