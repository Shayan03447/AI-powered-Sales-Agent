# Step 2 — Cleanup (Send coming soon + Review → Drafts)

## What changed
- `/send` → clear “Coming soon” (no WF4 yet)
- `/review` → redirects to `/drafts`
- Send API returns 503 with clear message
- Home + approved banner wording updated

## Test
1. Login
2. Open `/send` → Coming soon + links to Drafts / Home
3. Open `/review` → lands on `/drafts`
4. Find / Research / AI Draft / Approve still work
5. Nav has no new Send link (unchanged)

### PASS
- [ ] `/send` not broken / not “Part 6”
- [ ] `/review` → drafts
- [ ] Core flow unchanged
