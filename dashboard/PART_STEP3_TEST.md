# Step 3 — Step locks (status-based)

## Rules
| Step | Unlocks when |
|---|---|
| Research | At least 1 lead `status = new` (+ website) |
| AI Draft | At least 1 lead `status = enriched` (+ email) |

Examples:
- All enriched, zero new → **Research locked**, AI Draft open
- One new → **Research open**
- Zero enriched → **AI Draft locked**

## Test
1. Home → Pipeline status counts
2. No `new` leads → Research button locked + banner
3. Add/find `new` lead → Research unlocks
4. After research → `enriched` → AI Draft unlocks
5. API still rejects empty queue (already)

### PASS
- [ ] Research needs `new`
- [ ] AI Draft needs `enriched`
- [ ] Clear locked messages
