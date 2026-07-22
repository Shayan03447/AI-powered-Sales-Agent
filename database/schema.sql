-- =============================================================================
-- AI-Powered Sales Agent — Complete PostgreSQL Schema
-- Atrium Solution 2026
-- Run once on a fresh database:
--   psql -U postgres -d sales_agent -f schema.sql
-- Safe to re-run on an existing DB (IF NOT EXISTS + ADD COLUMN IF NOT EXISTS).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- CAMPAIGNS — created by WF1 (Lead Discovery)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
    id            SERIAL       PRIMARY KEY,
    business_type VARCHAR(255) NOT NULL,
    city          VARCHAR(255) NOT NULL,
    country       VARCHAR(10)  DEFAULT 'US',
    source        VARCHAR(20)  DEFAULT 'both',      -- 'yelp' | 'gmb' | 'both'
    max_results   INTEGER      DEFAULT 25,
    status        VARCHAR(50)  DEFAULT 'running',   -- 'running' | 'completed' | 'error'
    search_query  TEXT,
    leads_found   INTEGER      DEFAULT 0,
    leads_inserted INTEGER     DEFAULT 0,
    completed_at  TIMESTAMPTZ,
    error_reason  TEXT,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- LEADS — central pipeline table; status drives every workflow
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id                   SERIAL       PRIMARY KEY,

    -- Discovery (WF1)
    source               VARCHAR(50),              -- 'yelp' | 'gmb'
    search_query         TEXT,
    external_id          VARCHAR(255),
    campaign_id          INTEGER      REFERENCES campaigns(id) ON DELETE SET NULL,

    -- Business info
    business_name        VARCHAR(255) NOT NULL,
    category             VARCHAR(255),
    phone                VARCHAR(50),
    address              TEXT,
    city                 VARCHAR(100),
    state                VARCHAR(100),
    country              VARCHAR(10)  DEFAULT 'US',
    rating               DECIMAL(2,1),
    review_count         INTEGER,
    website_url          TEXT,
    google_url           TEXT,

    -- Contact & social (set by WF2 enrichment)
    email                VARCHAR(255),
    linkedin_url         TEXT,
    facebook_url         TEXT,
    instagram_url        TEXT,
    twitter_url          TEXT,
    pages_crawled        INTEGER      DEFAULT 0,
    scraped_html         TEXT,

    -- WF2 PageSpeed scores (overall, from enrichment phase)
    pagespeed_score      INTEGER,
    seo_score            INTEGER,
    mobile_score         INTEGER,

    -- WF3 PageSpeed scores (separate mobile/desktop split, from audit phase)
    pagespeed_mobile     INTEGER,                  -- mobile performance 0-100
    pagespeed_desktop    INTEGER,                  -- desktop performance 0-100

    -- WF2 enrichment pain points + PageSpeed payload / crawl meta
    pain_points          JSONB        DEFAULT '[]'::jsonb,
    performance_json     JSONB,
    crawl_metadata       JSONB        DEFAULT '{}'::jsonb,
    scraperapi_calls     INTEGER      DEFAULT 0,

    -- WF3 audit pain points (website + social, structured)
    website_pain_points  JSONB        DEFAULT '[]'::jsonb,
    social_pain_points   JSONB        DEFAULT '[]'::jsonb,

    -- AI-generated email (also stored in email_drafts; kept here for quick access)
    audit_summary        TEXT,
    email_subject        VARCHAR(500),
    personalized_email   TEXT,

    -- Pipeline state
    -- Valid values: new | enriching | enriched | no_email | no_website |
    --               enrich_failed | auditing | pending_review | approved |
    --               sent | rejected | audit_failed | send_failed
    status               VARCHAR(50)  DEFAULT 'new',
    failure_reason       TEXT,
    retry_count          INTEGER      DEFAULT 0,

    -- Timestamps
    created_at           TIMESTAMPTZ  DEFAULT NOW(),
    enriched_at          TIMESTAMPTZ,
    audited_at           TIMESTAMPTZ,
    sent_at              TIMESTAMPTZ,
    updated_at           TIMESTAMPTZ  DEFAULT NOW()
);

