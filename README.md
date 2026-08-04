# AI-Powered Sales Agent

An AI-assisted outbound sales system designed for digital marketing agencies that need to research, qualify, personalize, and manage outreach at scale without losing human control over the final message.

The system finds local businesses, researches their websites, identifies digital improvement opportunities, generates personalized email drafts with AI, and sends only after human approval.

**Core stack:** n8n workflows, PostgreSQL, Next.js 15 dashboard, OpenAI, ScraperAPI, Google PageSpeed Insights, Resend API.


---

## Business Problem

Growing sales teams usually do not struggle because they have no leads.

They struggle because every lead needs time:

- Finding the right businesses
- Checking whether the company is a good fit
- Visiting websites manually
- Looking for contact details
- Understanding what problem the prospect may have
- Writing outreach that does not sound generic
- Tracking which lead is at which stage

When this work is done manually, salespeople spend too much time on research and administration instead of conversations, relationships, and closing deals.

The result is a common operational bottleneck:

- Outreach becomes generic
- Good leads are delayed or missed
- Follow-up becomes inconsistent
- More people are needed just to maintain the same process
- Sales operations become harder to track as the pipeline grows

This project was built around one question:

> How can AI remove repetitive sales operations work while keeping humans in control of quality and brand reputation?

---

## Solution Overview

This project is an AI-powered sales agent that acts as the first layer of an outbound sales process.

It does not try to replace the sales team. It handles the repetitive research and drafting work so humans can focus on the parts that require judgment.

The system can:

- Discover local businesses from sources like Google Maps and Yelp
- Research each company website
- Extract contact and business information
- Check website performance and digital presence
- Identify useful pain points for outreach
- Generate personalized email drafts using AI
- Route drafts to a dashboard for human review
- Send approved emails through Resend
- Track every lead through a clear pipeline status

Human review is required before any email is sent.

---

## How the System Works

| Step | What Happens | System Component |
|------|--------------|------------------|
| 1 | Find businesses by niche, city, country, and source | Workflow 1 - Lead Generation |
| 2 | Save campaign and lead records in PostgreSQL | Workflow 1 + Database |
| 3 | Crawl websites, extract contact data, and collect PageSpeed signals | Workflow 2 - Enrichment |
| 4 | Analyze findings and create an AI-personalized email draft | Workflow 3 - AI Audit & Draft |
| 5 | Review, edit, approve, or reject the draft | Next.js Dashboard |
| 6 | Send only approved emails through Resend | WF4 - Email Send |
| 7 | Log workflow results, errors, and send outcomes | PostgreSQL |

The workflow is designed around pipeline state. Each lead moves through statuses such as `new`, `enriched`, `pending_review`, `approved`, and `sent`.

---

## Architecture

The system uses PostgreSQL as the shared state layer. n8n workflows do not depend on direct workflow-to-workflow calls. Instead, they read from and write to the database based on lead status.

```text
                       PostgreSQL
                    Shared Pipeline State
        campaigns | leads | email_drafts | email_logs | workflow_logs
                                  |
        ---------------------------------------------------------------
        |                 |                    |                    |
        v                 v                    v                    v
   WF1 Lead Gen      WF2 Enrichment      WF3 AI Draft        WF4 Email Send
 Google/Yelp APIs    Web + PageSpeed       OpenAI             Resend API
        |                 |                    |                    |
        ---------------------------------------------------------------
                                  |
                                  v
                         Next.js Dashboard
                   Human review, control, visibility
```

This architecture keeps the system easier to operate:

- If one workflow fails, the others can continue
- Stuck leads can be recovered by status
- Every lead has a visible stage
- Dashboard actions can trigger n8n webhooks
- Workflow behavior can be observed through database logs

---

## Lead Status Pipeline

```text
new
  -> enriching
  -> enriched | no_email | no_website | enrich_failed
  -> auditing
  -> pending_review | audit_failed
  -> approved | rejected
  -> sending
  -> sent | send_failed
```

| Status | Meaning |
|--------|---------|
| `new` | Lead discovered and waiting for research |
| `enriching` | Website/contact enrichment is in progress |
| `enriched` | Lead has research data and is ready for AI drafting |
| `pending_review` | AI draft is ready for human review |
| `approved` | Human approved the message for sending |
| `rejected` | Human rejected the draft; do not send |
| `sending` | Email send is in progress |
| `sent` | Email was delivered through Resend |
| `*_failed` | Workflow failed and stored a failure reason |

---

## Key Design Decisions

### 1. Human approval before sending

AI is useful for research, summarization, and drafting, but outbound messaging affects brand reputation. The system intentionally keeps humans in the approval loop before any email is sent.

### 2. Database-driven workflow orchestration

Instead of chaining every workflow directly, PostgreSQL acts as the source of truth. This makes the pipeline more recoverable and easier to debug.

### 3. Smaller isolated workflows

Each n8n workflow has one responsibility:

- Find leads
- Enrich leads
- Generate AI drafts
- Send approved emails

This reduces blast radius. A failure in enrichment does not stop review or sending for already approved leads.

### 4. Status-based recovery

