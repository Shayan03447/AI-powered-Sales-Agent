import Skeleton from "@/components/ui/Skeleton";

export default function AiDraftLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading AI Draft page"
      style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 72px" }}
    >
      {/* Page title area */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }} aria-hidden="true">
        <Skeleton width={60} height={11} />
        <Skeleton width={160} height={28} />
        <Skeleton width={300} height={14} />
      </div>

      {/* Action card skeleton */}
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
        <Skeleton width="50%" height={20} />
        <Skeleton width="85%" height={14} />
        <Skeleton width="60%" height={14} />
        <Skeleton width={160} height={40} style={{ borderRadius: "var(--radius-md)" }} />
      </div>
    </main>
  );
}
