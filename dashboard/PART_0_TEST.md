# Part 0 — Concept + How to Test

## Goal
Prove the dashboard website can talk to PostgreSQL and show data.

Login is NOT in this step. First prove DB connection.

---

## What each file means

| File | Concept |
|---|---|
| `package.json` | Project ingredients list (Next.js, React, pg) |
| `tsconfig.json` | TypeScript settings + `@/` path shortcut |
| `next.config.ts` | Next.js config (empty for now) |
| `.env.example` | Template of DB secrets |
| `.env.local` | Your real DB password (you create this; never commit) |
| `lib/db/index.ts` | Phone line to PostgreSQL |
| `types/index.ts` | Shape of a Lead object |
| `app/layout.tsx` | Shell around every page |
| `app/globals.css` | Basic page styling |
| `app/page.tsx` | Home page: fetch 1 lead and show it |

Other folders stay placeholders for later parts.

---

## Setup (once)

1. Open terminal in `dashboard/`
2. Run: `npm install`
3. Copy `.env.example` → `.env.local`
4. Put your real Postgres values in `.env.local`
5. Run: `npm run dev`
6. Open: http://localhost:3000

---

## Test checklist (PASS / FAIL)

### PASS if you see ANY of these
- [ ] Green message: **Connected — 1 lead loaded** + business name
- [ ] OR green message: **Connected to database** + “No leads yet”

### FAIL if you see
- [ ] Red **DB connection failed**
- [ ] Page will not open / npm errors

### Optional stronger pass
Insert one test lead in Postgres, refresh page, see that business name.

```sql
INSERT INTO leads (business_name, city, status)
VALUES ('Test Bakery', 'Houston', 'new');
```

---

## Rule
If Part 0 PASS → tell me → we start Part 1.  
If FAIL → share the red error text → we fix before moving on.