-- Prevent duplicate leads from the same external source
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_external_id
    ON leads(external_id) WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email       ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_city        ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_campaign    ON leads(campaign_id);

-- Fast lookup for WF3 "pick enriched leads with email"
CREATE INDEX IF NOT EXISTS idx_leads_enriched_email
    ON leads(created_at ASC)
    WHERE status = 'enriched' AND email IS NOT NULL AND TRIM(email) <> '';

-- Stuck-lead detection for WF3 recovery
CREATE INDEX IF NOT EXISTS idx_leads_auditing_updated
    ON leads(updated_at)
    WHERE status = 'auditing';

-- ---------------------------------------------------------------------------
-- EMAIL DRAFTS — created by WF3; reviewed by human before WF4 sends
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_drafts (
    id          SERIAL       PRIMARY KEY,
    lead_id     INTEGER      NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    subject     TEXT         NOT NULL,
    body        TEXT         NOT NULL,
    -- 'draft' | 'approved' | 'rejected' | 'sent'
    status      VARCHAR(50)  DEFAULT 'draft',
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_drafts_lead   ON email_drafts(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_status ON email_drafts(status);

-- ---------------------------------------------------------------------------
-- EMAIL LOGS — created by WF4 on every send attempt
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_logs (
    id            SERIAL       PRIMARY KEY,
    lead_id       INTEGER      REFERENCES leads(id) ON DELETE SET NULL,
    draft_id      INTEGER      REFERENCES email_drafts(id) ON DELETE SET NULL,
    email_to      VARCHAR(255),
    email_subject TEXT,
    email_body    TEXT,
    status        VARCHAR(50),                     -- 'sent' | 'failed'
    smtp_response TEXT,
    sent_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_lead ON email_logs(lead_id);

-- ---------------------------------------------------------------------------
-- WORKFLOW LOGS — one row per workflow run, written at end of each execution
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_logs (
    id              SERIAL       PRIMARY KEY,
    workflow_name   VARCHAR(100),
    run_at          TIMESTAMPTZ  DEFAULT NOW(),
    leads_processed INTEGER      DEFAULT 0,
    leads_failed    INTEGER      DEFAULT 0,
    duration_ms     INTEGER      DEFAULT 0,
    notes           TEXT
);

-- Migration guard: add new WF3 columns to existing leads table if they are missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leads' AND column_name = 'pagespeed_mobile') THEN
        ALTER TABLE leads ADD COLUMN pagespeed_mobile INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leads' AND column_name = 'pagespeed_desktop') THEN
        ALTER TABLE leads ADD COLUMN pagespeed_desktop INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leads' AND column_name = 'website_pain_points') THEN
        ALTER TABLE leads ADD COLUMN website_pain_points JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leads' AND column_name = 'social_pain_points') THEN
        ALTER TABLE leads ADD COLUMN social_pain_points JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leads' AND column_name = 'google_url') THEN
        ALTER TABLE leads ADD COLUMN google_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leads' AND column_name = 'pages_crawled') THEN
        ALTER TABLE leads ADD COLUMN pages_crawled INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leads' AND column_name = 'audited_at') THEN
        ALTER TABLE leads ADD COLUMN audited_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leads' AND column_name = 'performance_json') THEN
        ALTER TABLE leads ADD COLUMN performance_json JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leads' AND column_name = 'crawl_metadata') THEN
        ALTER TABLE leads ADD COLUMN crawl_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leads' AND column_name = 'scraperapi_calls') THEN
        ALTER TABLE leads ADD COLUMN scraperapi_calls INTEGER DEFAULT 0;
    END IF;

    -- campaigns: columns added for WF1 error handling and run summary
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaigns' AND column_name = 'leads_inserted') THEN
        ALTER TABLE campaigns ADD COLUMN leads_inserted INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaigns' AND column_name = 'completed_at') THEN
        ALTER TABLE campaigns ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaigns' AND column_name = 'error_reason') THEN
        ALTER TABLE campaigns ADD COLUMN error_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaigns' AND column_name = 'search_query') THEN
        ALTER TABLE campaigns ADD COLUMN search_query TEXT;
    END IF;
END
$$;

COMMIT;
