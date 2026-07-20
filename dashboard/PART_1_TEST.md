# Part 1 — Fixed (read-only lists)

## Goal
Show campaigns + leads that already exist in PostgreSQL.

Dashboard does **not** create campaigns.  
WF1 creates campaigns when Find Leads runs (Part 2).

---

## Files after fix

| File | Role |
|---|---|
| `app/api/campaigns/route.ts` | GET only (no POST create) |
| `app/(dashboard)/campaigns/page.tsx` | Campaign list (read-only) |
| `app/(dashboard)/leads/page.tsx` | Leads list (read-only) |
| `components/leads/LeadsTable.tsx` | Table UI |
| `app/page.tsx` | Home links |

Removed: Save Campaign form / DB insert from dashboard.

---

## How to test

1. `npm run dev`
2. Open http://localhost:3000
3. Open **Campaigns** — see WF1 campaigns (or empty message)
4. Open **Leads** — see leads table (e.g. Proximity Plumbing)

### PASS
- [ ] Campaigns page loads (list or empty — no crash)
- [ ] Leads page shows your existing leads
- [ ] No “Save Campaign” form

### FAIL
- Red DB error / page crash

If PASS → Part 2 = form (type+city) + Find Leads button → WF1 webhook.
