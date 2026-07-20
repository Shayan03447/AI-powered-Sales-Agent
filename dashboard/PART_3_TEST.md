# Part 3 — Research (WF2)

## Flow
```
Dashboard /research → Start Research
→ /api/workflows/research
→ n8n WF2 webhook
→ WF2 picks leads status=new, enriches
→ Leads table shows email + scores
```

Form/tables stay separate. Research page = button only.

---

## n8n setup (required once)

Open workflow: **PD - Data Enrichment & Web Crawling**

1. Add **Webhook** node
   - Method: `POST`
   - Path: `wf2-research`
   - Respond: Immediately
2. Connect:
   ```
   Webhook → config → Claim Leads (lock + mark enriching)
   ```
   (Same next node that Schedule / Manual Trigger already use)
3. Keep Schedule if you want auto runs too
4. **Publish / Activate**
5. Copy Production URL, e.g.
   `http://localhost:5678/webhook/wf2-research`

### `.env.local`
```
N8N_WF2_WEBHOOK_URL=http://localhost:5678/webhook/wf2-research
```

Restart `npm run dev`.

---

## Test

1. Have some leads with status `new` + website (from Find Leads)
2. Open http://localhost:3000/research
3. See “Ready to research: N”
4. Click **Start Research**
5. n8n Executions → WF2 running
6. Open **Leads** — status becomes `enriched` / `no_email` / `enrich_failed`
7. Email + Speed + SEO columns fill when enriched

### PASS
- [ ] Button starts WF2
- [ ] Leads leave `new`
- [ ] Email/scores show for enriched leads

### FAIL
- Missing `N8N_WF2_WEBHOOK_URL` → add + restart
- “No leads ready” → run Find Leads first
- Webhook 404 → wrong path / not published
