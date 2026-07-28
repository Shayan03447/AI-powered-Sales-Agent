# Part 5 — Review Actions (Approve / Edit / Reject)

## Flow
```
pending_review draft on /drafts
→ Approve  → status approved   (queued until send is enabled)
→ Edit     → save subject/body → still pending_review
→ Reject   → status rejected   (never send)
```

No n8n call in this part — dashboard updates PostgreSQL only.

---

## API

`POST /api/drafts/[leadId]`

| action | body | result |
|---|---|---|
| `approve` | optional `subject`, `body` | lead → `approved`; email_drafts → `approved` |
| `edit` | `subject`, `body` required | lead text updated; stays `pending_review` |
| `reject` | optional `reason` | lead → `rejected`; email_drafts → `rejected` |

Only works when lead `status = pending_review`.

---

## Test

1. Have at least one lead with `pending_review` + subject/body
2. Open `/drafts`
3. **Approve** → badge becomes `approved`
4. Another draft → **Edit** → change subject → **Save edit** → still pending → **Approve**
5. Another draft → **Reject** → confirm → `rejected`

### PASS
- [ ] Approve updates status
- [ ] Edit persists subject/body
- [ ] Reject updates status + reason
- [ ] Only `pending_review` shows action buttons

### FAIL
- 409 “only pending_review” → already approved/rejected
- Empty subject/body on edit → fill both fields
