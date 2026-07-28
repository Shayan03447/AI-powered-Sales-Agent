"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Auto-refresh while any lead is status=sending */
export default function SendRefresh({
  hasInProgress,
}: {
  hasInProgress: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!hasInProgress) return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [hasInProgress, router]);

  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={() => router.refresh()}
    >
      Refresh
    </button>
  );
}
