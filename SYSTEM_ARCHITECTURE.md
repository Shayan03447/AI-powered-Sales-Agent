# Autonomous Multi-Channel AI Outbound Agent
## Complete System Architecture — High Level Design

> **Stack:** n8n (Self-Hosted) · PostgreSQL · ScraperAPI · Google PageSpeed Insights API · OpenAI/Claude · SMTP Email
> **Last Updated:** 2026-06-05

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Philosophy](#2-architecture-philosophy)
3. [Database Schema (PostgreSQL)](#3-database-schema-postgresql)
4. [Lead Status State Machine](#4-lead-status-state-machine)
5. [Workflow 1 — Lead Generation & Data Storage](#5-workflow-1--lead-generation--data-storage)
6. [Workflow 2 — Data Enrichment & Web Crawling](#6-workflow-2--data-enrichment--web-crawling)
7. [Workflow 3 — AI Audit & Email Personalization](#7-workflow-3--ai-audit--email-personalization)
8. [Workflow 4 — Outbound Email Sending](#8-workflow-4--outbound-email-sending)
9. [External API Integrations](#9-external-api-integrations)
10. [Parallel Processing Model in n8n](#10-parallel-processing-model-in-n8n)
11. [Data Flow — End to End](#11-data-flow--end-to-end)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Scalability Considerations](#13-scalability-considerations)

---

## 1. System Overview

This system is a **fully autonomous outbound sales agent** that:

1. **Finds** businesses from Yelp / Google My Business using search parameters
2. **Researches** each business — scrapes their website, collects performance metrics, extracts emails
3. **Audits** the business website using AI — identifies problems and opportunities
4. **Crafts** a hyper-personalized cold email based on the audit findings
5. **Sends** the email automatically via SMTP

**Zero human intervention required** after initial setup. Every lead moves through the pipeline automatically based on its status in the PostgreSQL database.

```
┌─────────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                           │
│              (Shared State — The Backbone)                      │
└────────┬────────────┬─────────────┬──────────────┬─────────────┘
         │            │             │              │
         ▼            ▼             ▼              ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
   │Workflow 1│ │Workflow 2│ │Workflow 3│ │  Workflow 4  │
   │          │ │          │ │          │ │              │
   │  Lead    │ │   Data   │ │ AI Audit │ │   Email      │
   │Generation│ │Enrichment│ │  & Msg   │ │   Sending    │
   │& Storage │ │& Crawling│ │  Crafting│ │              │
   └──────────┘ └──────────┘ └──────────┘ └──────────────┘
```

---

## 2. Architecture Philosophy

### Why Parallel Independent Workflows?

Each workflow is **fully independent** — they do NOT call each other directly. They communicate exclusively through the database using **status flags**.

This design gives you:

| Benefit | Explanation |
|---|---|
| **Fault Isolation** | If Workflow 2 crashes, Workflow 1 keeps running. No cascade failures. |
| **Resumability** | After any crash, workflows pick up exactly where they left off using DB state |
| **Scalability** | Each workflow can be scaled independently (more frequent schedules, batch sizes) |
| **Observability** | Every lead has a traceable status — you always know where it is in the pipeline |
| **Decoupled Speed** | Slow enrichment does not block fast lead generation |

### The Database as a Queue

PostgreSQL acts as both a **data store** and a **job queue**. Each workflow queries for records matching a specific status, processes them, then updates the status to hand off to the next stage.

```
status: "new"        → picked up by Workflow 2
status: "enriched"   → picked up by Workflow 3
status: "approved"   → picked up by Workflow 4
status: "sent"       → terminal state
status: "failed"     → retry or manual review
```

---

## 3. Database Schema (PostgreSQL)

### Table: `leads`

```sql
CREATE TABLE leads (
    id                  SERIAL PRIMARY KEY,

    -- Source Info
    source              VARCHAR(50),        -- 'yelp' | 'gmb'
    search_query        TEXT,               -- the search param used to find this lead
    external_id         VARCHAR(255),       -- Yelp business ID or GMB place ID

    -- Business Info
    business_name       VARCHAR(255) NOT NULL,
    category            VARCHAR(255),
    phone               VARCHAR(50),
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(10)  DEFAULT 'US',
    rating              DECIMAL(2,1),
    review_count        INTEGER,
    website_url         TEXT,

    -- Enrichment Data (filled by Workflow 2)
    email               VARCHAR(255),
    linkedin_url        TEXT,
    facebook_url        TEXT,
    instagram_url       TEXT,
    twitter_url         TEXT,
    scraped_html        TEXT,               -- raw HTML (optional, for AI context)

    -- Performance Metrics (filled by Workflow 2)
    pagespeed_score     INTEGER,            -- 0-100
    seo_score           INTEGER,            -- 0-100
    mobile_score        INTEGER,            -- 0-100
    performance_json    JSONB,              -- full PageSpeed API response

    -- AI Audit (filled by Workflow 3)
    audit_summary       TEXT,               -- AI-generated website audit
    personalized_email  TEXT,               -- AI-crafted cold email body
    email_subject       VARCHAR(500),       -- AI-crafted subject line

    -- Pipeline Status
    status              VARCHAR(50)  DEFAULT 'new',
    failure_reason      TEXT,
    retry_count         INTEGER      DEFAULT 0,

    -- Timestamps
    created_at          TIMESTAMPTZ  DEFAULT NOW(),
    enriched_at         TIMESTAMPTZ,
    audited_at          TIMESTAMPTZ,
    sent_at             TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ  DEFAULT NOW()
);
```

### Table: `email_logs`

```sql
CREATE TABLE email_logs (
    id              SERIAL PRIMARY KEY,
    lead_id         INTEGER REFERENCES leads(id),
    email_to        VARCHAR(255),
    email_subject   TEXT,
    email_body      TEXT,
    status          VARCHAR(50),    -- 'sent' | 'bounced' | 'failed'
    smtp_response   TEXT,
    sent_at         TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `workflow_logs`

```sql
CREATE TABLE workflow_logs (
    id              SERIAL PRIMARY KEY,
    workflow_name   VARCHAR(100),   -- 'lead_generation' | 'enrichment' | 'audit' | 'email'
    run_at          TIMESTAMPTZ DEFAULT NOW(),
    leads_processed INTEGER,
    leads_failed    INTEGER,
    duration_ms     INTEGER,
    notes           TEXT
);
```

### Indexes for Performance

```sql
CREATE INDEX idx_leads_status      ON leads(status);
CREATE INDEX idx_leads_email       ON leads(email);
CREATE INDEX idx_leads_created_at  ON leads(created_at);
CREATE INDEX idx_leads_city        ON leads(city);
```

---

## 4. Lead Status State Machine

```
                    ┌─────────────┐
                    │   [START]   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    "new"    │  ← Inserted by Workflow 1
                    └──────┬──────┘
                           │
              Workflow 2 picks up
                           │
              ┌────────────▼───────────────┐
              │  Scrape + PageSpeed + Email │
              └────────────┬───────────────┘
                           │
               ┌───────────┴───────────┐
               │                       │
               ▼                       ▼
       ┌──────────────┐       ┌─────────────────┐
       │  "enriched"  │       │ "enrich_failed"  │
       └──────┬───────┘       └─────────────────┘
              │
  Workflow 3 picks up
              │
   ┌──────────▼───────────┐
   │  AI Audit + Email    │
   │  Personalization     │
   └──────────┬───────────┘
              │
  ┌───────────┴────────────┐
  │                        │
  ▼                        ▼
┌──────────────┐   ┌──────────────────┐
│  "approved"  │   │  "audit_failed"  │
└──────┬───────┘   └──────────────────┘
       │
  Workflow 4 picks up
       │
  ┌────▼─────────────────┐
  │   Send Email via SMTP │
  └────┬─────────────────┘
       │
  ┌────┴─────┐  ┌──────────────┐
  │  "sent"  │  │ "send_failed"│
  └──────────┘  └──────────────┘
```

---

## 5. Workflow 1 — Lead Generation & Data Storage

**Trigger:** Schedule (e.g., every 6 hours)
**Purpose:** Discover new businesses and insert them into the database

### n8n Node Flow

```
[Schedule Trigger]
       ↓
[Set Node] — define search parameters
  • keyword: "plumber" / "dentist" / "restaurant"
  • location: "New York" / "Houston"
  • source: "yelp" or "gmb"
       ↓
[HTTP Request] — call Yelp Fusion API or GMB Places API
  • Yelp: GET https://api.yelp.com/v3/businesses/search
  • GMB:  GET https://maps.googleapis.com/maps/api/place/textsearch/json
       ↓
[SplitOut Node] — split the "businesses" array into individual items
       ↓
[Postgres Node — SELECT check] — check if external_id already exists
  • Query: SELECT id FROM leads WHERE external_id = '{{ $json.id }}'
       ↓
[IF Node] — does record already exist?
  │
  ├── YES → [NoOp] — skip, already in DB
  │
  └── NO  → [Postgres Node — INSERT]
                INSERT INTO leads (
                  source, external_id, business_name,
                  category, phone, address, city,
                  state, website_url, rating, review_count,
                  search_query, status
                ) VALUES (...)
```

### Yelp API Parameters

```
GET https://api.yelp.com/v3/businesses/search
Headers:
  Authorization: Bearer {YELP_API_KEY}
Params:
  term     = "plumber"
  location = "Houston, TX"
  limit    = 50
  offset   = 0    ← increment for pagination
```

### GMB / Google Places API Parameters

```
GET https://maps.googleapis.com/maps/api/place/textsearch/json
Params:
  query  = "plumbers in Houston TX"
  key    = {GOOGLE_API_KEY}
```

---

## 6. Workflow 2 — Data Enrichment & Web Crawling

<!-- 2026-06-12 22:38 UTC+5 -->

**Trigger:** Schedule (every 10 minutes)
**Purpose:** Scrape business websites, collect performance metrics, extract contact emails and social links
**Batch Size:** 10 leads per run
**Input Status:** `new`
**Output Status:** `enriched` | `enrich_failed` | `no_email`

---

### Design Principles for Production Reliability

| Principle | Implementation |
|---|---|
| **No double-processing** | `SELECT … FOR UPDATE SKIP LOCKED` prevents two overlapping runs grabbing the same lead |
| **Atomic status gate** | Status is set to `enriching` (in-flight) immediately after SELECT, before any external call |
| **Parallel API calls** | ScraperAPI and PageSpeed run at the same time via n8n `Merge` node |
| **Graceful degradation** | Missing email → `no_email` (not a hard failure); missing PageSpeed → scores stored as `null` |
| **Idempotency** | Re-running on the same lead after a crash is safe — UPDATE is upsert-style |
| **Retry budget** | Up to 3 automatic retries; then `enrich_failed` for manual review |
| **Workflow audit log** | Every run writes a row to `workflow_logs` with counts and duration |

---

### Complete n8n Node Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  WORKFLOW 2 — DATA ENRICHMENT & WEB CRAWLING                     │
│  Trigger: Every 10 minutes                                        │
└──────────────────────────────────────────────────────────────────┘

[Schedule Trigger]  ← runs every 10 minutes
       │
       ▼
[Set Node — Run Metadata]
  • run_start_ts  = NOW()
  • batch_size    = 10
  • workflow_name = "enrichment"
       │
       ▼
[Postgres Node — SELECT batch with lock]
  ┌──────────────────────────────────────────────────────┐
  │  BEGIN;                                               │
  │  SELECT id, business_name, website_url,               │
  │         retry_count, city, category                   │
  │  FROM   leads                                         │
  │  WHERE  status = 'new'                                │
  │    AND  retry_count < 3                               │
  │  ORDER  BY created_at ASC                             │
  │  LIMIT  10                                            │
  │  FOR UPDATE SKIP LOCKED;                              │
  └──────────────────────────────────────────────────────┘
       │
       ▼
[IF Node — any rows returned?]
  │
  ├── NO (0 rows) ──→ [Postgres INSERT workflow_logs]
  │                     leads_processed=0, notes='no new leads'
  │                   [Stop — nothing to do this run]
  │
  └── YES ──────────→
              │
              ▼
       [Postgres UPDATE — mark batch as in-flight]
         UPDATE leads
         SET    status     = 'enriching',
                updated_at = NOW()
         WHERE  id IN ({{ $json.ids }})
              │
              ▼
       [SplitOut Node]  ← one item per lead
              │
              ▼
       ┌──────────────────────────────────────────────────┐
       │         PARALLEL ENRICHMENT BRANCH               │
       │  (n8n executes both paths for each lead item)    │
       └──────────────────────────────────────────────────┘
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
  [Branch A]    [Branch B]
  ScraperAPI    PageSpeed API
  Web Crawl     Performance Metrics
       │             │
       └──────┬──────┘
              │
              ▼
       [Merge Node — Wait for both branches]
         Mode: "Merge By Index"
         (combines scraped HTML + PageSpeed JSON per lead)
              │
              ▼
       [Code Node — Extract Emails & Socials]
         (see full JS below)
              │
              ▼
       [IF Node — was email found?]
         │
         ├── NO  → [Postgres UPDATE]
         │           status         = 'no_email',
         │           enriched_at    = NOW(),
         │           updated_at     = NOW()
         │         [Continue to next lead]
         │
         └── YES → [Postgres UPDATE — save all enrichment]
                     email           = extracted_email,
                     linkedin_url    = ...,
                     facebook_url    = ...,
                     instagram_url   = ...,
                     twitter_url     = ...,
                     scraped_html    = cleaned_html,
                     pagespeed_score = ...,
                     seo_score       = ...,
                     mobile_score    = ...,
                     performance_json= ...,
                     status          = 'enriched',
                     enriched_at     = NOW(),
                     updated_at      = NOW()
              │
              ▼
       [Postgres INSERT — workflow_logs]
         workflow_name   = 'enrichment',
         leads_processed = {{ success_count }},
         leads_failed    = {{ fail_count }},
         duration_ms     = NOW() - run_start_ts
```

---

### Branch A — Website Scraping via ScraperAPI

```
[HTTP Request Node — ScraperAPI]
  Method:  GET
  URL:     https://api.scraperapi.com/
  Params:
    api_key        = {{ $credentials.scraperApiKey }}
    url            = {{ $json.website_url }}
    render         = true          ← execute JavaScript (for SPAs)
    premium        = false         ← set true if site blocks scrapers
    country_code   = us
    keep_headers   = false
  Timeout: 30000 ms
  Retry on Fail: true  (max 2 retries, 1000ms wait)
       │
       ▼
[IF Node — HTTP status = 200?]
  │
  ├── NO  → [Set Node]  scraped_html = null,  scrape_error = response.status
  │
  └── YES → [Set Node]  scraped_html = {{ $response.body }}
                        (raw HTML passed to Code Node downstream)
```

> **Fallback:** If ScraperAPI fails after 2 retries the lead is NOT immediately failed.
> It proceeds with `scraped_html = null` — PageSpeed data and any email in the URL domain
> are still captured. Only if BOTH branches fail does the status become `enrich_failed`.

---

### Branch B — Google PageSpeed Insights API

```
[HTTP Request Node — PageSpeed Insights]
  Method:  GET
  URL:     https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  Params:
    url      = {{ $json.website_url }}
    key      = {{ $credentials.googleApiKey }}
    strategy = mobile          ← always test mobile first
    category = PERFORMANCE
    category = SEO
    category = ACCESSIBILITY
  Timeout: 25000 ms
  Retry on Fail: true  (max 2 retries, 2000ms wait)
       │
       ▼
[Code Node — Parse PageSpeed Response]
  // Extract the three scores from the Lighthouse result
  const cats = $input.item.json.lighthouseResult.categories;

  return {
    pagespeed_score : Math.round((cats.performance?.score  ?? 0) * 100),
    seo_score       : Math.round((cats.seo?.score          ?? 0) * 100),
    mobile_score    : Math.round((cats.accessibility?.score ?? 0) * 100),
    performance_json: $input.item.json   // store full response as JSONB
  };
```

> **Free tier:** 25,000 requests/day — sufficient for ~2,500 leads/day at the 10-lead
> batch cadence (144 runs × 10 leads = 1,440 leads/day max).

---

### Code Node — Email & Social Link Extractor

This is the most critical JS in Workflow 2. It runs after Merge.

```javascript
// Code Node: "Extract Emails & Socials"
// Runs AFTER the Merge node; receives both scraped HTML and PageSpeed data
// 2026-06-12 22:38 UTC+5

const item   = $input.item.json;
const html   = item.scraped_html ?? '';
const url    = item.website_url  ?? '';

// ── 1. Email extraction ───────────────────────────────────────────
const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const rawEmails  = html.match(emailRegex) ?? [];

// Filter out false positives (image files, CDN hashes, noreply, etc.)
const BLOCKLIST = ['noreply', 'no-reply', 'donotreply', 'example',
                   '.png', '.jpg', '.gif', '.svg', 'sentry.io',
                   'wix.com', 'wordpress.org'];

const cleanEmails = [...new Set(rawEmails)].filter(e => {
  const lower = e.toLowerCase();
  return !BLOCKLIST.some(b => lower.includes(b)) && e.length < 100;
});

// Prefer contact/info/hello emails over generic ones
const priority  = ['contact', 'info', 'hello', 'sales', 'support'];
const bestEmail = cleanEmails.find(e =>
  priority.some(p => e.toLowerCase().startsWith(p))
) ?? cleanEmails[0] ?? null;

// ── 2. Social link extraction ─────────────────────────────────────
const socialPatterns = {
  linkedin_url  : /https?:\/\/(www\.)?linkedin\.com\/(company|in)\/[^"'\s>]+/i,
  facebook_url  : /https?:\/\/(www\.)?facebook\.com\/[^"'\s>]+/i,
  instagram_url : /https?:\/\/(www\.)?instagram\.com\/[^"'\s>]+/i,
  twitter_url   : /https?:\/\/(www\.)?(twitter|x)\.com\/[^"'\s>]+/i,
};

const socials = {};
for (const [key, pattern] of Object.entries(socialPatterns)) {
  const match = html.match(pattern);
  socials[key] = match ? match[0].replace(/['">\s].*$/, '') : null;
}

// ── 3. Clean HTML for AI context (strip scripts/styles, cap at 3000 chars) ──
const cleanHtml = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi,  '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s{2,}/g, ' ')
  .trim()
  .slice(0, 3000);

// ── 4. Return enriched item ───────────────────────────────────────
return {
  ...item,
  email        : bestEmail,
  all_emails   : cleanEmails,
  ...socials,
  scraped_html : cleanHtml,
  email_found  : bestEmail !== null,
};
```

---

### Error Handling Within Workflow 2

#### Node-Level Try/Catch (HTTP Request Nodes)

Set each HTTP Request node with:
- **Retry on Fail:** ✅ ON
- **Max Tries:** 2
- **Wait Between Tries:** 1500 ms
- **Continue on Fail:** ✅ ON (allows the Merge node to still fire)

#### Post-Merge Failure Detection

```
[Code Node — Validate Enrichment Result]
// Runs after Merge, before the email IF check
// 2026-06-12 22:38 UTC+5

const item = $input.item.json;
const hasScrape    = !!item.scraped_html && item.scraped_html.length > 100;
const hasPagespeed = item.pagespeed_score !== null && item.pagespeed_score !== undefined;

// Both branches completely failed
if (!hasScrape && !hasPagespeed) {
  return {
    ...item,
    _hard_fail   : true,
    failure_reason: 'scrape and pagespeed both failed',
  };
}

return { ...item, _hard_fail: false };
```

#### Hard Failure Path

```
[IF Node — _hard_fail = true?]
  │
  ├── YES → [Postgres UPDATE]
  │           status        = 'enrich_failed',
  │           failure_reason = {{ $json.failure_reason }},
  │           retry_count   = retry_count + 1,
  │           updated_at    = NOW()
  │
  └── NO  → continue to email extraction
```

#### Retry Escalation (handled via Error Trigger Workflow)

```
[Error Trigger — attached to Workflow 2]
       │
       ▼
[Postgres UPDATE leads]
  SET  failure_reason = {{ $execution.error.message }},
       retry_count    = retry_count + 1,
       updated_at     = NOW(),
       status = CASE
         WHEN retry_count + 1 >= 3 THEN 'enrich_failed'
         ELSE 'new'           ← reset to new; will be retried next run
       END
  WHERE id = {{ $json.lead_id }}
       │
       ▼
[Postgres INSERT workflow_logs]
  workflow_name = 'enrichment_error',
  notes         = error message + lead_id
```

---

### Sub-Workflow Architecture (Recommended for Scale)

Break Workflow 2 into reusable sub-workflows via `Execute Workflow` nodes:

```
┌─────────────────────────────────────────────────────────────┐
│   MAIN: Workflow 2 — Enrichment Orchestrator                │
│   Schedule: Every 10 min                                     │
└────────────────┬────────────────────────────────────────────┘
                 │
         [Postgres SELECT batch]
                 │
           [SplitOut Node]
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
[Execute Workflow]  [Execute Workflow]
"Sub: Scrape Site"  "Sub: PageSpeed"
         │                │
         └───────┬─────────┘
                 ▼
         [Execute Workflow]
         "Sub: Extract Contacts"
                 │
         [Postgres UPDATE]
```

**Sub-workflow: "Sub: Scrape Site"**
- Input: `website_url`
- Output: `scraped_html`, `scrape_status`
- Reusable by Workflow 3 if re-scraping is needed

**Sub-workflow: "Sub: PageSpeed"**
- Input: `website_url`
- Output: `pagespeed_score`, `seo_score`, `mobile_score`, `performance_json`
- Reusable standalone for monitoring existing clients

**Sub-workflow: "Sub: Extract Contacts"**
- Input: `scraped_html`, `website_url`
- Output: `email`, `linkedin_url`, `facebook_url`, `instagram_url`, `twitter_url`

---

### Scalability Controls

| Lever | Default | How to Scale |
|---|---|---|
| **Batch size** | 10 leads/run | Increase to 25–50 once ScraperAPI plan upgraded |
| **Schedule frequency** | Every 10 min | Drop to every 5 min for higher throughput |
| **ScraperAPI concurrency** | 1 request/lead (sequential via SplitOut) | Use `Split In Batches` with size 5 + parallel HTTP |
| **PageSpeed quota** | 25k/day free | Stays free up to ~17k leads/day |
| **n8n execution mode** | `main` (single process) | Switch to `queue` mode + Redis for multi-worker |
| **DB locking** | `FOR UPDATE SKIP LOCKED` | Safe to run 2+ simultaneous WF2 instances without overlap |

#### Preventing DB Bottlenecks at Scale

```sql
-- Production-safe SELECT used inside n8n Postgres node
-- 2026-06-12 22:38 UTC+5
BEGIN;

SELECT id, business_name, website_url, retry_count, city, category
FROM   leads
WHERE  status = 'new'
  AND  retry_count < 3
  AND  website_url IS NOT NULL
ORDER  BY created_at ASC
LIMIT  10
FOR UPDATE SKIP LOCKED;
```

> The `SKIP LOCKED` clause ensures that if two WF2 instances fire simultaneously
> (e.g., an overlapping schedule or manual trigger), they each grab different leads
> with zero contention — no deadlocks, no duplicate processing.

---

### Observability & Monitoring

Every successful run writes to `workflow_logs`:

```sql
-- Inserted at end of each WF2 run
-- 2026-06-12 22:38 UTC+5
INSERT INTO workflow_logs (
  workflow_name,
  run_at,
  leads_processed,
  leads_failed,
  duration_ms,
  notes
) VALUES (
  'enrichment',
  NOW(),
  {{ success_count }},
  {{ fail_count }},
  {{ duration_ms }},
  'batch_ids: {{ lead_ids_csv }}'
);
```

**Dashboard query — enrichment funnel health:**

```sql
-- 2026-06-12 22:38 UTC+5
SELECT
  status,
  COUNT(*)                                  AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*))
        OVER (), 1)                          AS pct
FROM  leads
GROUP BY status
ORDER BY count DESC;
```

**Alert condition** — if `enrich_failed` count grows faster than `enriched`, the
ScraperAPI key is likely exhausted or rate-limited. Check quota at
[scraperapi.com/dashboard](https://www.scraperapi.com/dashboard).

---

### Workflow 2 — Quick Reference Card

| Parameter | Value |
|---|---|
| Schedule | Every 10 minutes |
| Batch size | 10 leads |
| Input status filter | `status = 'new' AND retry_count < 3` |
| In-flight status | `enriching` |
| Success output status | `enriched` |
| No-email output status | `no_email` |
| Hard-fail output status | `enrich_failed` |
| Max retries before permanent fail | 3 |
| External APIs used | ScraperAPI · Google PageSpeed Insights |
| Avg run time (10 leads) | ~15–25 seconds |
| Avg cost per lead | ~$0.00049 (ScraperAPI free tier: 0 cost) |

---


## 7. Workflow 3 — AI Audit & Email Personalization

**Trigger:** Schedule (e.g., every 15 minutes)
**Purpose:** Use AI to audit the website and write a personalized cold email
**Batch Size:** 5 leads per run (AI calls are slower and more expensive)

### n8n Node Flow

```
[Schedule Trigger]
       ↓
[Postgres Node — SELECT]
  SELECT id, business_name, city, category,
         website_url, email,
         pagespeed_score, seo_score, mobile_score,
         scraped_html
  FROM leads
  WHERE status = 'enriched'
    AND email IS NOT NULL
  ORDER BY enriched_at ASC
  LIMIT 5
       ↓
[SplitOut Node]
       ↓
[Code Node — Build AI Prompt]
  Constructs a structured prompt with:
  • Business name, category, location
  • Website URL
  • PageSpeed score (0-100)
  • SEO score (0-100)
  • Mobile score (0-100)
  • Snippet of scraped content (first 2000 chars)
       ↓
[HTTP Request — OpenAI API]
  POST https://api.openai.com/v1/chat/completions
  Headers:
    Authorization: Bearer {OPENAI_API_KEY}
  Body:
    model: "gpt-4o"
    messages: [
      { role: "system", content: "You are an expert web consultant..." },
      { role: "user",   content: {{ $json.prompt }} }
    ]
  Returns: audit_summary + personalized_email + email_subject
       ↓
[Code Node — Parse AI Response]
  Extract: subject, body, audit from JSON response
       ↓
[Postgres Node — UPDATE]
  UPDATE leads SET
    audit_summary      = '...',
    personalized_email = '...',
    email_subject      = '...',
    status             = 'approved',
    audited_at         = NOW()
  WHERE id = {{ $json.id }}
```

### AI System Prompt

```
You are an expert web consultant and cold email copywriter.

You will receive data about a local business website. Your job is to:
1. Write a short, honest audit (3-4 bullet points) of what is wrong with their site
2. Write a personalized cold email (under 150 words) that:
   - Addresses the owner by business name
   - Mentions 1-2 specific problems you found
   - Offers to help fix them
   - Has a soft CTA (short call, quick chat)
   - Does NOT sound spammy or templated

Return ONLY valid JSON in this format:
{
  "audit_summary": "...",
  "email_subject": "...",
  "email_body": "..."
}
```

---

## 8. Workflow 4 — Outbound Email Sending

**Trigger:** Schedule (e.g., every 30 minutes)
**Purpose:** Send personalized emails to approved leads via SMTP
**Batch Size:** 20 emails per run (respect sending limits)

### n8n Node Flow

```
[Schedule Trigger]
       ↓
[Postgres Node — SELECT]
  SELECT id, business_name, email,
         email_subject, personalized_email
  FROM leads
  WHERE status = 'approved'
  ORDER BY audited_at ASC
  LIMIT 20
       ↓
[SplitOut Node]
       ↓
[IF Node] — is email valid? (basic format check)
  │
  ├── INVALID → [Postgres UPDATE] status = 'failed', reason = 'invalid email'
  │
  └── VALID  →
              ↓
       [Send Email Node — SMTP]
         From:    your@domain.com
         To:      {{ $json.email }}
         Subject: {{ $json.email_subject }}
         Body:    {{ $json.personalized_email }}
              ↓
       [IF Node] — did send succeed?
         │
         ├── SUCCESS →
         │         [Postgres UPDATE leads] status = 'sent', sent_at = NOW()
         │         [Postgres INSERT email_logs] log the send
         │
         └── FAILURE →
                   [Postgres UPDATE leads] status = 'send_failed',
                                          retry_count = retry_count + 1
```

### SMTP Configuration (n8n Credential)

```
Host:       smtp.gmail.com  (or your mail provider)
Port:       587
Security:   STARTTLS
Username:   your@domain.com
Password:   your_app_password
```

> For production use a dedicated sending domain with SPF, DKIM, and DMARC records configured to avoid spam filters.

---

## 9. External API Integrations

| API | Purpose | Cost | Docs |
|---|---|---|---|
| **Yelp Fusion API** | Business discovery | Free (500 calls/day) | [yelp.com/developers](https://www.yelp.com/developers) |
| **Google Places API** | Business discovery (GMB) | $17 per 1,000 requests | [developers.google.com/maps/documentation/places](https://developers.google.com/maps/documentation/places) |
| **ScraperAPI** | Website HTML scraping | Free (1,000/mo), $49/mo (100k) | [scraperapi.com](https://www.scraperapi.com) |
| **Google PageSpeed Insights API** | Performance metrics | **FREE** (25k/day) | [developers.google.com/speed](https://developers.google.com/speed/docs/insights/v5/get-started) |
| **OpenAI API (GPT-4o)** | AI audit + email writing | ~$0.01–$0.03 per lead | [platform.openai.com](https://platform.openai.com) |
| **SMTP (Gmail/Custom)** | Email sending | Free / $0 | Gmail App Passwords |

### Estimated Cost Per 1,000 Leads

| Step | Cost |
|---|---|
| Lead Discovery (Yelp) | $0 |
| Web Scraping (ScraperAPI) | ~$0.49 |
| PageSpeed (Google) | $0 |
| AI Audit + Email (GPT-4o) | ~$15–$30 |
| Email Sending (SMTP) | $0 |
| **Total** | **~$15–$31 per 1,000 leads** |

---

## 10. Parallel Processing Model in n8n

### How It Works

n8n does **not** run these workflows simultaneously in a single flow. Instead, each workflow is a **separate n8n workflow** with its own schedule trigger. They run independently and communicate only through PostgreSQL.

```
Timeline Example:

 Every 6h  │  Workflow 1 ████░░░░░░░░░░░░░░░░░░░░░
 Every 10m │  Workflow 2 ░░░████░░████░░████░░████
 Every 15m │  Workflow 3 ░░░░░░░███░░░░░███░░░░███
 Every 30m │  Workflow 4 ░░░░░░░░░░░░░░░░██░░░░░░░██
```

### Key n8n Nodes for This System

| Node | Used In | Purpose |
|---|---|---|
| `Schedule Trigger` | All workflows | Runs workflow on a timer |
| `Postgres` | All workflows | Read/write to PostgreSQL |
| `HTTP Request` | WF1, WF2, WF3 | Call external APIs |
| `SplitOut` | All workflows | Split array into individual items |
| `Split In Batches` | WF2, WF3, WF4 | Process N items at a time |
| `Merge` | WF2 | Combine parallel API results |
| `IF` | WF2, WF4 | Conditional routing |
| `Code` | WF2, WF3 | Custom JS (regex, prompt building) |
| `Send Email` | WF4 | SMTP email sending |
| `Set` | All workflows | Assign/transform variables |
| `Error Trigger` | All workflows | Catch and log failures |

### Sub-Workflow Pattern

For cleaner organization, each workflow can be a **main workflow + sub-workflow**:

```
Main Workflow 2 (Enrichment Orchestrator)
  ↓
  Loops through leads in batches
  ↓
  Calls → Sub-Workflow: "Scrape Website"      (reusable)
  Calls → Sub-Workflow: "Get PageSpeed Score" (reusable)
  Calls → Sub-Workflow: "Extract Emails"      (reusable)
```

Sub-workflows are triggered via the `Execute Workflow` node and can be reused across multiple parent workflows.

---

## 11. Data Flow — End to End

```
[Yelp / GMB API]
       │
       ▼
┌──────────────────┐
│   Workflow 1     │
│  Lead Generation │
└────────┬─────────┘
         │ INSERT status='new'
         ▼
┌─────────────────────────────────────────┐
│              POSTGRESQL                  │
│                                          │
│  leads table — the single source        │
│  of truth for every lead                │
└────────────────────────┬────────────────┘
         ▲               │ SELECT status='new'
         │               ▼
         │     ┌──────────────────┐
         │     │   Workflow 2     │
         │     │  Data Enrichment │
         │     └────────┬─────────┘
         │              │
         │   ┌──────────┤
         │   │ ScraperAPI│ PageSpeed API
         │   └──────────┤
         │              │
         └──────────────┘  UPDATE status='enriched'
                           (email, scores, socials saved)

         ┌────────────────────────────────┐
         │              POSTGRESQL        │
         └───────────────┬────────────────┘
                         │ SELECT status='enriched'
                         ▼
               ┌──────────────────┐
               │   Workflow 3     │
               │   AI Audit       │
               └────────┬─────────┘
                        │
                 ┌──────┤
                 │ OpenAI GPT-4o
                 └──────┤
                        │ UPDATE status='approved'
                        │ (audit, email subject+body saved)
                        ▼
               ┌─────────────────────────────┐
               │           POSTGRESQL        │
               └──────────────┬──────────────┘
                              │ SELECT status='approved'
                              ▼
                    ┌──────────────────┐
                    │   Workflow 4     │
                    │  Email Sending   │
                    └────────┬─────────┘
                             │ SMTP Send
                             ▼
                    ┌──────────────────┐
                    │  UPDATE          │
                    │  status='sent'   │
                    │  log to          │
                    │  email_logs      │
                    └──────────────────┘
```

---

## 12. Error Handling Strategy

### Per-Workflow Error Handling

Every workflow should have an **Error Trigger** workflow connected to it in n8n.

```
[Error Trigger Node]
       ↓
[Set Node] — extract: workflow_name, error_message, lead_id
       ↓
[Postgres UPDATE] — leads SET status='failed',
                              failure_reason = error_message,
                              retry_count = retry_count + 1
       ↓
[IF Node] — retry_count >= 3?
  │
  ├── YES → leave as 'failed' — needs manual review
  │
  └── NO  → [Postgres UPDATE] status = 'new' (or previous status)
                               — will be retried on next run
```

### Status-Based Retry Logic

| Status | Meaning | Action |
|---|---|---|
| `new` | Freshly inserted, not yet processed | Picked up by Workflow 2 |
| `enriched` | Website scraped, email found | Picked up by Workflow 3 |
| `approved` | AI email written | Picked up by Workflow 4 |
| `sent` | Email delivered | Terminal — no action |
| `enrich_failed` | Scraping or email extraction failed | Manual review or auto-retry |
| `audit_failed` | AI call failed | Auto-retry after delay |
| `send_failed` | SMTP failed | Retry up to 3 times |
| `failed` | Permanent failure (3 retries exhausted) | Manual review |
| `no_email` | No email found during enrichment | Skip — cannot email |
| `blacklisted` | Do not contact | Never picked up again |

---

## 13. Scalability Considerations

### Increasing Throughput

| Lever | How to Scale |
|---|---|
| **Lead Volume** | Increase Schedule frequency + batch size in Workflow 1 |
| **Enrichment Speed** | Upgrade ScraperAPI plan; increase WF2 batch size |
| **AI Speed** | Use GPT-4o-mini for cost, GPT-4o for quality; increase WF3 batch |
| **Email Volume** | Use a dedicated sending service (Mailgun, SendGrid) instead of Gmail SMTP |

### PostgreSQL Optimization

- Add indexes on `status`, `created_at`, `city` (already defined in schema)
- Use `SELECT ... FOR UPDATE SKIP LOCKED` to prevent two workflow runs from grabbing the same lead if workflows ever overlap

```sql
SELECT id, business_name, website_url
FROM leads
WHERE status = 'new'
ORDER BY created_at ASC
LIMIT 10
FOR UPDATE SKIP LOCKED;
```

### n8n Self-Hosted Scaling

- Run n8n with **queue mode** (using Redis + Bull) for parallel execution
- Use **n8n workers** to distribute workflow runs across multiple processes
- Set `EXECUTIONS_PROCESS=main` for single-node, `queue` for multi-node

---

## Quick Reference — Workflow Schedule Summary

| Workflow | Schedule | Batch Size | Trigger Status |
|---|---|---|---|
| WF1 — Lead Generation | Every 6 hours | 50 leads per API call | — |
| WF2 — Data Enrichment | Every 10 minutes | 10 leads per run | `new` |
| WF3 — AI Audit | Every 15 minutes | 5 leads per run | `enriched` |
| WF4 — Email Sending | Every 30 minutes | 20 emails per run | `approved` |

---

## Environment Variables Required

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=sales_agent
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password

# Yelp API
YELP_API_KEY=your_yelp_key

# Google APIs
GOOGLE_API_KEY=your_google_key

# ScraperAPI
SCRAPERAPI_KEY=your_scraperapi_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@domain.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_NAME=Your Name
```

---

*Architecture Document — Autonomous Multi-Channel AI Outbound Agent*
*Built on: n8n (Self-Hosted) + PostgreSQL*
*Author: Atrium Solution*
*Date: 2026-06-05* <!-- 2026-06-05 22:30 UTC+5 -->