Leads are not treated as temporary workflow items. They are persistent records with statuses, retry counts, timestamps, and failure reasons.

### 5. Business-first AI usage

The goal is not to use AI everywhere. The goal is to apply AI where it removes a real business bottleneck: manual research, weak personalization, and slow outreach preparation.

---

## Potential Business Impact

This system is designed to support outcomes such as:

- Faster lead research
- More consistent outbound preparation
- Better personalization based on real website findings
- Less manual administrative work for sales teams
- Better visibility into lead stages and workflow failures
- Lower operational load as campaigns scale
- Safer AI adoption through human approval

No fixed ROI is assumed in this README because results depend on offer, market, data quality, email deliverability, and sales process.

---

## Technical Stack

| Layer | Technology | Role |
|-------|------------|------|
| Workflow automation | n8n | Runs lead generation, enrichment, AI drafting, and sending workflows |
| Database | PostgreSQL | Shared state, lead pipeline, campaign records, logs |
| Dashboard | Next.js 15, React 19, TypeScript | Human review, campaign visibility, workflow controls |
| AI | OpenAI | Audit insights and personalized email drafting |
| Web data | ScraperAPI | Website crawling and data extraction support |
| Performance signals | Google PageSpeed Insights | Website performance and digital presence signals |
| Email delivery | Resend API | Sends approved outbound emails |
| Database access | `pg` | PostgreSQL connection from the dashboard |

---

## Repository Structure

```text
AI-powered-Sales-Agent/
+-- database/
|   +-- schema.sql
|   +-- migrate_wf3_columns.sql
+-- dashboard/
|   +-- app/
|   +-- components/
|   +-- lib/
|   |   +-- auth/
|   |   +-- db/
|   |   +-- n8n/
|   +-- .env.example
|   +-- PART_*_TEST.md
+-- n8n/
|   +-- PD - Lead Generation & Data Storage*.json
|   +-- PD - Data Enrichment & Web Crawling*.json
|   +-- WF3 - Audit & Email Draft*.json
|   +-- WF4 - Email Send.json

```

---

## Prerequisites

- Node.js 18.18+
- PostgreSQL 14+
- n8n self-hosted or n8n instance with workflow import support
- API keys or credentials for:
  - OpenAI
  - ScraperAPI
  - Google PageSpeed Insights / Google API
  - Google Maps or Yelp source used by WF1
  - Resend API

---

## Quick Start

### 1. Database

Create a PostgreSQL database. Use the same name in `dashboard/.env.local`.

```bash
createdb sale_agent
psql -U postgres -d sale_agent -f database/schema.sql
```

If WF3 needs the extra audit columns, run:

```bash
psql -U postgres -d sale_agent -f database/migrate_wf3_columns.sql
```

Confirm JSON columns are correctly typed:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN (
    'performance_json',
    'pain_points',
    'crawl_metadata',
    'scraped_html'
  );
```

Expected:

- `performance_json`, `pain_points`, and `crawl_metadata` should be `jsonb`
- `scraped_html` should be `text`

### 2. n8n

1. Start n8n. Default local URL: `http://localhost:5678`
2. Import all workflow JSON files from `n8n/`
3. Configure PostgreSQL credentials on all Postgres nodes
4. Set required n8n environment variables
5. Activate workflows
6. Copy production webhook URLs into the dashboard `.env.local`

Suggested webhook paths:

| Workflow | Webhook Path |
|----------|--------------|
| WF1 - Lead Generation | `wf1-find-leads` |
| WF2 - Research | `wf2-research` |
| WF3 - AI Draft | `wf3-ai-draft` |
| WF4 - Send | `wf4-send` |

### 3. Dashboard

```bash
cd dashboard
cp .env.example .env.local
# Edit .env.local with PostgreSQL, auth, and n8n webhook values

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Dashboard (`dashboard/.env.local`)

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=sale_agent
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_database_password_here

N8N_WF1_WEBHOOK_URL=http://localhost:5678/webhook/wf1-find-leads
N8N_WF1_FORM_URL=
N8N_WF2_WEBHOOK_URL=http://localhost:5678/webhook/wf2-research
N8N_WF3_WEBHOOK_URL=http://localhost:5678/webhook/wf3-ai-draft
N8N_WF4_WEBHOOK_URL=http://localhost:5678/webhook/wf4-send

AUTH_USERNAME=your_admin_username
AUTH_PASSWORD=your_strong_password_here
AUTH_SECRET=generate_with_openssl_rand_hex_32
```

Restart the dashboard after changing environment variables.

### n8n Instance Variables

| Variable | Used By | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | WF3 | Yes |
| `SCRAPERAPI_KEY` or `SCRAPER_API_KEY` | WF2, WF3 | Yes |
| `GOOGLE_PSI_KEY` or `GOOGLE_API_KEY` | WF2 | Yes |
| `RESEND_API_KEY` | WF4 | Yes |
| `RESEND_FROM_EMAIL` | WF4 | Yes for production sending |
| `RESEND_FROM_NAME` | WF4 | Optional |
| `AGENCY_NAME` | WF3, WF4 fallback | Optional |
| `CALENDAR_LINK` | WF3 | Optional |

