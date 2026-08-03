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
      console.error("[find-leads] n8n error:", result.status, result.body);
      return NextResponse.json(
        { ok: false, error: "Search service is currently unavailable. Please try again in a moment." },
        { status: 502 }
      );
    }

    const rotationNote = picked
      ? ` Searching in ${picked.suburb} (area rotation #${campaignCount + 1}).`
      : "";

    return NextResponse.json({
      ok: true,
      suburb: picked?.suburb ?? null,
      search_query: searchQuery ?? `${businessType} in ${city}, ${country}`,
      message:
        `Search started.${rotationNote} Results will appear on the Campaigns and Leads pages in 1–3 minutes — use the Refresh button to check.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
