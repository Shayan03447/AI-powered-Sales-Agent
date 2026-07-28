# Part 6 — Send (WF4 + Resend)

## Full flow
```
Approve on /drafts → status approved
→ /send → Send Approved
→ n8n webhook wf4-send
→ Resend API
→ sent | send_failed
```

---

## A) n8n WF4 setup

1. Import / open **WF4 — Email Send.json** (updated: Webhook + Resend, SMTP removed)
2. Confirm:
   - Schedule **disabled**
   - **Webhook — Send Approved** path `wf4-send` → `config`
   - **Resend — Send Approved Email** HTTP node present
3. Postgres credential = same DB as dashboard
4. n8n environment variables (Docker / n8n Settings → Variables):

```
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=sales@yourdomain.com
RESEND_FROM_NAME=Atrium Solution
```

5. Domain must be **Verified** in Resend first (DNS)
6. Workflow **Active / Published**
7. Production URL:
   `http://localhost:5678/webhook/wf4-send`

Without API key / verified domain, Send button may start WF4 but emails fail → `send_failed`.

---

## B) Dashboard `.env.local`

```
N8N_WF4_WEBHOOK_URL=http://localhost:5678/webhook/wf4-send
```

Restart `npm run dev`.

---

## C) Test

1. Login
2. Have ≥1 lead `approved` + `email_drafts.status = approved`
3. Open `/send` — waiting count > 0
4. Click **Send Approved**
5. n8n Executions → WF4 via webhook
6. Resend dashboard → email log (after domain+key)
7. `/send` table or `/leads` → `sent` or `send_failed`

### PASS
- [ ] Button locked when no approved
- [ ] Button starts WF4
- [ ] Success → `sent` + email_logs
- [ ] Fail → `send_failed` + reason

### While waiting for domain
- Still wire webhook + Active
- Leave `RESEND_API_KEY` empty only if you accept fail tests
- Or use Resend test after verify

---

## D) Safety
- Only `approved` leads send
- Rejected never picked
- Duplicate sent blocked in WF4 SQL
