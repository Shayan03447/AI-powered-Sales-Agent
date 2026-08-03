import { PageHeadSkeleton } from "@/components/ui/Skeleton";
import Skeleton from "@/components/ui/Skeleton";

export default function DraftsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading drafts"
      style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 72px" }}
    >
      <PageHeadSkeleton />

      {/* Draft card skeletons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              padding: 22,
              background: "var(--bg-elevated)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Draft head: name + badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton width={200} height={20} />
                <Skeleton width={260} height={13} />
              </div>
              <Skeleton width={72} height={22} style={{ borderRadius: "var(--radius-pill)" }} />
            </div>
            <Skeleton width="95%" height={14} />
            <Skeleton width="80%" height={14} />
            <Skeleton width="60%" height={14} />
          </div>
        ))}
      </div>
    </main>
  );
}
