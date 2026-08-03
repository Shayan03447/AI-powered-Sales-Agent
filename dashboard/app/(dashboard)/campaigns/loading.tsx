/**
 * Campaigns page loading skeleton — shown by Next.js while campaigns/page.tsx
 * fetches from the database. Mirrors the real page header + table layout.
 */
import { PageHeadSkeleton, CampaignsTableSkeleton } from "@/components/ui/Skeleton";

export default function CampaignsLoading() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 72px" }}>
      <PageHeadSkeleton />
      <CampaignsTableSkeleton rows={5} />
    </main>
  );
}
