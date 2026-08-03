import { query } from "@/lib/db";
import StartAiDraftButton from "@/components/workflow/StartAiDraftButton";
import ResearchRefresh from "@/components/workflow/ResearchRefresh";
import Card from "@/components/ui/Card";
import EmptyState, { DraftIcon } from "@/components/ui/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "AI Draft — Atrium Reach" };

async function getWaitingCount() {
  try {
    const [enriched, auditing] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM leads
         WHERE status = 'enriched'
           AND email IS NOT NULL
           AND TRIM(email) <> ''`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM leads
         WHERE status = 'auditing'`
      ),
    ]);
    return {
      ok: true as const,
      count: Number(enriched[0]?.count || 0),
      auditingCount: Number(auditing[0]?.count || 0),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, error: message, count: 0, auditingCount: 0 };
  }
}

export default async function AiDraftPage() {
  const result = await getWaitingCount();
  const hasInProgress = result.ok && result.auditingCount > 0;

  return (
    <main className="fade-in">
      <div className="page-head">
        <div>
          <p className="eyebrow">Step 3</p>
          <h1>AI Draft</h1>
          <p className="muted">
            Generate personalized email drafts — results appear on the Drafts page.
          </p>
        </div>
        <ResearchRefresh hasInProgress={hasInProgress} inProgressLabel="Drafting…" />
      </div>

      {/* Only show error — no action card when DB is unreachable */}
      {!result.ok && (
        <Card variant="error">
          <strong>Could not read queue</strong>
          <p>{result.error}</p>
        </Card>
      )}

      {/* Banner when AI is actively generating drafts */}
      {result.ok && result.auditingCount > 0 && (
        <div className="banner banner-loading">
          {result.auditingCount} lead{result.auditingCount !== 1 ? "s" : ""} currently being drafted. Refresh to see updates.
        </div>
      )}

      {/* Empty state — no enriched leads with email */}
      {result.ok && result.count === 0 && result.auditingCount === 0 && (
        <EmptyState
          icon={<DraftIcon />}
          title="No leads ready for AI drafting"
          description="You need enriched leads with an email address. Run Research on your new leads first."
          action={
            <Link href="/research" className="btn-primary-link">
              Go to Research
            </Link>
          }
        />
      )}

      {/* Action card — only when leads are available */}
      {result.ok && result.count > 0 && (
        <StartAiDraftButton waitingCount={result.count} />
      )}
    </main>
  );
}
