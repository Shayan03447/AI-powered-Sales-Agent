# Client Dashboard — Step-by-Step Build Plan

> Goal: Client-friendly UI with **Start buttons per step**, correct sequence, test after each part, scalable later.  
> Stack: Next.js + PostgreSQL (same DB) + n8n webhooks (WF1–WF4)

---

## Correct Client Flow (do not change)

```
1. Create Campaign (type + city)
2. [Start] Find Leads        → see leads
3. [Start] Research          → see emails/scores
4. [Start] AI Draft Emails   → see drafts
5. Approve / Edit / Reject
6. [Start] Send Approved     → see sent/failed
```

Rules:
- Client runs **one step at a time**
- Next button unlocks only when previous step has results
- No email send without Approve
- n8n does work; dashboard only triggers + shows status

---

## Build Order (part → test → next)

### Part 0 — Foundation
**Build**
- Next.js app
- Connect PostgreSQL (`leads` table)
- Basic layout + login (simple email/password)

**Test**
- [ ] Login works
- [ ] Can read 1 lead from DB on screen

---

### Part 1 — Campaign + Leads List (read-only)
**Build**
- Campaigns list from DB (created by WF1 — dashboard does NOT insert)
- Leads table (name, city, status, website)

**Test**
- [ ] Campaigns page loads (list or empty)
- [ ] Leads list loads / empty state shows

---

### Part 2 — Button: Find Leads (WF1)
**Build**
- Form: business type + city (input only)
- Button: `Find Leads`
- Call n8n WF1 webhook (pass type + city)
- WF1 creates campaign + inserts leads
- Show status: running / done / failed
- Refresh campaigns + leads lists

**Test**
- [ ] Click button → WF1 runs
- [ ] New campaign row appears
- [ ] New leads appear with status `new`
- [ ] Button disabled while running

---

### Part 3 — Button: Research (WF2)
**Build**
- Button: `Start Research`
- Call WF2 webhook
- Show enrichment fields (email, scores)
- Status moves `new` → `enriched` / `no_email` / `enrich_failed`

**Test**
- [ ] Only works if leads exist
- [ ] Emails/scores show after run
- [ ] Failed leads show reason

---

### Part 4 — Button: AI Draft (WF3)
**Build**
- Button: `Create AI Emails`
- Call WF3 webhook
- Draft list: subject + body + audit summary
- Status → `pending_review`

**Test**
- [ ] Drafts appear per lead
- [ ] Only enriched leads with email get drafts

---

### Part 5 — Review Actions
**Build**
- Approve / Edit / Reject
- Edit saves new subject/body
- Approve → status `approved`
- Reject → status `rejected`

**Test**
- [ ] Edit persists
- [ ] Approve/Reject updates status
- [ ] Rejected leads never send

---

### Part 6 — Button: Send (WF4)
**Build**
- Button: `Send Approved`
- Call WF4 webhook
- Show `sent` / `send_failed`
- Simple send log view

**Test**
- [ ] Only approved leads send
- [ ] Sent status + timestamp show
- [ ] Failures visible

---

### Part 7 — Step Lock + UX
**Build**
- Lock sequence (Step 2 locked until Step 1 done, etc.)
- Stop/cancel running state (disable + clear “running” flag)
- Simple progress: Step 1/2/3/4
- Client language labels (no n8n jargon)

**Test**
- [ ] Wrong-order clicks blocked
- [ ] Client can finish full chain alone

---

### Part 8 — Scale Ready (light)
**Build**
- `campaign_id` on leads
- Multi-campaign list
- Env-based webhook URLs
- Basic error logging

**Test**
- [ ] 2 campaigns don’t mix leads
- [ ] Webhooks work from staging/prod env

---

## n8n Changes Needed (minimal)

1. Add **Webhook Trigger** to WF1–WF4 (keep or pause schedules)
2. WF3 final status = `pending_review` (not auto `approved`)
3. WF4 only picks `approved`
4. Optional: accept `campaign_id` in webhook body

No rewrite of scrape/AI/email logic.

---

## Definition of Done (client ready)

- Client can run full chain with buttons only
- Sees results after every step
- Approves before send
- No technical terms required
- One campaign works end-to-end

---

## Suggested Timeline

| Part | Days |
|---|---|
| 0–1 | 2 |
| 2–3 | 3 |
| 4–5 | 3 |
| 6–7 | 3 |
| 8 + polish | 2–3 |
| **Total** | **~13–16 days** |

Rule: **never start next part until current part tests pass.**
