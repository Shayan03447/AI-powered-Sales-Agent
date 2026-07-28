import { query } from "@/lib/db";

export type PipelineCounts = {
  newReady: number;
  enrichedReady: number;
  pendingReview: number;
  approved: number;
};

export async function getPipelineCounts(): Promise<
  { ok: true; counts: PipelineCounts } | { ok: false; error: string; counts: PipelineCounts }
> {
  const empty: PipelineCounts = {
    newReady: 0,
    enrichedReady: 0,
    pendingReview: 0,
    approved: 0,
  };

  try {
    const rows = await query<{
      new_ready: string;
      enriched_ready: string;
      pending_review: string;
      approved: string;
    }>(
      `SELECT
         COUNT(*) FILTER (
           WHERE status = 'new'
             AND website_url IS NOT NULL
             AND TRIM(website_url) <> ''
         )::text AS new_ready,
         COUNT(*) FILTER (
           WHERE status = 'enriched'
             AND email IS NOT NULL
             AND TRIM(email) <> ''
         )::text AS enriched_ready,
         COUNT(*) FILTER (
           WHERE status = 'pending_review'
         )::text AS pending_review,
         COUNT(*) FILTER (
           WHERE status = 'approved'
         )::text AS approved
       FROM leads`
    );

    const r = rows[0];
    return {
      ok: true,
      counts: {
        newReady: Number(r?.new_ready || 0),
        enrichedReady: Number(r?.enriched_ready || 0),
        pendingReview: Number(r?.pending_review || 0),
        approved: Number(r?.approved || 0),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message, counts: empty };
  }
}
