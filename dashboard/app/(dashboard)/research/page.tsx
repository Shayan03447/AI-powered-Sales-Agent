import { query } from "@/lib/db";
import StartResearchButton from "@/components/workflow/StartResearchButton";
import ResearchRefresh from "@/components/workflow/ResearchRefresh";
import Card from "@/components/ui/Card";
import EmptyState, { ResearchIcon } from "@/components/ui/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getWaitingCount() {
  try {
    const [waiting, enriching] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM leads
         WHERE status = 'new'
           AND website_url IS NOT NULL
           AND TRIM(website_url) <> ''`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM leads
         WHERE status = 'enriching'`
      ),
    ]);
    return {
      ok: true as const,
      count: Number(waiting[0]?.count || 0),
      enrichingCount: Number(enriching[0]?.count || 0),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, error: message, count: 0, enrichingCount: 0 };
  }
}

export const metadata = { title: "Research — Atrium Reach" };

export default async function ResearchPage() {
  const result = await getWaitingCount();
  const hasInProgress = result.ok && result.enrichingCount > 0;

  return (
    <main className="fade-in">
      <div className="page-head">
        <div>
          <p className="eyebrow">Step 2</p>
          <h1>Research</h1>
          <p className="muted">
            Enrich new leads — results appear on the Leads page.
          </p>
        </div>
        <ResearchRefresh hasInProgress={hasInProgress} />
      </div>

      {!result.ok && (
        <Card variant="error">
          <strong>Could not read queue</strong>
          <p>{result.error}</p>
        </Card>
      )}

      {/* Show enriching progress note when research is actively running */}
      {result.ok && result.enrichingCount > 0 && (
        <div className="banner banner-loading">
          {result.enrichingCount} lead{result.enrichingCount !== 1 ? "s" : ""} currently being enriched. Refresh to see updates.
        </div>
      )}

      {/* EmptyState: no new leads and nothing enriching */}
      {result.ok && result.count === 0 && result.enrichingCount === 0 && (
        <EmptyState
          icon={<ResearchIcon />}
          title="No leads ready for research"
          description="You need leads with status 'new' and a website URL. Find more leads to continue."
          action={
            <Link href="/find-leads" className="btn-primary-link">
              Find Leads
            </Link>
          }
        />
      )}

      {/* Only show the action card when there are leads to process */}
      {result.ok && result.count > 0 && (
        <StartResearchButton waitingCount={result.count} />
      )}
    </main>
  );
}
