# Step 4 — n8n production hygiene (WF1–WF3)

WF4 send is still later. This step makes sure workflows only start from the **dashboard**, not on a timer.

---

## Why

| Bad (schedule ON) | Good (dashboard) |
|---|---|
| Auto every 10 min | Client clicks button |
| Surprise API cost | Controlled runs |
| Confusing for client | Clear step locks |

---

## Do this in live n8n (your Docker UI)

### WF1 — Find Leads
- [ ] **Webhook** exists: path `wf1-find-leads`, method POST, Respond Immediately
- [ ] Wire: `Webhook → … → Create Campaign` (same path you use from dashboard)
- [ ] Form trigger optional (can leave for manual tests)
- [ ] Workflow **Active / Published**
- [ ] Production URL matches dashboard:
  `N8N_WF1_WEBHOOK_URL=http://localhost:5678/webhook/wf1-find-leads`
  (on Hostinger later → `https://n8n.yourdomain.com/webhook/wf1-find-leads`)

### WF2 — Research
- [ ] **Schedule — Every 10 Minutes → Disable** (or delete)
- [ ] **Webhook** path `wf2-research` → `config` (or Claim Leads chain)
- [ ] Active / Published
- [ ] `N8N_WF2_WEBHOOK_URL=.../webhook/wf2-research`

### WF3 — AI Draft
- [ ] Schedule already disabled in repo export — confirm in UI too
- [ ] Webhook `wf3-ai-draft` → `config`
- [ ] Active / Published
- [ ] `N8N_WF3_WEBHOOK_URL=.../webhook/wf3-ai-draft`

### Shared
- [ ] Postgres credential points to same DB as dashboard
- [ ] Env keys present in n8n: OpenAI, ScraperAPI, PageSpeed (as needed)
- [ ] Test one button each from dashboard after login

### WF4 (skip for now)
- [ ] Keep **Inactive** or schedule disabled — do not Active until Resend/domain

---

## Repo note
- WF2 + WF3 + WF4 JSON exports: schedule nodes marked `"disabled": true`
- Live n8n may still have old Active schedules — **UI Disable is required**

---

## Test PASS
1. Wait 15+ minutes — no surprise WF2/WF3 runs
2. Dashboard Find / Research / AI Draft still start workflows
3. n8n Executions show **Webhook** as trigger (not Schedule)

---

## Next step after this
**Step 5 — Hostinger VPS deploy** (Postgres + n8n + dashboard + HTTPS)
