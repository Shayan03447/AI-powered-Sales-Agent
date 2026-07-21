/**
 * n8n workflow triggers from the dashboard.
 */

export type Wf1Payload = {
  businessType: string;
  city: string;
  country?: string;
  source?: "yelp" | "gmb" | "both";
  maxResults?: number;
};

async function postJson(
  url: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text.slice(0, 800) };
}

/** WF1 — Find Leads */
export async function triggerWf1(payload: Wf1Payload): Promise<{
  ok: boolean;
  status: number;
  body: string;
  mode: "webhook" | "form";
}> {
  const webhookUrl = process.env.N8N_WF1_WEBHOOK_URL?.trim();
  const formUrl = process.env.N8N_WF1_FORM_URL?.trim();

  const country = payload.country || "AU";
  const source = payload.source || "both";
  const limit = Math.min(Number(payload.maxResults) || 20, 20);
  const search_query = `${payload.businessType} in ${payload.city}, ${country}`;

  if (webhookUrl) {
    const result = await postJson(webhookUrl, {
      business_type: payload.businessType,
      city: payload.city,
      country,
      location: `${payload.city}, ${country}`,
      source,
      limit,
      search_query,
      started_at: new Date().toISOString(),
    });
    return { ...result, mode: "webhook" };
  }

  if (!formUrl) {
    throw new Error(
      "Add N8N_WF1_WEBHOOK_URL in .env.local (recommended). See PART_2_TEST.md"
    );
  }

  const form = new FormData();
  form.append("Business Type", payload.businessType);
  form.append("City", payload.city);
  form.append("Country", country);
  form.append("Source", source);
  form.append("Max Results", String(limit));

  const res = await fetch(formUrl, { method: "POST", body: form });
  const text = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    body: text.slice(0, 800),
    mode: "form",
  };
}

/**
 * WF2 — Research / Enrichment
 * Webhook only needs to start the workflow; WF2 picks status=new leads from DB.
 */
export async function triggerWf2(options?: {
  batchSize?: number;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const url = process.env.N8N_WF2_WEBHOOK_URL?.trim();

  if (!url) {
    throw new Error(
      "Add N8N_WF2_WEBHOOK_URL in .env.local — see PART_3_TEST.md"
    );
  }

  return postJson(url, {
    trigger: "dashboard",
    batchSize: options?.batchSize ?? 5,
    started_at: new Date().toISOString(),
  });
}

/**
 * WF3 — AI Audit + Email Draft
 * Picks status=enriched leads with email → pending_review
 */
export async function triggerWf3(options?: {
  batchSize?: number;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const url = process.env.N8N_WF3_WEBHOOK_URL?.trim();

  if (!url) {
    throw new Error(
      "Add N8N_WF3_WEBHOOK_URL in .env.local — see PART_4_TEST.md"
    );
  }

  return postJson(url, {
    trigger: "dashboard",
    batchSize: options?.batchSize ?? 3,
    started_at: new Date().toISOString(),
  });
}
