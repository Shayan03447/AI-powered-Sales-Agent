"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function DraftsRefresh({
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
      <Button variant="secondary" onClick={() => router.refresh()}>
        Refresh now
      </Button>
      {hasInProgress && (
        <span className="banner banner-loading" style={{ margin: 0 }}>
          AI drafting… auto-refresh ({seconds}s)
        </span>
      )}
    </div>
  );
}
