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

**Trigger:** Schedule (e.g., every 10 minutes)
**Purpose:** Scrape website, extract emails/socials, get performance metrics
**Batch Size:** 10 leads per run (to avoid API rate limits)

### n8n Node Flow

```
[Schedule Trigger]
       ↓
[Postgres Node — SELECT]
  SELECT id, business_name, website_url
  FROM leads
  WHERE status = 'new'
    AND website_url IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 10
       ↓
[SplitOut Node] — process each lead individually
       ↓
[HTTP Request — ScraperAPI]  ←──────────────────────┐
  GET https://api.scraperapi.com/                    │
  Params:                                            │
    api_key = {SCRAPERAPI_KEY}                       │
    url     = {{ $json.website_url }}                │
    render  = true   ← handles JS pages              │
  Returns: full rendered HTML                        │
       ↓                                             │
[HTTP Request — Google PageSpeed API]   ← parallel branch
  GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  Params:
    url      = {{ $json.website_url }}
    key      = {GOOGLE_API_KEY}
    strategy = mobile
  Returns: performance, SEO, accessibility scores
       ↓
[Merge Node] — combine HTML + PageSpeed results
       ↓
[Code Node — Extract Emails & Socials from HTML]
  • Regex for emails:   /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  • Regex for LinkedIn: /linkedin\.com\/company\/[a-zA-Z0-9_-]+/g
  • Regex for Facebook: /facebook\.com\/[a-zA-Z0-9.]+/g
  • Regex for Instagram:/instagram\.com\/[a-zA-Z0-9._]+/g
       ↓
[Postgres Node — UPDATE]
  UPDATE leads SET
    email           = '...',
    linkedin_url    = '...',
    facebook_url    = '...',
    pagespeed_score = ...,
    seo_score       = ...,
    mobile_score    = ...,
    performance_json= '...',
    status          = 'enriched',
    enriched_at     = NOW()
  WHERE id = {{ $json.id }}
```

### ScraperAPI Call Example

```
GET https://api.scraperapi.com/?api_key=YOUR_KEY&url=https://example.com&render=true
```

### Google PageSpeed Call Example

```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
    ?url=https://example.com
    &key=YOUR_GOOGLE_KEY
    &strategy=mobile
```

Key fields from PageSpeed response:
- `lighthouseResult.categories.performance.score` × 100 = performance score
- `lighthouseResult.categories.seo.score` × 100 = SEO score
- `lighthouseResult.categories.accessibility.score` × 100 = accessibility score

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
