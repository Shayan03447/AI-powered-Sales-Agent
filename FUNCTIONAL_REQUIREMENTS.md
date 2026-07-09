# Functional & Non-Functional Requirements
## AI-Powered Digital Marketing Agency Outbound Automation

> **Document type:** Functional Requirements Document (FRD)  
> **Status:** Planning — agreed in design discussion  
> **Last updated:** 2026-06-25

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Scope](#2-scope)
3. [Actors](#3-actors)
4. [Functional Requirements](#4-functional-requirements)
5. [Business Rules](#5-business-rules)
6. [Lead Status Model](#6-lead-status-model)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Assumptions & Constraints](#8-assumptions--constraints)
9. [End-to-End Flow](#9-end-to-end-flow)
10. [Architecture Decision: Multi-Workflow](#10-architecture-decision-multi-workflow)
11. [Open Decisions](#11-open-decisions)

---

## 1. Project Overview

### 1.1 Purpose

Automate outbound sales research for a **digital marketing agency**. The system finds local businesses, analyzes their digital presence (website and social media), identifies improvement opportunities, and drafts personalized outreach emails pitching agency services.

### 1.2 Problem Statement

Manually finding businesses, checking websites, auditing social profiles, and writing custom emails is slow and repetitive. This system automates research and drafting while keeping a human in control of what gets sent.

### 1.3 Success Criteria

- User can start a campaign with **business type + city** in minutes
- System discovers businesses from directories and enriches them automatically
- Each lead gets a **specific audit** based on real data (not generic spam)
- User **reviews and approves** emails before send
- Sent emails reference actual findings from website and social audit

---

## 2. Scope

### 2.1 In Scope (v1)

| Area | Included |
|---|---|
| Campaign input | Business type + city/area |
| Lead discovery | Google Maps and Yelp |
| Website enrichment | Crawl key pages; extract email and social links |
| Website audit | Speed, mobile, SEO, content/structure signals |
| Social audit | Facebook and Instagram (from website links only) |
| Email generation | AI-drafted personalized outreach |
| Human review | Approve, edit, or reject before send |
| Email delivery | Send approved emails; log results |

### 2.2 Out of Scope (v1)

- Direct messaging on Facebook, Instagram, or LinkedIn
- Inbound reply handling or CRM pipeline
- Payment, proposals, or contracts
- Full-site crawl (every page on large websites)
- Fully automatic send without human approval
- Contact-form submission when no email is found
- LinkedIn outreach automation

---

## 3. Actors

| Actor | Description |
|---|---|
| **Agency User** | Starts campaigns, reviews audit results, approves/edits/rejects emails |
| **System** | Discovers leads, crawls, audits, drafts emails, sends on approval |
| **Lead (Business Owner)** | Receives outreach email |

---

## 4. Functional Requirements

### FR-1: Campaign Management

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | User shall enter **business type/keyword** (e.g. dental, real estate agency, plumber) | Must |
| FR-1.2 | User shall enter **city or geographic area** (e.g. Houston, Karachi, Brooklyn NY) | Must |
| FR-1.3 | System shall validate both fields before starting a campaign | Must |
| FR-1.4 | System shall create a **campaign record** with type, location, timestamp, and status | Must |
| FR-1.5 | User shall view list of past campaigns and their progress | Should |
| FR-1.6 | System shall allow configurable **max leads per campaign** to control cost and review workload | Should |

**Confirmed design choice:** Campaign mode is **search by type + location** (not single-business lookup). One run discovers many businesses matching the criteria.

---

### FR-2: Lead Discovery (Google Maps & Yelp)

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | System shall search **Google Maps (Places API)** using business type + location | Must |
| FR-2.2 | System shall search **Yelp API** using business type + location | Must |
| FR-2.3 | For each result, system shall capture: business name, category, phone, address, city, rating, review count, website URL, source, external ID | Must |
| FR-2.4 | System shall **deduplicate** leads (same business from both sources or repeat campaigns) | Must |
| FR-2.5 | System shall save new leads with status **`new`** | Must |
| FR-2.6 | System shall skip or flag leads with **no website URL** in directory listing | Must |
| FR-2.7 | User shall optionally choose **Google only**, **Yelp only**, or **both** | Should |

**Minimum captured fields per lead:**

```
business_name, category, phone, address, city, state/country,
rating, review_count, website_url, source (gmb | yelp), external_id
```

---

### FR-3: Website Crawling & Contact Extraction

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | System shall process leads with status **`new`** that have a website URL | Must |
| FR-3.2 | System shall crawl a **bounded set of pages**, not the entire site: homepage, contact, about, and linked contact/about variants | Must |
| FR-3.3 | System shall extract **email address(es)** from crawled HTML | Must |
| FR-3.4 | System shall extract **social profile URLs**: Facebook, Instagram, LinkedIn (when present on site) | Must |
| FR-3.5 | System shall store crawl metadata (pages visited, crawl timestamp) | Should |
| FR-3.6 | If **no email found**, lead status shall become **`no_email`** or **`enrich_failed`** with reason | Must |
| FR-3.7 | If enrichment succeeds, lead status shall become **`enriched`** | Must |
| FR-3.8 | System shall handle crawl failures (timeout, blocked, invalid URL) without stopping the whole campaign | Must |
| FR-3.9 | System shall retry failed crawls up to a configurable limit | Should |

**Pages to crawl (bounded):**

- Homepage
- Contact / Contact Us
- About / About Us
- Footer/header links that resolve to contact or about pages

---

### FR-4: Website Audit

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | System shall audit each enriched lead's website for **performance** (page speed, mobile score) | Must |
| FR-4.2 | System shall audit for **SEO signals** (meta tags, structure, basic on-page issues) | Must |
| FR-4.3 | System shall identify **content/UX issues** (missing/weak contact page, weak CTA, thin content) | Must |
| FR-4.4 | System shall produce a structured list of **pain points** per lead | Must |
| FR-4.5 | Each pain point shall include a suggested **agency solution** (e.g. speed optimization, SEO fix, redesign) | Must |
| FR-4.6 | Audit results shall be stored and linked to the lead record | Must |
| FR-4.7 | System shall store raw scores/metrics (e.g. PageSpeed 0–100) for use in email personalization | Should |

**Example website pain point structure:**

```json
{
  "area": "performance",
  "problem": "Mobile score is 42/100 — site loads slowly on phones",
  "solution": "Mobile speed optimization and responsive improvements",
  "severity": "high"
}
```

**Audit areas (website condition / improvable items):**

- Slow load speed / poor mobile score
- Low SEO signals (missing meta, poor structure)
- Outdated or weak design/content signals (where detectable)
- Missing or weak contact/CTA
- Broken or thin content on key pages

---

### FR-5: Social Media Audit (Facebook & Instagram)

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | System shall audit social profiles **only when URLs were found on the business website** | Must |
| FR-5.2 | System shall **not send messages** on Facebook or Instagram | Must |
| FR-5.3 | For Facebook, system shall check public signals: profile exists, last post date, posting frequency, profile completeness | Must |
| FR-5.4 | For Instagram, system shall check public signals: profile exists, last post date, posting frequency, bio/link completeness | Must |
| FR-5.5 | System shall produce structured **social pain points** with agency solutions | Must |
| FR-5.6 | If no social links found on website, social audit shall be **skipped** (website-only email) | Must |
| FR-5.7 | System shall handle inaccessible or private profiles gracefully (note as unavailable; continue pipeline) | Must |

**Confirmed design choice:** Social profiles are **audited for pain points** and findings are included in the **email**. Outreach channel remains **email only** — no automated DMs on Facebook or Instagram.

**Example social pain point structure:**

```json
{
  "platform": "instagram",
  "problem": "No posts in the last 4 months",
  "solution": "Content calendar and regular posting strategy",
  "severity": "medium"
}
```

---

### FR-6: AI Email Personalization

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | System shall generate a **personalized email subject line** per lead | Must |
| FR-6.2 | System shall generate a **personalized email body** using: business info, website audit, social audit (if any), agency services | Must |
| FR-6.3 | Email shall follow **problem → solution → soft CTA** structure | Must |
| FR-6.4 | Pain points in email shall reference **actual audit data**, not generic templates | Must |
| FR-6.5 | Draft email shall be saved; lead status shall become **`pending_review`** | Must |
| FR-6.6 | System shall support configurable **agency profile block** (company name, services, signature, calendar link) | Should |
| FR-6.7 | System shall support configurable **email language/tone** (e.g. English, professional) | Should |
| FR-6.8 | If AI draft fails, lead status shall become **`audit_failed`** with reason | Must |

**Email intent:** Convince the business owner that their website/social has specific problems and that the agency can solve them (e.g. "your website has X issue; we can fix it with Y").

---

### FR-7: Human Review & Approval

| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | Agency user shall view all leads with status **`pending_review`** | Must |
| FR-7.2 | Review screen shall show: business summary, email address, website audit summary, social audit summary, draft email | Must |
| FR-7.3 | User shall **approve** draft email as-is | Must |
| FR-7.4 | User shall **edit** draft email then approve | Must |
| FR-7.5 | User shall **reject/skip** a lead with optional reason | Must |
| FR-7.6 | **No email shall be sent without explicit user approval** | Must |
| FR-7.7 | User shall bulk-approve or bulk-reject | Could |

**Confirmed design choice:** **Human review before send** is mandatory — not fully automatic outreach.

| User Action | Resulting Status |
|---|---|
| Approve | Ready to send → **`sent`** after delivery |
| Edit + Approve | Ready to send → **`sent`** after delivery |
| Reject / Skip | **`rejected`** |

---

### FR-8: Email Sending & Logging

| ID | Requirement | Priority |
|---|---|---|
| FR-8.1 | System shall send approved emails via **SMTP** | Must |
| FR-8.2 | System shall log every send attempt: lead ID, to, subject, body, timestamp, result | Must |
| FR-8.3 | On successful send, lead status shall become **`sent`** | Must |
| FR-8.4 | On send failure, lead status shall become **`send_failed`** with error reason | Must |
| FR-8.5 | System shall prevent **duplicate emails** to the same business within the same campaign | Must |
| FR-8.6 | System shall enforce **one outreach email per lead per campaign** | Must |

---

### FR-9: Lead Status & Pipeline Tracking

| ID | Requirement | Priority |
|---|---|---|
| FR-9.1 | Every lead shall have a traceable **status** through the pipeline | Must |
| FR-9.2 | User shall filter/view leads by status | Must |
| FR-9.3 | System shall record **failure reasons** for failed states | Must |
| FR-9.4 | User shall see campaign-level stats (discovered, enriched, pending review, sent, failed) | Should |

---

### FR-10: Error Handling & Resumability

| ID | Requirement | Priority |
|---|---|---|
| FR-10.1 | Failure of one lead shall not stop processing of other leads in the campaign | Must |
| FR-10.2 | System shall support **retry** for transient failures (crawl timeout, API rate limit) | Should |
| FR-10.3 | After system restart, processing shall resume from last known lead status | Must |
| FR-10.4 | System shall log workflow run stats (processed, failed, duration) | Should |

---

## 5. Business Rules

| Rule | Description |
|---|---|
| BR-1 | **No email = no outreach.** Contact form alone is not sufficient in v1. |
| BR-2 | **Social audit is optional** — only when Facebook/Instagram links exist on the website. |
| BR-3 | **Human approval is mandatory** before any email is sent. |
| BR-4 | **Pain points must be evidence-based** — tied to audit metrics, not generic claims. |
| BR-5 | **No duplicate outreach** — same business not emailed twice in one campaign. |
| BR-6 | **Bounded crawl only** — homepage, contact, about; not full-site spider. |
| BR-7 | **Social = audit only** — no automated DMs on Facebook or Instagram. |
| BR-8 | **Type + location required** — user must provide both business type and city/area to start a campaign. |

---

## 6. Lead Status Model

### 6.1 Status Values

| Status | Meaning |
|---|---|
| `new` | Discovered; not yet enriched |
| `enriched` | Email and audit data collected |
| `pending_review` | AI draft ready; awaiting human approval |
| `approved` | User approved; ready for send workflow (intermediate, optional) |
| `sent` | Email successfully delivered |
| `rejected` | User skipped this lead |
| `no_email` | No contact email found on website |
| `enrich_failed` | Crawl or enrichment failed |
| `audit_failed` | Audit or AI draft failed |
| `send_failed` | Approved but SMTP send failed |

### 6.2 Status Flow

```
new
  → enriched          (email + data found)
  → no_email          (no email on website)
  → enrich_failed     (crawl failed)

enriched
  → pending_review    (audit done + email drafted)
  → audit_failed      (audit or AI draft failed)

pending_review
  → sent              (user approved + email delivered)
  → rejected          (user rejected)
  → send_failed       (approved but SMTP failed)
```

---

## 7. Non-Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-1 | System shall process leads in **batches** to avoid API rate limits | Must |
| NFR-2 | Sensitive credentials (API keys, SMTP) shall be stored securely, not in plain text in workflows | Must |
| NFR-3 | System shall be **resumable** after crash or restart | Must |
| NFR-4 | Audit and draft generation should complete within reasonable time per lead (target: under 2–3 minutes per lead) | Should |
| NFR-5 | Email content shall comply with basic cold-email practices (unsubscribe/contact info where required) | Should |
| NFR-6 | Workflows shall be **decoupled** — failure in one stage shall not cascade to others | Must |
| NFR-7 | Each workflow stage shall support **independent batch size and schedule** | Should |
| NFR-8 | System shall support **observability** — traceable status and failure reasons per lead | Must |
| NFR-9 | Social audit shall be **best-effort** — unavailable profiles shall not block the pipeline | Must |
| NFR-10 | Campaign size shall be **capped** to control API and AI costs | Should |

### 7.1 Expected Platform Stack (Planning Reference)

| Component | Role |
|---|---|
| n8n (self-hosted) | Workflow orchestration |
| PostgreSQL | Data store and job queue (status-based) |
| ScraperAPI | Website crawling |
| Google PageSpeed Insights API | Website performance/SEO metrics |
| Google Places API | Business discovery |
| Yelp Fusion API | Business discovery |
| OpenAI / Claude | AI audit summary and email drafting |
| SMTP | Outbound email delivery |
| Review layer (Google Sheets, Airtable, or simple UI) | Human approval gate |

### 7.2 Buildability Notes (n8n)

- **Core pipeline (~80–90%)** is buildable in n8n with PostgreSQL as shared state.
- **Human review UI** is not native to n8n — requires external review layer (Sheets, Airtable, or custom UI).
- **Social audit** is partially buildable — public profile scraping is fragile; design for skip/fallback.
- **Single monolithic workflow is not recommended** — use separate workflows per pipeline stage.

---

## 8. Assumptions & Constraints

### 8.1 Assumptions

| ID | Assumption |
|---|---|
| A-1 | Businesses are listed on Google Maps and/or Yelp with at least basic info |
| A-2 | Many businesses will **not** have public emails — significant drop-off at enrichment is expected |
| A-3 | Facebook/Instagram public data may be limited without official API access |
| A-4 | User has valid API keys: Google Places, Yelp, scraping service, AI provider, SMTP |
| A-5 | Outreach is **email-only** in v1 |
| A-6 | Agency user has authority to send cold outreach emails in their jurisdiction |

### 8.2 Constraints

| ID | Constraint |
|---|---|
| C-1 | Yelp and Google APIs have usage costs — campaign size should be capped |
| C-2 | Website crawling may be blocked by some sites — failures are expected |
| C-3 | n8n execution timeouts limit single long-running pipeline runs |
| C-4 | Social platform HTML structure changes may break scrapers |
| C-5 | Human review introduces delay between draft and send — by design |

---

## 9. End-to-End Flow

### 9.1 Summary

1. User enters business type + city (e.g. `dental` + `Houston`)
2. System discovers businesses from Google Maps and Yelp
3. For each business with a website:
   - Crawl key pages → find email and social links
   - Audit website (speed, SEO, UX)
   - Audit Facebook/Instagram if links found on website
   - AI writes personalized email with pain points and solutions
4. User reviews drafts in `pending_review` queue
5. User approves → system sends email → logs result
6. User rejects → lead skipped

### 9.2 Example Run

```
INPUT:     "dental" + "Houston"
DISCOVER:  47 dental clinics (Google + Yelp, duplicates removed)
CRAWL:     31 had websites → 18 emails found
AUDIT:     18 website + social audits completed
DRAFT:     18 personalized emails ready (pending_review)
REVIEW:    User approves 12, edits 3, rejects 3
SEND:      15 emails sent successfully
```

---

## 10. Architecture Decision: Multi-Workflow

**Decision:** Use **separate n8n workflows** per pipeline stage, not one monolithic workflow.

| Workflow | Purpose | Input Status | Output Status |
|---|---|---|---|
| WF1 — Lead Discovery | Search Google Maps + Yelp; insert leads | — | `new` |
| WF2 — Enrichment | Crawl website; extract email/socials; website metrics | `new` | `enriched` / `enrich_failed` / `no_email` |
| WF3 — Audit & Draft | Website + social audit; AI email draft | `enriched` | `pending_review` / `audit_failed` |
| Review Layer | Human approve/edit/reject (external to n8n) | `pending_review` | `approved` / `rejected` |
| WF4 — Email Send | SMTP send approved emails | `approved` | `sent` / `send_failed` |

**Communication:** Workflows do not call each other directly. They communicate through **PostgreSQL status fields** only.

**Rationale:**

- Human review breaks a single long-running workflow
- Different stages need different batch sizes and schedules
- Fault isolation — one failed crawl does not stop the whole pipeline
- Resumability after crash via DB state
- Easier development, testing, and debugging per stage

---

## 11. Open Decisions

These items are not yet finalized and should be decided before implementation:

| # | Decision | Options |
|---|---|---|
| OD-1 | Discovery sources | Both always vs user picks Google / Yelp / both |
| OD-2 | Max leads per campaign | e.g. 25 / 50 / 100 |
| OD-3 | Email language | English only vs bilingual |
| OD-4 | Social audit depth | Minimum checks: last post date, post count, profile completeness |
| OD-5 | Review UX | List view vs one-by-one approval; Google Sheets vs Airtable vs custom UI |
| OD-6 | Agency branding block | Fixed signature, calendar link, portfolio URL |
| OD-7 | Retry policy | Max retries for crawl, audit, and send failures |

---

*Functional & Non-Functional Requirements — AI-Powered Digital Marketing Agency Outbound Automation*  
*Atrium Solution — Planning Document*
