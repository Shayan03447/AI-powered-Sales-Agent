import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { pickSuburb } from "@/lib/leads/metro-suburbs";
import { triggerWf1 } from "@/lib/n8n/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const businessType = String(body.business_type || "").trim();
    const city = String(body.city || "").trim();
    const country = String(body.country || "AU").trim();
    const source = (body.source || "both") as "yelp" | "gmb" | "both";
    const maxResults = Number(body.max_results) || 20;

    if (!businessType || !city) {
      return NextResponse.json(
        { ok: false, error: "business_type and city are required" },
        { status: 400 }
      );
    }

    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM campaigns
       WHERE LOWER(TRIM(business_type)) = LOWER(TRIM($1))
         AND LOWER(TRIM(city)) = LOWER(TRIM($2))`,
      [businessType, city]
    );
    const campaignCount = Number(countRows[0]?.count || 0);
    const picked = pickSuburb(city, campaignCount);

    const searchQuery = picked
      ? `${businessType} in ${picked.suburb}, ${country}`
      : undefined;
    const location = picked
      ? `${picked.suburb}, ${country}`
      : undefined;

    const result = await triggerWf1({
      businessType,
      city,
      country,
      source,
      maxResults,
      searchQuery,
      location,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `n8n WF1 (${result.mode}) returned HTTP ${result.status}`,
          detail: result.body,
        },
        { status: 502 }
      );
    }

    const rotationNote = picked
      ? ` Search area: ${picked.suburb} (metro rotation #${campaignCount + 1}).`
      : "";

    return NextResponse.json({
      ok: true,
      mode: result.mode,
      suburb: picked?.suburb ?? null,
      search_query: searchQuery ?? `${businessType} in ${city}, ${country}`,
      message:
        "WF1 started via " +
        result.mode +
        ". Wait, then Refresh list. Campaign should show type + city (not empty)." +
        rotationNote,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
