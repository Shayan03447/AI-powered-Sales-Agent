# Dashboard Folder Structure

Clean empty hierarchy only. No logic yet. Fill part-by-part from `CLIENT_DASHBOARD_BUILD_PLAN.md`.

```
dashboard/
├── app/                          # Pages + API (Next.js App Router)
│   ├── (auth)/
│   │   └── login/                # Client login page
│   ├── (dashboard)/
│   │   ├── page.tsx              # Home / overview
│   │   ├── campaigns/            # Create + list campaigns
│   │   │   └── [id]/            # Single campaign view
│   │   ├── leads/                # Leads list
│   │   ├── review/               # Approve / Edit / Reject
│   │   └── send/                 # Send results
│   └── api/
│       ├── auth/                 # Login API
│       ├── campaigns/            # Campaign CRUD
│       ├── leads/                # Leads read/update
│       └── workflows/            # Buttons → n8n webhooks
│           ├── find-leads/       # Step 1 (WF1)
│           ├── research/         # Step 2 (WF2)
│           ├── ai-draft/         # Step 3 (WF3)
│           └── send/             # Step 4 (WF4)
├── components/
│   ├── ui/                       # Shared UI pieces
│   ├── campaigns/
│   ├── leads/
│   ├── review/
│   └── workflow/                 # Start / Stop buttons
├── lib/
│   ├── db/                       # PostgreSQL connection
│   ├── n8n/                      # Webhook helpers
│   ├── auth/                     # Auth helpers
│   └── utils.ts
├── types/                        # Shared TypeScript types
├── hooks/                        # React hooks
├── styles/
├── public/                       # Static assets
├── .env.example                  # Env keys (empty template)
└── .gitignore
```

## Build sequence (which folder first)

1. `lib/db` + `app/page.tsx`     → Part 0 (show 1 lead)
2. `campaigns` + `leads`         → Part 1
3. `api/workflows/*`             → Parts 2–4, 6 (buttons)
4. `review`                      → Part 5
5. `components/workflow`         → Part 7 (locks / UX)
