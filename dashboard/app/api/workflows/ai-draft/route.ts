import { NextResponse } from "next/server";
import { triggerWf3 } from "@/lib/n8n/client";
import { query } from "@/lib/db";

/** Part 4 — start WF3 AI audit + email draft for enriched leads */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = Number(body.batch_size) || 1;

    const waiting = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM leads
       WHERE status = 'enriched'
         AND email IS NOT NULL
         AND TRIM(email) <> ''`
    );
    const waitingCount = Number(waiting[0]?.count || 0);

    if (waitingCount === 0) {
      return NextResponse.json({
        ok: false,
        error:
          "No leads ready for AI draft. Research must finish first (status enriched + email).",
      });
    }

    const result = await triggerWf3({ batchSize });

    if (!result.ok) {
      console.error("[ai-draft] n8n error:", result.status, result.body);
      return NextResponse.json(
        { ok: false, error: "AI drafting service is currently unavailable. Please try again in a moment." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      waiting_count: waitingCount,
      message: `AI draft started for up to ${batchSize} lead(s). ${waitingCount} enriched lead(s) waiting. Check Drafts in 1–3 minutes.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
