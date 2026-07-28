# Step 1 — Auth (1 admin user)

## What it does
- One admin login from `.env.local`
- Session cookie (7 days)
- All pages/APIs protected except `/login` and auth APIs
- Nav **Logout** button

## `.env.local` (required)
```
AUTH_USERNAME=admin
AUTH_PASSWORD=your-strong-password
AUTH_SECRET=long-random-string
```

Restart `npm run dev` after changing env.

---

## Test

1. Restart dashboard
2. Open http://localhost:3000 → should redirect to **/login**
3. Wrong password → error
4. Correct username/password → Home
5. Open `/find-leads`, `/drafts` → works
6. Click **Logout** → back to login
7. Incognito `/drafts` → login required

### PASS
- [ ] Redirect to login when logged out
- [ ] Bad password rejected
- [ ] Good password opens dashboard
- [ ] Logout works
- [ ] API without cookie returns 401 (e.g. POST find-leads from logged-out browser)

### FAIL
- “Auth is not configured” → add AUTH_* to `.env.local` + restart
- Always login loop → AUTH_SECRET missing / middleware
