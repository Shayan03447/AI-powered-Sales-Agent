import Skeleton from "@/components/ui/Skeleton";

export default function FindLeadsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading Find Leads page"
      style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 72px" }}
    >
      {/* Page heading skeleton */}
      <Skeleton width="10%" height={12} style={{ marginBottom: 8 }} />
      <Skeleton width="25%" height={28} style={{ marginBottom: 10 }} />
      <Skeleton width="55%" height={14} />

      {/* Form card skeleton */}
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
          gap: 18,
        }}
        aria-hidden="true"
      >
        <Skeleton width="35%" height={20} />
        <Skeleton width="80%" height={14} />
        {/* Field skeletons */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width="30%" height={13} />
            <Skeleton width="100%" height={38} style={{ borderRadius: "var(--radius-md)" }} />
          </div>
        ))}
        <Skeleton width={160} height={40} style={{ borderRadius: "var(--radius-md)" }} />
      </div>
    </main>
  );
}
