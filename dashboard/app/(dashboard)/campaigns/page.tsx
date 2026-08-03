import { query } from "@/lib/db";
import type { Campaign } from "@/types";
import CampaignsTable from "@/components/campaigns/CampaignsTable";
import CampaignsRefresh from "@/components/campaigns/CampaignsRefresh";
import Card from "@/components/ui/Card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Campaigns — Atrium Reach" };

async function getCampaigns() {
  try {
    const rows = await query<Campaign>(
      `SELECT id, business_type, city, status,
              leads_found, leads_inserted, created_at
       FROM campaigns
       WHERE business_type IS NOT NULL
         AND business_type <> ''
         AND city IS NOT NULL
         AND city <> ''
       ORDER BY id DESC
       LIMIT 50`
    );
    const hasRunning = rows.some((c) => c.status === "running");
    return { ok: true as const, campaigns: rows, hasRunning };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, error: message, hasRunning: false };
  }
}

export default async function CampaignsPage() {
  const result = await getCampaigns();

  return (
    <main className="fade-in">
      <div className="page-head">
        <div>
          <p className="eyebrow">Data</p>
          <h1>Campaigns</h1>
          <p className="muted">Search history — showing last 50 campaigns.</p>
        </div>
        <div className="page-head-actions">
          <CampaignsRefresh hasInProgress={result.hasRunning} />
          <Link href="/find-leads" className="btn-primary-link">
            + Find Leads
          </Link>
        </div>
      </div>

      {!result.ok && (
        <Card variant="error">
          <strong>Could not load campaigns</strong>
          <p>{result.error}</p>
        </Card>
      )}

      {result.ok && <CampaignsTable campaigns={result.campaigns} />}
    </main>
  );
}
