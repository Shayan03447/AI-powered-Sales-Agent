# Atrium Reach — Complete Next.js Architecture Guide

> **Audience:** Mid-level developer onboarding  
> **Scope:** Dashboard (`dashboard/`) + how it integrates with PostgreSQL and n8n  
> **Rule for this doc:** Descriptive only — reflects the codebase as built (human-in-the-loop outbound sales agent)  
> **Product name:** Atrium Reach (by Atrium Solution)

---

## Table of contents

1. [Overall project architecture](#1-overall-project-architecture)
2. [Folder structure](#2-folder-structure)
3. [Routing structure](#3-routing-structure)
4. [Layout hierarchy](#4-layout-hierarchy)
5. [Component hierarchy](#5-component-hierarchy)
6. [API flow](#6-api-flow)
7. [Database flow](#7-database-flow)
8. [n8n integration](#8-n8n-integration)
9. [Authentication flow](#9-authentication-flow)
10. [End-to-end data flow (UI → n8n → DB → UI)](#10-end-to-end-data-flow-ui--n8n--db--ui)
11. [Important files deep-dive](#11-important-files-deep-dive)
12. [Mental model for mentors](#12-mental-model-for-mentors)

---

## 1. Overall project architecture

### 1.1 What this system is

This monorepo implements an **outbound sales pipeline**:

1. Find businesses (Google Places / optional Yelp) — **WF1**
2. Research websites (crawl, PageSpeed, extract email) — **WF2**
3. AI audit + personalized email draft — **WF3**
4. Human approve / edit / reject — **Dashboard**
5. Send approved emails via Resend — **WF4**

The **dashboard never does heavy automation**. It:

- Triggers n8n via HTTP webhooks
- Reads/writes PostgreSQL for UI state and human review
- Enforces step locks and auth

n8n owns API calls, crawling, AI, and sending. PostgreSQL is the **shared source of truth** (especially `leads.status`).

### 1.2 System diagram

```
┌──────────────────┐     HTTP POST      ┌─────────────────────┐
│  Browser (Client)│ ─────────────────► │  Next.js Dashboard  │
│  Atrium Reach UI │ ◄───────────────── │  (App Router)       │
└──────────────────┘     HTML / JSON    └──────────┬──────────┘
                                                   │
                         ┌─────────────────────────┼─────────────────────────┐
                         │                         │                         │
                         ▼                         ▼                         ▼
              ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
              │  PostgreSQL      │     │  n8n (self-host) │     │  Env secrets     │
              │  campaigns       │◄───►│  WF1 Find        │     │  .env.local      │
              │  leads           │     │  WF2 Research    │     │  AUTH_*, N8N_*   │
              │  email_drafts    │     │  WF3 AI Draft    │     │  POSTGRES_*      │
              │  email_logs      │     │  WF4 Send        │     └──────────────────┘
              │  workflow_logs   │     └────────┬─────────┘
              └──────────────────┘              │
                                                ▼
                                   Google / OpenAI / Scraper / Resend
```

### 1.3 Architectural principles (how to think about it)

| Principle | Meaning in this codebase |
|-----------|--------------------------|
| **Shared DB state machine** | Lead `status` drives which WF can pick a row |
| **Fire-and-forget triggers** | Dashboard starts a workflow; it does not wait for full completion |
| **Human gate before send** | WF4 only sees `approved` + approved `email_drafts` |
| **Thin UI, fat workers** | UI is Next.js; workers are n8n |
| **Single-admin auth** | Env-based credentials, HMAC cookie session — not multi-tenant SaaS |

### 1.4 Repo top-level (outside `dashboard/`)

| Path | Role |
|------|------|
| `dashboard/` | Next.js 15 App Router client control panel |
| `n8n/` | Exported workflow JSON (WF1–WF4) — import into n8n |
| `database/` | `schema.sql` + migrations — Postgres DDL |
| `helping_materials/` | FRD, system design, build plans, this architecture doc |

---

## 2. Folder structure

### 2.1 `dashboard/` — why it exists

**Responsibility:** Product UI + BFF-style API routes that talk to Postgres and n8n.

```
dashboard/
├── app/                 # Routes (pages) + Route Handlers (API)
├── components/          # React UI building blocks
├── lib/                 # Server-side utilities (db, auth, n8n, pipeline)
├── types/               # Shared TypeScript domain types
├── hooks/               # Placeholder for client hooks (mostly empty)
├── styles/              # Placeholder
├── public/              # Static assets
├── middleware.ts        # Auth gate for all non-public routes
├── package.json         # next, react, pg
├── next.config.ts       # Next config (minimal)
├── tsconfig.json        # Path alias @/* → project root
└── .env.example / .env.local
```

---

### 2.2 `app/` — Next.js App Router

**Why:** Next.js 15 file-based routing. Server Components by default; client components only where interactivity is needed.

**Responsibility:**

- Render pages (RSC + SQL reads)
- Expose `/api/*` handlers
- Own global CSS and root chrome

**Most important:**

| Path | Why important |
|------|----------------|
| `app/layout.tsx` | Root shell: fonts, `AppNav`, `globals.css` |
| `app/page.tsx` | Home + pipeline status + step tiles |
| `app/api/workflows/*` | Buttons → n8n |
| `app/api/drafts/[id]/route.ts` | Human approve/edit/reject |
| `middleware.ts` (sibling of `app/`) | Auth boundary |

**Route groups:**

- `(auth)/` — login UX (URL has no `(auth)` segment)
- `(dashboard)/` — product pages (URL has no `(dashboard)` segment); layout is currently a passthrough

---

### 2.3 `components/`

**Why:** Keep `app/**/page.tsx` thin; reusable UI and interactive islands.

| Subfolder | Responsibility | Important files |
|-----------|----------------|-----------------|
| `ui/` | Chrome + shared visuals | `AppNav.tsx`, `StatusBadge.tsx`, `BrandLogo.tsx` |
| `auth/` | Login / logout UI | `LoginForm.tsx`, `LogoutButton.tsx` |
| `workflow/` | Step triggers + locks | `FindLeadsForm.tsx`, `StartResearchButton.tsx`, `StartAiDraftButton.tsx`, `StartSendButton.tsx`, `StepLockNotice.tsx` |
| `campaigns/` | Campaign list table | `CampaignsTable.tsx` |
| `leads/` | Leads table + refresh | `LeadsTable.tsx`, `LeadsRefresh.tsx` |
| `drafts/` | Draft review UX | `DraftsTable.tsx`, `DraftReviewActions.tsx`, `DraftsRefresh.tsx` |
| `review/` | Legacy/empty placeholder | `.gitkeep` (drafts page is the real review UX) |

---

### 2.4 `lib/`

**Why:** Server-only (or edge-safe) logic that must not live inside React trees.

| Subfolder / file | Responsibility | Important files |
|------------------|----------------|-----------------|
| `lib/db/` | Postgres pool + `query()` | `index.ts` |
| `lib/n8n/` | HTTP triggers to n8n | `client.ts` (`triggerWf1`…`triggerWf4`) |
| `lib/auth/` | Session create/verify (Node) | `index.ts` |
| `lib/auth/edge.ts` | Session verify for middleware (Web Crypto) | `edge.ts` |
| `lib/pipeline/` | Counts for step locks | `counts.ts` |
| `lib/leads/` | Metro suburb rotation for WF1 | `metro-suburbs.ts` |
| `lib/utils.ts` | Misc helpers | — |

---

### 2.5 `types/`

**Why:** Single place for domain shapes used by pages and tables.

**Important:** `types/index.ts` — `Lead`, `Campaign`.

---

### 2.6 `database/` (repo root)

**Why:** Schema is shared by dashboard and n8n; versioned in git.

| File | Responsibility |
|------|----------------|
| `schema.sql` | Full DDL: campaigns, leads, email_drafts, email_logs, workflow_logs, indexes |
| `migrate_wf3_columns.sql` | Additive migrations for WF3 columns |

---

### 2.7 `n8n/` (repo root)

**Why:** Source-of-truth exports of workflows; not executed by Next.js.

| File (approx names) | Workflow |
|---------------------|----------|
| `PD — Lead Generation…` | WF1 |
| `PD - Data Enrichment…` | WF2 |
| `WF3 — Audit & Email Draft…` | WF3 |
| `WF4 — Email Send.json` | WF4 |

---

## 3. Routing structure

### 3.1 Pages (App Router URLs)

| URL | File | Kind | Purpose |
|-----|------|------|---------|
| `/` | `app/page.tsx` | Server | Home, pipeline counts, step tiles |
| `/login` | `app/(auth)/login/page.tsx` | Client island | Admin login |
| `/find-leads` | `(dashboard)/find-leads/page.tsx` | Server + form | Start WF1 |
| `/research` | `(dashboard)/research/page.tsx` | Server + button | Start WF2 (locked if no `new`) |
| `/ai-draft` | `(dashboard)/ai-draft/page.tsx` | Server + button | Start WF3 |
| `/drafts` | `(dashboard)/drafts/page.tsx` | Server + client actions | Human review |
| `/send` | `(dashboard)/send/page.tsx` | Server + button | Start WF4 |
| `/campaigns` | `(dashboard)/campaigns/page.tsx` | Server | List campaigns |
| `/campaigns/[id]` | `(dashboard)/campaigns/[id]/page.tsx` | Server | Campaign detail |
| `/leads` | `(dashboard)/leads/page.tsx` | Server | All leads |
| `/review` | `(dashboard)/review/page.tsx` | Placeholder / redirect-style page | Prefer `/drafts` |

### 3.2 API routes

| Method + path | File | Purpose |
|---------------|------|---------|
| `POST /api/auth/login` | `api/auth/login/route.ts` | Set session cookie |
| `POST /api/auth/logout` | `api/auth/logout/route.ts` | Clear cookie |
| `GET/POST /api/auth` | `api/auth/route.ts` | Auth helpers / status (if present) |
| `GET /api/campaigns` | `api/campaigns/route.ts` | List campaigns JSON |
| `GET /api/leads` | `api/leads/route.ts` | List leads JSON |
| `… /api/leads/[id]` | `api/leads/[id]/route.ts` | Per-lead ops (if used) |
| `POST /api/drafts/[id]` | `api/drafts/[id]/route.ts` | approve / reject / edit |
| `POST /api/workflows/find-leads` | … | Trigger WF1 (+ suburb rotation) |
| `POST /api/workflows/research` | … | Trigger WF2 |
| `POST /api/workflows/ai-draft` | … | Trigger WF3 |
| `POST /api/workflows/send` | … | Trigger WF4 |

### 3.3 Middleware matcher

`middleware.ts` runs on almost all paths except static assets. Public allowlist:

- `/login`
- `/api/auth/login`
- `/api/auth/logout`
- `/_next/*`, favicon

Everything else requires a valid `atrium_session` cookie.

---

## 4. Layout hierarchy

```
RootLayout (app/layout.tsx)
├── <html> + Google fonts (DM Sans, Fraunces)
├── <body>
│   └── .app-shell
│       ├── AppNav          ← always mounted (hides nav links on /login)
│       └── {children}
│           ├── /login → (auth)/login/page
│           ├── / → app/page.tsx
│           └── /(dashboard)/* → DashboardLayout (passthrough <>children</>)
│               └── page content
```

**Notes for mentees:**

- There is **no nested marketing layout** — one product shell.
- `(dashboard)/layout.tsx` exists for future grouping but currently adds no UI.
- Navigation is global in root layout so every authenticated page shares the same chrome.

---

## 5. Component hierarchy

### 5.1 Home (`/`)

```
HomePage (RSC)
├── hero-panel (links)
├── pipeline-status (from getPipelineCounts)
└── action-grid (Links to steps; CSS locked class when counts == 0)
```

### 5.2 Find Leads

```
FindLeadsPage (RSC shell)
└── FindLeadsForm (client)
    └── POST /api/workflows/find-leads
```

### 5.3 Research / AI Draft / Send

```
*Page (RSC)
├── StepLockNotice (if locked)
├── Start*Button (client) → POST /api/workflows/*
└── optional lists / refresh helpers
```

### 5.4 Drafts (human review)

```
DraftsPage (RSC — loads pending_review leads from DB)
├── DraftsRefresh (client)
└── DraftsTable
    └── DraftReviewActions (client)
        └── POST /api/drafts/[id] { action }
```

### 5.5 Campaigns / Leads

```
*Page (RSC — SQL)
└── *Table (presentational)
```

### 5.6 Auth

```
LoginPage
└── LoginForm → POST /api/auth/login

AppNav
└── LogoutButton → POST /api/auth/logout
```

---

## 6. API flow

### 6.1 Pattern all workflow APIs share

```
Client button/form
  → POST /api/workflows/<step>
  → (optional) SQL pre-check: are there rows ready?
  → triggerWfN() in lib/n8n/client.ts
  → HTTP POST to N8N_WFn_WEBHOOK_URL
  → JSON { ok, message, … } back to UI
```

Dashboard **does not stream** n8n execution results. User refreshes Campaigns/Leads/Drafts after 30s–3min.

### 6.2 Find Leads special case

```
POST body: business_type, city, country, source, max_results
  → COUNT campaigns for type+city
  → pickSuburb() (metro rotation)
  → triggerWf1({ city: metro, searchQuery: "type in Suburb, AU", … })
```

### 6.3 Research / AI Draft / Send

```
POST body: { batch_size? }
  → COUNT eligible leads
  → if 0 → 400-style business error JSON
  → else triggerWf2/3/4({ batchSize })
```

**Important:** n8n `config.batchSize` inside the workflow may be hardcoded (e.g. `1`) and **ignore** the webhook body unless the workflow is wired to read `$json.batchSize`. Dashboard sending `5` does not guarantee 5 processed.

### 6.4 Drafts review API

```
POST /api/drafts/:id
  { action: "approve" | "reject" | "edit", subject?, body?, reason? }
  → validate lead exists + status === pending_review
  → UPDATE leads + sync email_drafts
  → JSON result
```

This path **does not call n8n**. It only mutates DB so WF4 can pick approved rows later.

---

## 7. Database flow

### 7.1 Connection

`lib/db/index.ts` creates a `pg` `Pool` from:

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

Helper: `query<T>(sql, params?) → T[]`.

### 7.2 Who writes what

| Actor | Writes |
|-------|--------|
| WF1 | `campaigns`, `leads` (status `new` / `no_website`), `workflow_logs` |
| WF2 | `leads` enrichment fields + status (`enriched`, `no_email`, …) |
| WF3 | `leads` audit/email fields + `pending_review`; `email_drafts` |
| Dashboard drafts API | `leads` status `approved`/`rejected`; `email_drafts` status |
| WF4 | `leads` `sending`/`sent`/`send_failed`; `email_logs`; draft `sent` |

| Actor | Reads |
|-------|--------|
| Dashboard pages | Almost all tables for display |
| `getPipelineCounts` | Aggregates on `leads.status` |
| WF2–WF4 | `SELECT … FOR UPDATE SKIP LOCKED` claim patterns |

### 7.3 Status state machine (simplified)

```
new → enriching → enriched → auditing → pending_review
                                         ├─ approve → approved → sending → sent
                                         └─ reject  → rejected

Branches: no_website, no_email, enrich_failed, audit_failed, send_failed
```

Dashboard step locks map to:

| Step | Requires count |
|------|----------------|
| Research | `new` + website |
| AI Draft | `enriched` + email |
| Drafts UI | `pending_review` |
| Send | `approved` |

---

## 8. n8n integration

### 8.1 Contract

| Env var | Workflow | Typical path |
|---------|----------|--------------|
| `N8N_WF1_WEBHOOK_URL` | Find leads | `/webhook/wf1-find-leads` |
| `N8N_WF1_FORM_URL` | Fallback form trigger | optional |
| `N8N_WF2_WEBHOOK_URL` | Research | enrichment webhook |
| `N8N_WF3_WEBHOOK_URL` | AI draft | audit webhook |
| `N8N_WF4_WEBHOOK_URL` | Send | `/webhook/wf4-send` |

Production webhooks only work when the workflow is **Active** in n8n. Editor “Listen for test event” is not a substitute for Active + production URL.

### 8.2 Payload shapes (dashboard → n8n)

**WF1 (webhook JSON):**

```json
{
  "business_type": "plumber",
  "city": "Sydney",
  "country": "AU",
  "location": "Bondi, AU",
  "source": "both",
  "limit": 10,
  "search_query": "plumber in Bondi, AU",
  "started_at": "ISO-8601"
}
```

**WF2 / WF3 / WF4:**

```json
{
  "trigger": "dashboard",
  "batchSize": 5,
  "started_at": "ISO-8601"
}
```

After trigger, n8n **pulls work from Postgres** by status — the webhook is a start signal, not a bag of lead IDs (except WF1 which creates the search).

### 8.3 External systems (owned by n8n, not Next.js)

- Google Places / PageSpeed
- ScraperAPI (crawl)
- OpenAI (draft)
- Resend (send)

Dashboard only needs Postgres + n8n URLs + auth env.

---

## 9. Authentication flow

### 9.1 Model

- **Single admin** from env: `AUTH_USERNAME`, `AUTH_PASSWORD`
- Session: HMAC-SHA256 signed token in httpOnly cookie `atrium_session`
- Secret: `AUTH_SECRET`
- TTL: 7 days (`lib/auth/index.ts`)

### 9.2 Sequence

```
1. GET /login (public)
2. LoginForm POST /api/auth/login { username, password }
3. Route compares to env credentials
4. createSessionToken(username) → cookie atrium_session
5. Client navigates to /
6. middleware on each request:
   - verifySessionTokenEdge(cookie, AUTH_SECRET)
   - invalid → redirect /login?next=… (pages) or 401 JSON (APIs)
7. LogoutButton POST /api/auth/logout → clear cookie
```

### 9.3 Why two auth modules?

| Module | Runtime | Used by |
|--------|---------|---------|
| `lib/auth/index.ts` | Node (`crypto`) | API routes create/verify |
| `lib/auth/edge.ts` | Edge (Web Crypto) | `middleware.ts` |

They must stay algorithm-compatible (HMAC-SHA256 + base64url payload).

---

## 10. End-to-end data flow (UI → n8n → DB → UI)

### 10.1 Happy path narrative

1. **Login** → session cookie.
2. **Find Leads** form → `/api/workflows/find-leads` → suburb pick → `triggerWf1` → n8n WF1 creates `campaigns` + inserts `leads` (`new`).
3. User opens **Campaigns / Leads** (RSC SQL) → sees new rows.
4. **Research** → `/api/workflows/research` → WF2 claims `new` leads → updates to `enriched` (or failure statuses).
5. **AI Draft** → WF3 claims `enriched`+email → writes draft text → `pending_review` + `email_drafts`.
6. **Drafts** page loads pending leads → user **Approve** → `/api/drafts/:id` sets `approved` (DB only).
7. **Send** → WF4 claims `approved` → Resend → `sent` + `email_logs`.
8. Home **pipeline counts** update on next refresh.

### 10.2 Sequence diagram (Find Leads)

```
Browser          Next API              Postgres           n8n WF1
   │                │                     │                  │
   │ POST find-leads│                     │                  │
   │───────────────►│ COUNT campaigns     │                  │
   │                │────────────────────►│                  │
   │                │ pickSuburb          │                  │
   │                │ POST webhook ─────────────────────────►│
   │                │◄──── 200 ──────────────────────────────│
   │◄─── {ok:true} ─│                     │                  │
   │                │                     │  INSERT campaign │
   │                │                     │◄─────────────────│
   │                │                     │  INSERT leads    │
   │ refresh /leads │ SELECT leads        │                  │
   │───────────────►│────────────────────►│                  │
   │◄── HTML table ─│                     │                  │
```

### 10.3 What “back” means

There is **no WebSocket** from n8n to the dashboard. “Back” = **read Postgres again** (full page load, `router.refresh()`, or refresh components).

---

## 11. Important files deep-dive

### 11.1 `middleware.ts`

| | |
|--|--|
| **Purpose** | Enforce auth on all non-public routes |
| **Inputs** | Request URL, cookie `atrium_session`, `AUTH_SECRET` |
| **Outputs** | `next()`, redirect to `/login`, or `401` JSON |
| **Dependencies** | `@/lib/auth/edge` |

### 11.2 `app/layout.tsx`

| | |
|--|--|
| **Purpose** | Global HTML shell, fonts, nav |
| **Inputs** | `children` |
| **Outputs** | Document structure |
| **Dependencies** | `AppNav`, `globals.css`, `next/font/google` |

### 11.3 `app/page.tsx`

| | |
|--|--|
| **Purpose** | Product home + pipeline lock overview |
| **Inputs** | DB via `getPipelineCounts()` |
| **Outputs** | RSC HTML |
| **Dependencies** | `@/lib/pipeline/counts` |

### 11.4 `lib/db/index.ts`

| | |
|--|--|
| **Purpose** | Shared Postgres pool |
| **Inputs** | SQL string + params; env DB config |
| **Outputs** | Row arrays |
| **Dependencies** | `pg` |

### 11.5 `lib/n8n/client.ts`

| | |
|--|--|
| **Purpose** | All outbound webhook/form calls to n8n |
| **Inputs** | Typed payloads / batchSize; env URLs |
| **Outputs** | `{ ok, status, body, mode? }` |
| **Dependencies** | `fetch`, `process.env.N8N_*` |

### 11.6 `lib/auth/index.ts` + `edge.ts`

| | |
|--|--|
| **Purpose** | Session token create (Node) / verify (Node + Edge) |
| **Inputs** | username / token / secret |
| **Outputs** | token string or validity |
| **Dependencies** | Node `crypto` or Web Crypto |

### 11.7 `lib/pipeline/counts.ts`

| | |
|--|--|
| **Purpose** | Step-lock metrics for Home and step pages |
| **Inputs** | `leads` table |
| **Outputs** | `{ newReady, enrichedReady, pendingReview, approved }` |
| **Dependencies** | `lib/db` |

### 11.8 `lib/leads/metro-suburbs.ts`

| | |
|--|--|
| **Purpose** | Rotate Google search geography for major AU metros |
| **Inputs** | city string, prior campaign count |
| **Outputs** | `{ suburb, metro } \| null` |
| **Dependencies** | none (pure) |

### 11.9 `app/api/workflows/find-leads/route.ts`

| | |
|--|--|
| **Purpose** | Orchestrate WF1 trigger + suburb rotation |
| **Inputs** | JSON body from `FindLeadsForm` |
| **Outputs** | JSON including `suburb`, `search_query` |
| **Dependencies** | `query`, `pickSuburb`, `triggerWf1` |

### 11.10 `app/api/drafts/[id]/route.ts`

| | |
|--|--|
| **Purpose** | Human review mutations |
| **Inputs** | lead id + action payload |
| **Outputs** | JSON status message |
| **Dependencies** | `query`; tables `leads`, `email_drafts` |

### 11.11 `components/workflow/*`

| File | Purpose | Inputs | Outputs |
|------|---------|--------|---------|
| `FindLeadsForm.tsx` | Collect search params | User form | POST find-leads |
| `StartResearchButton.tsx` | Start WF2 | `batch_size: 5` | POST research |
| `StartAiDraftButton.tsx` | Start WF3 | `batch_size: 1` (hardcoded in component) | POST ai-draft |
| `StartSendButton.tsx` | Start WF4 | `batch_size: 5` | POST send |
| `StepLockNotice.tsx` | Explain why step locked | props | UI only |

### 11.12 `types/index.ts`

| | |
|--|--|
| **Purpose** | Domain types for tables/pages |
| **Inputs** | — |
| **Outputs** | `Lead`, `Campaign` types |
| **Dependencies** | none |

### 11.13 Config files

| File | Purpose |
|------|---------|
| `package.json` | Scripts `dev/build/start`; deps next/react/pg |
| `tsconfig.json` | `@/*` paths |
| `next.config.ts` | Minimal Next config |
| `.env.example` | Contract for required secrets |

---

## 12. Mental model for mentors

When debugging with a mid-level developer, ask in this order:

1. **Auth?** Cookie present? `AUTH_SECRET` set? Middleware blocking API with 401?
2. **DB?** Same database as n8n? Lead `status` what you expect?
3. **Trigger?** Workflow **Active**? Production webhook URL in `.env.local`?
4. **Batch?** n8n `config.batchSize` vs dashboard `batch_size`?
5. **Async?** Did they wait and refresh? Dashboard does not poll n8n executions.
6. **Human gate?** Send empty because nothing `approved`?

### One-sentence architecture

> **Atrium Reach is a Next.js BFF + UI over a Postgres lead state machine, with n8n as the asynchronous worker fleet and a human approval checkpoint before Resend.**

---

## Appendix A — Env checklist

```
POSTGRES_*
AUTH_USERNAME / AUTH_PASSWORD / AUTH_SECRET
N8N_WF1_WEBHOOK_URL
N8N_WF2_WEBHOOK_URL
N8N_WF3_WEBHOOK_URL
N8N_WF4_WEBHOOK_URL
```

## Appendix B — Related docs

- `helping_materials/SYSTEM_ARCHITECTURE.md` — original n8n-centric design (note: earlier docs assumed more autonomy; product now requires human approve)
- `helping_materials/FUNCTIONAL_REQUIREMENTS.md`
- `dashboard/PART_*_TEST.md` — stepwise verification guides
- `database/schema.sql` — authoritative DDL

---

*End of architecture document.*
