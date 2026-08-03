/**
 * Leads page loading skeleton — shown by Next.js while leads/page.tsx
 * fetches from the database. Mirrors the real page header + table layout.
 */
import { PageHeadSkeleton, LeadsTableSkeleton } from "@/components/ui/Skeleton";

export default function LeadsLoading() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 72px" }}>
      <PageHeadSkeleton />
      <LeadsTableSkeleton rows={8} />
    </main>
  );
}
