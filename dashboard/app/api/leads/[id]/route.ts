import { NextResponse } from "next/server";

/** Single-lead detail API — not used by current UI */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "Lead detail API is not available yet. Use /leads and /drafts pages.",
    },
    { status: 501 }
  );
}
