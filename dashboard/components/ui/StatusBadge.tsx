export default function StatusBadge({ status }: { status: string }) {
  const key = (status || "unknown").toLowerCase();
  return <span className={`badge badge-${key}`}>{status || "unknown"}</span>;
}
