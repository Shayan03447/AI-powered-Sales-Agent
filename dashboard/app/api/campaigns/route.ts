import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Campaign } from "@/types";

/** GET = list campaigns created by WF1 (read-only) */
export async function GET() {
  try {
    const rows = await query<Campaign>(
      `SELECT id, business_type, city, status,
              leads_found, leads_inserted, created_at
       FROM campaigns
       ORDER BY id DESC`
    );
    return NextResponse.json({ ok: true, campaigns: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
