"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Button from "@/components/ui/Button";

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
    <Button variant="secondary" onClick={() => router.refresh()}>
      Refresh
    </Button>
  );
}