---

## n8n Workflows

### WF1 - Lead Generation & Data Storage

- Input: business type, city, country, source, max results
- Searches local business sources such as Google Maps or Yelp
- Creates a campaign record
- Deduplicates and inserts leads
- Output status: `new` or `no_website`

### WF2 - Data Enrichment & Web Crawling

- Picks leads with `status = 'new'`
- Crawls business websites
- Extracts email and social/contact signals
- Collects PageSpeed and website performance data
- Output status: `enriched`, `no_email`, `no_website`, or `enrich_failed`

### WF3 - AI Audit & Email Draft

- Picks leads with `status = 'enriched'` and a valid email
- Compiles research evidence
- Uses AI to create an audit summary and personalized email draft
- Writes to `email_drafts`
- Output status: `pending_review` or `audit_failed`

### WF4 - Email Send

- Picks leads with `status = 'approved'`
- Validates send readiness
- Sends through the Resend API
- Writes to `email_logs`
- Output status: `sent` or `send_failed`

Each workflow can also write execution details to `workflow_logs`.

---

## Dashboard

The dashboard is a Next.js App Router application that reads from PostgreSQL and triggers n8n workflows through webhooks.

| Route | Purpose |
|-------|---------|
| `/find-leads` | Start WF1 lead discovery |
| `/research` | Start WF2 enrichment |
| `/ai-draft` | Start WF3 AI draft generation |
| `/leads` | View leads and statuses |
| `/campaigns` | View campaigns |
| `/drafts` | View AI-generated drafts |
| `/review` | Approve, edit, or reject drafts |
| `/send` | Trigger or view send results |

Intended user flow:

1. Find leads
2. Research leads
3. Generate AI drafts
4. Review, edit, approve, or reject
5. Send approved messages
6. Monitor results and logs

---

## Database

Main tables:

| Table | Role |
|-------|------|
| `campaigns` | Search runs and campaign metadata |
| `leads` | Central lead pipeline and enrichment/audit fields |
| `email_drafts` | AI-generated drafts and review state |
| `email_logs` | Email send attempts and provider responses |
| `workflow_logs` | Workflow execution summaries |

Useful checks:

```sql
-- Pipeline counts
SELECT status, COUNT(*)
FROM leads
GROUP BY status
ORDER BY status;

-- Leads ready for AI drafting
SELECT id, business_name, email
FROM leads
WHERE status = 'enriched'
  AND email IS NOT NULL
  AND TRIM(email) <> '';

-- Drafts ready for review
SELECT id, business_name, email_subject, status
FROM leads
WHERE status = 'pending_review';
```

---

## Testing Flow

1. Confirm dashboard can connect to PostgreSQL
2. Run WF1 and verify new leads appear
3. Run WF2 and verify enrichment fields update
4. Run WF3 and verify `pending_review` leads and `email_drafts`
5. Approve or reject a draft from the dashboard
6. Run WF4 and verify `sent` status plus `email_logs`

Additional step-by-step test files live in `dashboard/PART_*_TEST.md`.

---

## Common Errors

| Symptom | Likely Cause | What To Do |
|---------|--------------|------------|
| `COALESCE types text and jsonb cannot be matched` | JSON column stored as `text` | Alter to `jsonb` or cast safely |
| `invalid input syntax for type json` | Non-JSON text in JSON column | Clean bad rows; do not cast `scraped_html` to `jsonb` |
| `A 'json' property isn't an object` | n8n Code node returned an array incorrectly | Return `{ json: {...} }` for each item |
| `Request failed with status code 429` | OpenAI rate limit or quota issue | Check billing, usage, and retry later |
| `Missing OPENAI_API_KEY` | n8n environment variable missing | Set the variable and restart n8n |
| Empty WF3 run | No enriched leads with email | Complete WF2 first |
| Stuck `auditing` or `sending` | Workflow crashed mid-run | Use recovery logic or reset status carefully |
| Dashboard webhook error | Wrong URL or inactive n8n workflow | Activate workflow and update `.env.local` |
| Resend send failed | Missing/invalid Resend key or sender | Check `RESEND_API_KEY` and verified sender domain |

---

## Documentation

| File | Contents |
|------|----------|
| `helping_materials/SYSTEM_ARCHITECTURE.md` | Full architecture and workflow design |
| `helping_materials/FUNCTIONAL_REQUIREMENTS.md` | Functional requirements and business rules |
| `helping_materials/DASHBOARD_NEXTJS_ARCHITECTURE.md` | Dashboard architecture |
| `helping_materials/ATRIUM_REACH_DESIGN_SYSTEM.md` | UI and design system notes |
| `dashboard/STRUCTURE.md` | Dashboard folder map |
| `dashboard/PART_*_TEST.md` | Part-by-part testing checklists |

---

## Notes

This is an internal project for Atrium Solution.

Keep secrets out of git:

- Do not commit `.env.local`
- Do not commit API keys
- Do not commit Resend credentials
- Do not commit live database credentials

The system is designed for responsible AI-assisted outbound. Human approval is intentionally part of the workflow before any prospect email is sent.
