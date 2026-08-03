/**
 * Home page loading skeleton — shown by Next.js while page.tsx awaits
 * getPipelineCounts(). Matches the layout of the real home page.
 */
import { DashboardCardSkeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading dashboard"
      style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 72px" }}
    >
      <DashboardCardSkeleton />
    </main>
  );
}
