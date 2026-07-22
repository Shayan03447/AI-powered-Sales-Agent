-- Run once if WF3 fails with "column ... does not exist"
-- psql -U postgres -d sale_agent -f database/migrate_wf3_columns.sql

BEGIN;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS performance_json JSONB,
  ADD COLUMN IF NOT EXISTS crawl_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS scraperapi_calls INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pagespeed_mobile INTEGER,
  ADD COLUMN IF NOT EXISTS pagespeed_desktop INTEGER,
  ADD COLUMN IF NOT EXISTS website_pain_points JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_pain_points JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS audited_at TIMESTAMPTZ;

COMMIT;
