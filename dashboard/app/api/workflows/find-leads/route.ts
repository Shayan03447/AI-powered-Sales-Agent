import { NextResponse } from "next/server";
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

    const result = await triggerWf1({
      businessType,
      city,
      country,
      source,
      maxResults,
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

    return NextResponse.json({
      ok: true,
      mode: result.mode,
      message:
        "WF1 started via " +
        result.mode +
        ". Wait, then Refresh list. Campaign should show type + city (not empty).",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
