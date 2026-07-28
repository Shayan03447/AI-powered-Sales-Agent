import { NextResponse } from "next/server";

/** Send (WF4) — not enabled until domain + Resend / Part 6 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Send is not enabled yet. Approve drafts on /drafts; email delivery comes in a later phase.",
    },
    { status: 503 }
  );
}
