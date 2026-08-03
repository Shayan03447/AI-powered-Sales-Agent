import { PageHeadSkeleton } from "@/components/ui/Skeleton";
import Skeleton from "@/components/ui/Skeleton";

export default function SendLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading send page"
      style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 72px" }}
    >
      <PageHeadSkeleton />

      {/* Send action card */}
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
        <Skeleton width="55%" height={20} />
        <Skeleton width="90%" height={14} />
        <Skeleton width="50%" height={14} />
        <Skeleton width={150} height={40} style={{ borderRadius: "var(--radius-md)" }} />
      </div>

      {/* Recent send status table card */}
      <div
        style={{
          marginTop: 18,
          padding: 22,
          background: "var(--bg-elevated)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
        aria-hidden="true"
      >
        <Skeleton width={180} height={18} />
        <Skeleton width={300} height={13} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", gap: 16, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <Skeleton style={{ flex: 2 }} height={14} />
            <Skeleton style={{ flex: 2 }} height={14} />
            <Skeleton width={72} height={20} style={{ borderRadius: "var(--radius-pill)" }} />
            <Skeleton style={{ flex: 1 }} height={14} />
          </div>
        ))}
      </div>
    </main>
  );
}
