# AI-Powered Sales Agent

Autonomous outbound sales system for digital marketing agencies. It finds local businesses, researches their websites, audits digital presence, drafts personalized emails with AI, and sends only after human approval.

**Stack:** n8n (self-hosted) · PostgreSQL · Next.js dashboard · ScraperAPI · Google PageSpeed Insights · OpenAI · SMTP

---

## Table of contents

1. [What it does](#what-it-does)
2. [Architecture](#architecture)
3. [Lead status pipeline](#lead-status-pipeline)
4. [Repository structure](#repository-structure)
5. [Prerequisites](#prerequisites)
6. [Quick start](#quick-start)
7. [Environment variables](#environment-variables)
8. [n8n workflows](#n8n-workflows)
9. [Dashboard](#dashboard)
10. [Database](#database)
11. [End-to-end test flow](#end-to-end-test-flow)
12. [Common errors](#common-errors)
13. [Documentation](#documentation)

---

## What it does

| Step | Action | Who runs it |
|------|--------|-------------|
| 1 | Find businesses (Google Maps / Yelp) by type + city | WF1 |
| 2 | Crawl website, extract email/socials, PageSpeed scores | WF2 |
| 3 | Audit findings + AI personalized email draft | WF3 |
| 4 | Human approve / edit / reject | Dashboard |
| 5 | Send approved emails via SMTP | WF4 |

Human review is required before any email is sent.

---

## Architecture

Workflows do **not** call each other. They share state through PostgreSQL status flags.

```
┌──────────────────────────────────────────────────────────┐
│                    PostgreSQL (shared state)             │
└───────────┬────────────┬────────────┬───────────┬────────┘
            │            │            │           │
            ▼            ▼            ▼           ▼
         ┌─────┐      ┌─────┐      ┌─────┐     ┌─────┐
         │ WF1 │      │ WF2 │      │ WF3 │     │ WF4 │
         │Find │      │Enrich│     │Audit│     │Send │
         └─────┘      └─────┘      └─────┘     └─────┘
            ▲            ▲            ▲           ▲
            └────────────┴──── dashboard webhooks ┘
```

**Benefits**
- Fault isolation — one workflow crash does not stop others
- Resumable — stuck leads recover from DB status
- Observable — every lead has a clear pipeline stage

---

## Lead status pipeline

```
new
  → enriching → enriched | no_email | enrich_failed | no_website
  → auditing  → pending_review | audit_failed
  → approved | rejected
  → sent | send_failed
```

| Status | Meaning |
|--------|---------|
| `new` | Discovered; waiting for research |
| `enriched` | Email + enrichment data ready |
| `pending_review` | AI draft ready; needs human review |
| `approved` | Ready for WF4 send |
| `sent` | Email delivered |
| `rejected` | Human rejected; do not send |
| `*_failed` | Terminal or retryable failure (see `failure_reason`) |

---

## Repository structure

```
AI-powered-Sales-Agent/
├── database/
│   ├── schema.sql                 # Full PostgreSQL schema
│   └── migrate_wf3_columns.sql    # WF3 column migration (if needed)
├── dashboard/                     # Next.js client UI + API
│   ├── app/                       # Pages + API routes
│   ├── components/
│   ├── lib/db/                    # Postgres pool
│   ├── lib/n8n/                   # Webhook triggers
│   ├── .env.example
│   └── PART_*_TEST.md             # Step-by-step test guides
├── n8n/
│   ├── PD — Lead Generation & Data Storage.json   # WF1
│   ├── PD - Data Enrichment & Web Crawling.json   # WF2
│   ├── WF3 — Audit & Email Draft.json             # WF3
│   └── WF4 — Email Send.json                      # WF4
└── helping_materials/
    ├── SYSTEM_ARCHITECTURE.md
    ├── FUNCTIONAL_REQUIREMENTS.md
    └── CLIENT_DASHBOARD_BUILD_PLAN.md
```

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 14+
- **n8n** self-hosted (Docker or npm)
- API keys / accounts:
  - OpenAI (`OPENAI_API_KEY`)
  - ScraperAPI (`SCRAPERAPI_KEY`)
  - Google PageSpeed Insights key (`GOOGLE_PSI_KEY` / `GOOGLE_API_KEY`)
  - Yelp / Google Maps credentials used by WF1 (as configured in n8n)
  - SMTP credentials for WF4

---

## Quick start

### 1. Database

```bash
# Create DB (name may be sales_agent or sale_agent — match your .env)
createdb sales_agent

psql -U postgres -d sales_agent -f database/schema.sql
```

If WF3 fails on missing columns:

```bash
psql -U postgres -d sales_agent -f database/migrate_wf3_columns.sql
```

Confirm JSON columns are `jsonb` (not `text`):

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN (
    'performance_json', 'pain_points',
    'crawl_metadata', 'scraped_html'
  );
```

Expected: first three → `jsonb`, `scraped_html` → `text`.

### 2. n8n

1. Start n8n (default: `http://localhost:5678`)
2. Import all JSON files from `n8n/`
3. Configure **Postgres** credentials on all Postgres nodes
4. Set n8n environment variables (see below)
5. Add webhooks (if not already present) and **Activate** each workflow:

| Workflow | Suggested webhook path |
|----------|------------------------|
| WF1 Find Leads | `wf1-find-leads` |
| WF2 Research | `wf2-research` |
| WF3 AI Draft | `wf3-ai-draft` |
| WF4 Send | `wf4-send` (if used from dashboard) |

### 3. Dashboard

```bash
cd dashboard
cp .env.example .env.local
# Edit .env.local with DB + webhook URLs

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

### Dashboard (`dashboard/.env.local`)

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=sales_agent
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here

N8N_WF1_WEBHOOK_URL=http://localhost:5678/webhook/wf1-find-leads
N8N_WF2_WEBHOOK_URL=http://localhost:5678/webhook/wf2-research
N8N_WF3_WEBHOOK_URL=http://localhost:5678/webhook/wf3-ai-draft
# Optional:
# N8N_WF1_FORM_URL=
# N8N_WF4_WEBHOOK_URL=http://localhost:5678/webhook/wf4-send
```

Restart `npm run dev` after changing env values.

### n8n (instance env / variables)

| Variable | Used by | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | WF3 | Yes |
| `SCRAPERAPI_KEY` (or `SCRAPER_API_KEY`) | WF2, WF3 | Yes for crawl / social |
| `GOOGLE_PSI_KEY` (or `GOOGLE_API_KEY`) | WF2 | Yes for PageSpeed |
| `AGENCY_NAME` | WF3 email sign-off | Optional |
| `CALENDAR_LINK` | WF3 CTA | Optional |

SMTP credentials are configured in WF4 email/SMTP nodes.

---

## n8n workflows

### WF1 — Lead Generation & Data Storage

- **Input:** business type + city (+ country / source / max results)
- **Does:** searches directories, dedupes, inserts leads
- **Output status:** `new` (or `no_website`)
- **Creates:** `campaigns` row + `leads` rows

### WF2 — Data Enrichment & Web Crawling

- **Picks:** `status = 'new'` with website
- **Does:** scrape site, extract email/socials, PageSpeed, pain points
- **Output status:** `enriched` | `no_email` | `enrich_failed`

### WF3 — Audit & Email Draft

- **Picks:** `status = 'enriched'` with non-empty email
- **Does:** social scrape (optional), compile audit evidence, OpenAI draft
- **Output status:** `pending_review` | `audit_failed` (or retry → `enriched`)
- **Writes:** `email_drafts` + lead audit fields

### WF4 — Email Send

- **Picks:** `status = 'approved'`
- **Does:** send via SMTP, log result
- **Output status:** `sent` | `send_failed`

Each run can also write to `workflow_logs`.

---

## Dashboard

Next.js App Router UI. It reads PostgreSQL and triggers n8n via webhooks.

| Route | Purpose |
|-------|---------|
| `/find-leads` | Start WF1 (type + city) |
| `/research` | Start WF2 |
| `/ai-draft` | Start WF3 |
| `/leads` | Lead list + statuses |
| `/campaigns` | Campaign list |
| `/drafts` | Pending AI drafts |
| `/review` | Approve / edit / reject |
| `/send` | Trigger / view send results |

**Client flow (intended):**

1. Find Leads → see leads  
2. Research → see emails / scores  
3. AI Draft → see drafts  
4. Approve / Edit / Reject  
5. Send approved  

---

## Database

Main tables (see `database/schema.sql`):

| Table | Role |
|-------|------|
| `campaigns` | Search runs created by WF1 |
| `leads` | Central pipeline + enrichment + audit fields |
| `email_drafts` | Draft subject/body for review |
| `email_logs` | Send attempts (WF4) |
| `workflow_logs` | Per-run summaries |

Useful checks:

```sql
-- Pipeline counts
SELECT status, COUNT(*) FROM leads GROUP BY status ORDER BY status;

-- Ready for WF3
SELECT id, business_name, email
FROM leads
WHERE status = 'enriched'
  AND email IS NOT NULL AND TRIM(email) <> '';

-- Ready for review
SELECT id, business_name, email_subject, status
FROM leads
WHERE status = 'pending_review';
```

---

## End-to-end test flow

1. **DB connected** — dashboard home / leads load  
2. **WF1** — Find Leads → leads appear as `new`  
3. **WF2** — Research → `enriched` (with email) or `no_email`  
4. **WF3** — AI Draft → `pending_review` + row in `email_drafts`  
5. **Review** — approve one lead → `approved`  
6. **WF4** — Send → `sent` + `email_logs` row  

Per-part checklists live in:

- `dashboard/PART_0_TEST.md` … `PART_4_TEST.md`
- `dashboard/WF1_WEBHOOK_FIX.md`

---

## Common errors

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| `COALESCE types text and jsonb cannot be matched` | JSON column stored as `text` | Alter to `jsonb`, or cast in SQL (`col::jsonb`) |
| `invalid input syntax for type json` / Token "Sydney" | Non-JSON text in a JSON column | Clean bad rows; do **not** cast `scraped_html` to jsonb |
| `A 'json' property isn't an object` | Code node **Each Item** returns an array | Return `{ json: {...} }` not `[{ json: {...} }]` |
| `Request failed with status code 429` | OpenAI rate limit / quota | Check billing/usage; wait; keep `gpt-4o-mini` |
| `Missing OPENAI_API_KEY` | Key not in n8n env | Set variable and restart n8n |
| Empty WF3 run | No `enriched` leads with email | Finish WF2 first |
| Stuck `auditing` | Mid-run crash | Wait for 20‑min recovery, or reset status to `enriched` |
| Dashboard webhook 404 / error | Wrong URL or workflow inactive | Activate WF, copy Production webhook URL into `.env.local` |

---

## Documentation

| File | Contents |
|------|----------|
| `helping_materials/SYSTEM_ARCHITECTURE.md` | Full HLD, schemas, workflow design |
| `helping_materials/FUNCTIONAL_REQUIREMENTS.md` | FRD / business rules |
| `helping_materials/CLIENT_DASHBOARD_BUILD_PLAN.md` | Dashboard build order |
| `dashboard/STRUCTURE.md` | Dashboard folder map |
| `dashboard/PART_*_TEST.md` | Part-by-part test plans |

---

## License / notes

Internal project for **Atrium Solution**. Keep secrets out of git (`.env.local`, API keys, SMTP passwords). Never commit live credentials.
