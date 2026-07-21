# Part 4 — AI Draft (WF3)

## Flow
```
Enriched leads (email found)
→ /ai-draft → Create AI Emails
→ n8n WF3 webhook
→ status auditing → pending_review
→ /drafts shows subject + audit + email body
```

Button page and drafts list stay separate.

---

## n8n setup (required once)

Open: **WF3 — Audit & Email Draft**

1. Add **Webhook**
   - Method: `POST`
   - Path: `wf3-ai-draft`
   - Respond: Immediately
2. Connect:
   ```
   Webhook → config
   ```
   (Same node Schedule / Manual Trigger already connect to)
3. Publish / Activate
4. Copy Production URL:
   `http://localhost:5678/webhook/wf3-ai-draft`

### `.env.local`
```
N8N_WF3_WEBHOOK_URL=http://localhost:5678/webhook/wf3-ai-draft
```

Restart `npm run dev`.

---

## Test

1. Have leads with status `enriched` + email
2. Open `/ai-draft` — see ready count
3. Click **Create AI Emails**
4. n8n Executions → WF3 running
5. Open `/drafts`
   - while running: status `auditing`
   - when done: `pending_review` + Subject + Audit + Email draft

### PASS
- [ ] Button starts WF3
- [ ] Drafts show subject + body + audit
- [ ] Status becomes `pending_review`

### FAIL
- Missing env URL → add + restart
- “No leads ready” → finish Research first
- Webhook 404 → path / publish wrong
