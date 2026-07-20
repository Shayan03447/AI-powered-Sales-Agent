import { query } from "@/lib/db";
import StartResearchButton from "@/components/workflow/StartResearchButton";

export const dynamic = "force-dynamic";

async function getWaitingCount() {
  try {
    const rows = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM leads
       WHERE status = 'new'
         AND website_url IS NOT NULL
         AND TRIM(website_url) <> ''`
    );
    return { ok: true as const, count: Number(rows[0]?.count || 0) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, error: message, count: 0 };
  }
}

export default async function ResearchPage() {
  const result = await getWaitingCount();

  return (
    <main className="fade-in">
      <p className="eyebrow">Step 2</p>
      <h1>Research</h1>
      <p className="muted">
        Enrich new leads — button only (results on Leads table)
      </p>

      {!result.ok && (
        <div className="card error-box">
          <strong>Could not read queue</strong>
          <p>{result.error}</p>
        </div>
      )}

      <StartResearchButton waitingCount={result.count} />
    </main>
  );
}
