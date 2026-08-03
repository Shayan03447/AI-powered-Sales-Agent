import { PageHeadSkeleton } from "@/components/ui/Skeleton";
import Skeleton from "@/components/ui/Skeleton";

export default function ResearchLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading research page"
      style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 72px" }}
    >
      <PageHeadSkeleton />
      {/* Card skeleton matching StartResearchButton card */}
      <div
        style={{
          marginTop: 18,
          padding: 22,
          background: "var(--bg-elevated)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          maxWidth: 560,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
        aria-hidden="true"
      >
        <Skeleton width="45%" height={20} />
        <Skeleton width="90%" height={14} />
        <Skeleton width="70%" height={14} />
        <Skeleton width={160} height={40} style={{ borderRadius: "var(--radius-md)" }} />
      </div>
    </main>
  );
}
