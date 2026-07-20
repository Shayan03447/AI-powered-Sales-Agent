# Part 2 Fix — Use Webhook (not Form URL)

## Problem you saw
- Manual canvas run → campaign completed (e.g. #13 plumber melbourne)
- Dashboard Find Leads → campaigns like `#12 in running · 0/0` with **empty** type/city

Cause: Form Trigger field labels often do not map when called from code.
WF1 still inserts a campaign row, then fails → stuck `running`.

## Fix: add Webhook to WF1 (5 minutes)

### In n8n (PD — Lead Generation & Data Storage)

1. Add node: **Webhook**
2. Settings:
   - HTTP Method: `POST`
   - Path: `wf1-find-leads`
   - Respond: `Immediately` (or When Last Node Finishes — either OK)
3. Add node: **Set** (name: `Set From Webhook`)
   Map these fields from webhook JSON:
   - `business_type` = `{{ $json.business_type }}`
   - `city` = `{{ $json.city }}`
   - `country` = `{{ $json.country }}`
   - `location` = `{{ $json.location }}`
   - `source` = `{{ $json.source }}`
   - `limit` = `{{ $json.limit }}`
   - `search_query` = `{{ $json.search_query }}`
   - `started_at` = `{{ $json.started_at }}`
4. Connect:
   `Webhook` → `Set From Webhook` → **same next node as** `Set Search Parameters1`  
   (that next node is `Postgres — Create Campaign1`)
5. Keep old Form Trigger path too (optional for manual form use)
6. **Publish / Activate** again
7. Copy **Production Webhook URL**  
   Example: `http://localhost:5678/webhook/wf1-find-leads`

### In dashboard `.env.local`

```
N8N_WF1_WEBHOOK_URL=http://localhost:5678/webhook/wf1-find-leads
```

(You can leave Form URL empty.)

Restart:

```
npm run dev
```

### Test
1. /campaigns → Find Leads (plumber + melbourne)
2. New campaign must show **plumber in melbourne** (not empty)
3. Status becomes **completed** with found/inserted > 0

### Clean stuck empty campaigns (optional in Postgres)

```sql
UPDATE campaigns
SET status = 'error',
    error_reason = 'empty fields from form trigger test',
    completed_at = NOW()
WHERE status = 'running'
  AND (business_type IS NULL OR business_type = '' OR city IS NULL OR city = '');
```
