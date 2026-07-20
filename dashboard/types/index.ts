/** Shared types */

export type Lead = {
  id: number;
  business_name: string;
  city: string | null;
  status: string;
  website_url: string | null;
  campaign_id?: number | null;
  email?: string | null;
  pagespeed_score?: number | null;
  seo_score?: number | null;
  mobile_score?: number | null;
  failure_reason?: string | null;
};

export type Campaign = {
  id: number;
  business_type: string;
  city: string;
  status: string;
  leads_found: number;
  leads_inserted: number;
  created_at: string;
};
