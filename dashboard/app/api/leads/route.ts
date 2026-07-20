import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Lead } from "@/types";

/** GET = list leads (optional ?campaign_id=) */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id");

    let rows: Lead[];
    if (campaignId) {
      rows = await query<Lead>(
        `SELECT id, business_name, city, status, website_url, campaign_id
         FROM leads
         WHERE campaign_id = $1
         ORDER BY id DESC`,
        [Number(campaignId)]
      );
    } else {
      rows = await query<Lead>(
        `SELECT id, business_name, city, status, website_url, campaign_id
         FROM leads
         ORDER BY id DESC
         LIMIT 100`
      );
    }

    return NextResponse.json({ ok: true, leads: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
