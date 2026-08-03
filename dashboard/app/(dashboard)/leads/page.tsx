import { query } from "@/lib/db";
import type { Lead } from "@/types";
import LeadsTable from "@/components/leads/LeadsTable";
import LeadsRefresh from "@/components/leads/LeadsRefresh";
import Card from "@/components/ui/Card";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Leads — Atrium Reach" };

async function getLeads(campaignId: number | null) {
  try {
    if (campaignId) {
      const rows = await query<Lead>(
        `SELECT id, business_name, city, status, website_url, campaign_id,
                email, pagespeed_score, seo_score, mobile_score, failure_reason
         FROM leads
         WHERE campaign_id = $1
         ORDER BY id DESC
         LIMIT 100`,
        [campaignId]
      );
      return { ok: true as const, leads: rows };
    }

    const rows = await query<Lead>(
      `SELECT id, business_name, city, status, website_url, campaign_id,
              email, pagespeed_score, seo_score, mobile_score, failure_reason
       FROM leads
       ORDER BY id DESC
       LIMIT 100`
    );
    return { ok: true as const, leads: rows };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, error: message };
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign_id?: string }>;
}) {
  const params = await searchParams;
  const campaignId = params.campaign_id
    ? Number(params.campaign_id)
    : null;
  const result = await getLeads(
    campaignId && !Number.isNaN(campaignId) ? campaignId : null
  );

  const hasInProgress =
    result.ok && result.leads.some((l) => l.status === "enriching");

  return (
    <main className="fade-in">
      <div className="page-head">
        <div>
          <p className="eyebrow">Data</p>
          <h1>Leads</h1>
          <p className="muted">
            {campaignId
              ? `Showing leads for campaign #${campaignId}`
              : "All leads across every campaign — showing last 100."}
          </p>
        </div>
        <div className="page-head-actions">
          <LeadsRefresh hasInProgress={!!hasInProgress} />
          {campaignId && (
            <Link href="/leads" className="btn-secondary-link">
              Show all
            </Link>
          )}
          <Link href="/research" className="btn-secondary-link">
            Research
          </Link>
          <Link href="/find-leads" className="btn-primary-link">
            + Find Leads
          </Link>
        </div>
      </div>

      {!result.ok && (
        <Card variant="error">
          <strong>Could not load leads</strong>
          <p>{result.error}</p>
        </Card>
      )}

      {result.ok && <LeadsTable leads={result.leads} />}
    </main>
  );
}
