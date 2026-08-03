import { NextResponse } from "next/server";
import { triggerWf4 } from "@/lib/n8n/client";
import { query } from "@/lib/db";

/** Part 6 — start WF4 send for approved leads (Resend via n8n) */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = Number(body.batch_size) || 5;

    const waiting = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM leads l
       WHERE l.status = 'approved'
         AND l.email IS NOT NULL
         AND TRIM(l.email) <> ''
         AND EXISTS (
           SELECT 1
           FROM email_drafts ed
           WHERE ed.lead_id = l.id
             AND ed.status = 'approved'
         )`
    );
    const waitingCount = Number(waiting[0]?.count || 0);

    if (waitingCount === 0) {
      return NextResponse.json({
        ok: false,
        error:
          "No leads ready to send. Approve drafts first (status approved + approved draft).",
      });
    }

    const result = await triggerWf4({ batchSize });

    if (!result.ok) {
      console.error("[send] n8n error:", result.status, result.body);
      return NextResponse.json(
        { ok: false, error: "Email sending service is currently unavailable. Please try again in a moment." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      waiting_count: waitingCount,
      message: `Send started for up to ${batchSize} lead(s). ${waitingCount} approved lead(s) waiting. Check this page / Leads in 1–2 minutes.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
