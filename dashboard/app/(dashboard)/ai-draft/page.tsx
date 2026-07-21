import { query } from "@/lib/db";
import StartAiDraftButton from "@/components/workflow/StartAiDraftButton";

export const dynamic = "force-dynamic";

async function getWaitingCount() {
  try {
    const rows = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM leads
       WHERE status = 'enriched'
         AND email IS NOT NULL
         AND TRIM(email) <> ''`
    );
    return { ok: true as const, count: Number(rows[0]?.count || 0) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, error: message, count: 0 };
  }
}

export default async function AiDraftPage() {
  const result = await getWaitingCount();

  return (
    <main className="fade-in">
      <p className="eyebrow">Step 3</p>
      <h1>AI Draft</h1>
      <p className="muted">
        Create audit + email drafts — button only (results on Drafts)
      </p>

      {!result.ok && (
        <div className="card error-box">
          <strong>Could not read queue</strong>
          <p>{result.error}</p>
        </div>
      )}

      <StartAiDraftButton waitingCount={result.count} />
    </main>
  );
}
