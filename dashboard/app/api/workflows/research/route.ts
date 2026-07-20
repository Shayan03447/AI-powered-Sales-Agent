import { NextResponse } from "next/server";
import { triggerWf2 } from "@/lib/n8n/client";
import { query } from "@/lib/db";

/** Part 3 — start WF2 enrichment for leads with status = new */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = Number(body.batch_size) || 5;

    const waiting = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM leads
       WHERE status = 'new'
         AND website_url IS NOT NULL
         AND TRIM(website_url) <> ''`
    );
    const waitingCount = Number(waiting[0]?.count || 0);

    if (waitingCount === 0) {
      return NextResponse.json({
        ok: false,
        error:
          "No leads ready for research. Find Leads first (status must be new with a website).",
      });
    }

    const result = await triggerWf2({ batchSize });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `n8n WF2 returned HTTP ${result.status}`,
          detail: result.body,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      waiting_count: waitingCount,
      message: `Research started for up to ${batchSize} lead(s). ${waitingCount} lead(s) were waiting. Check Leads page in 1–3 minutes.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
