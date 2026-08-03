# Atrium Reach — Design System

**Product:** Enterprise AI Sales Automation dashboard (Atrium Reach by Atrium Solution)  
**References:** Linear, Vercel, Stripe, Clerk — density, clarity, quiet confidence  
**Constraint:** Functionality unchanged; this is the visual + interaction language  
**Grounded in:** Current screenshot + `dashboard/app/globals.css` tokens (DM Sans + Fraunces)

---

## 1. Design principles

1. **Quiet chrome, loud data** — Header and cards stay calm; status, counts, and tables carry meaning.
2. **One accent** — Teal is the only brand action color. Don’t introduce purple/indigo SaaS clichés.
3. **Pipeline is sacred** — Visual order always mirrors Find → Research → Draft → Review → Send.
4. **Enterprise density without clutter** — Prefer tighter spacing on tables/forms; keep marketing air on Home hero only.
5. **State over decoration** — Badges, locks, and empty states beat gradients and glow.
6. **Accessible by default** — Contrast AA+, visible focus, 44px touch targets on controls.

---

## 2. Colors

### 2.1 Core palette (CSS variables)

Evolve current tokens into a full scale. Keep teal identity from the screenshot.

| Token | Hex | Role |
|-------|-----|------|
| `--color-bg-canvas` | `#F4F7FA` | Page background (flatten dual gradient to near-solid for Stripe-like calm) |
| `--color-bg-subtle` | `#EEF2F6` | Nested wells, table header |
| `--color-bg-elevated` | `#FFFFFF` | Cards, modals, nav |
| `--color-bg-overlay` | `rgba(18, 38, 58, 0.4)` | Drawer/modal scrim |
| `--color-border-default` | `#E2E8F0` | Cards, inputs, dividers |
| `--color-border-strong` | `#CBD5E1` | Active borders, table rules |
| `--color-border-focus` | `#0F6E6A` | Focus rings |
| `--color-text-primary` | `#0F172A` | Headings, primary copy (slightly cooler than current `#12263a`) |
| `--color-text-secondary` | `#475569` | Body, descriptions |
| `--color-text-tertiary` | `#64748B` | Captions, meta |
| `--color-text-inverse` | `#FFFFFF` | On dark / accent buttons |
| `--color-text-link` | `#0A524F` | Inline links |
| `--color-brand-500` | `#0F6E6A` | Primary actions (current `--accent`) |
| `--color-brand-600` | `#0A524F` | Hover (current `--accent-deep`) |
| `--color-brand-50` | `#E7F5F4` | Soft brand wash, selected rows |
| `--color-brand-100` | `#D1EBE9` | Badge / chip tint |

### 2.2 Semantic status colors

| Token | Hex | Background | Use |
|-------|-----|------------|-----|
| `--color-success` | `#166534` | `#ECFDF3` | sent, enriched, approved, completed |
| `--color-warning` | `#A16207` | `#FFFBEB` | pending_review, running, auditing, enriching |
| `--color-danger` | `#B91C1C` | `#FEF2F2` | rejected, *_failed, error |
| `--color-info` | `#1D4ED8` | `#EFF6FF` | new, informational (optional; keep rare) |
| `--color-neutral` | `#475569` | `#F1F5F9` | locked, draft, no_email, unknown |

### 2.3 Usage rules

- **Never** use brand teal for error or success — reserve for CTAs and focus.
- Screenshot hero gradient is allowed **only** on Home canvas; inner pages use flat `--color-bg-canvas`.
- Active nav: prefer `--color-text-primary` fill (current black pill) **or** brand-50 + brand text — pick one system-wide (recommend: **subtle brand-50 + brand-600 text** for Linear-like calm; keep high-contrast pill only for mobile).
- Borders default; shadows secondary. Stripe/Vercel: hairline > heavy drop shadow.

### 2.4 Dark mode

Out of scope for v1. Tokens above are light-only.

---

## 3. Typography

### 3.1 Families (keep current stack)

| Role | Font | Variable |
|------|------|----------|
| UI / body | **DM Sans** | `--font-sans` |
| Display / marketing titles | **Fraunces** | `--font-display` |

**Rule:** Fraunces only for Home hero H1, login product name, and rare empty-state headlines. All dashboards, tables, forms, nav = DM Sans (Linear/Stripe pattern).

### 3.2 Type scale

| Token | Size | Line height | Weight | Use |
|-------|------|-------------|--------|-----|
| `display` | 36–40px (`clamp(2rem, 3vw, 2.5rem)`) | 1.15 | 600 Fraunces | Home H1 only |
| `h1` | 24px | 1.25 | 600 Sans | Page titles (Campaigns, Leads) |
| `h2` | 18px | 1.3 | 600 Sans | Card titles, Pipeline status |
| `h3` | 15px | 1.35 | 600 Sans | Section labels inside cards |
| `body` | 14px | 1.5 | 400 | Default UI copy |
| `body-lg` | 16px | 1.5 | 400 | Hero lede only |
| `label` | 13px | 1.4 | 500 | Form labels |
| `caption` | 12px | 1.4 | 500 | Meta, timestamps |
| `overline` | 11px | 1.3 | 600 | Eyebrow (“ATRIUM SOLUTION”), step numbers — tracking `0.06em`, uppercase |
| `code` | 12–13px | 1.4 | 500 mono optional | Status keys (`new`, `enriched`) |

### 3.3 Hierarchy rules

- One Fraunces display per view max.
- Pipeline status keys can use tabular/medium weight sans, not a third font.
- Nav links: 13–14px medium; never display serif in nav.

---

## 4. Spacing

### 4.1 Scale (4px base — Stripe/Linear)

| Token | Value |
|-------|-------|
| `--space-0` | 0 |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

### 4.2 Layout spacing

| Context | Spec |
|---------|------|
| Page horizontal padding | 24px desktop / 16px mobile |
| Page top padding below nav | 32px (Home 40px) |
| Content max width | **1120–1200px** (slightly wider than current 1080 for tables) |
| Stack between major sections | 24px |
| Card internal padding | 20–24px (forms 24px; dense tables 0 horizontal pad on table itself) |
| Form field gap | 16px |
| Button group gap | 8–12px |
| Nav item gap | 4px |

### 4.3 Density modes

- **Marketing (Home):** larger section gaps (32px).
- **Ops (tables, drafts):** tighter (16–20px between toolbar and table).

---

## 5. Border radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 6px | Inputs compact, small chips |
| `--radius-md` | 8px | Buttons, inputs (default) — closer to Stripe/Clerk |
| `--radius-lg` | 12px | Small cards, panels |
| `--radius-xl` | 16px | Primary cards, hero (current `--radius`) |
| `--radius-2xl` | 20px | Hero panel only |
| `--radius-full` | 999px | Nav pills, badges, avatars |

**Direction vs screenshot:** Slightly **reduce** button radius from 12 → 8 for more enterprise sharpness; keep cards at 16.

---

## 6. Shadows

Prefer border + one soft elevation (Vercel/Clerk).

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-none` | none | Flat tables |
| `--shadow-xs` | `0 1px 2px rgba(15, 23, 42, 0.04)` | Inputs rest (optional) |
| `--shadow-sm` | `0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)` | Cards default |
| `--shadow-md` | `0 8px 24px rgba(15, 23, 42, 0.08)` | Dropdowns, popovers |
| `--shadow-lg` | `0 16px 40px rgba(15, 23, 42, 0.1)` | Modals |
| `--shadow-focus` | `0 0 0 3px rgba(15, 110, 106, 0.22)` | Focus ring (matches brand) |

**Rules:** No multi-layer glow. No colored shadows except focus. Action tiles: border + sm shadow; hover → border-strong + sm (not large lift).

---

## 7. Button styles

### 7.1 Variants

| Variant | Background | Text | Border | Use |
|---------|------------|------|--------|-----|
| **Primary** | brand-500 | inverse | brand-500 | Start Find Leads, Start Research, Approve |
| **Secondary** | elevated | primary | border-default | Send Approved, Cancel, Logout |
| **Ghost** | transparent | secondary | transparent | Tertiary text actions |
| **Danger** | elevated | danger | danger @ 30% | Reject |
| **Danger solid** | danger | inverse | danger | Confirm destructive (rare) |
| **Link button** | none | brand-600 | none | “View campaigns →” |

### 7.2 Sizes

| Size | Height | Padding X | Font |
|------|--------|-----------|------|
| `sm` | 32px | 12px | 13px / 500 |
| `md` | 40px | 16px | 14px / 600 |
| `lg` | 44px | 20px | 14px / 600 | Hero CTAs |

### 7.3 States

- **Hover primary:** brand-600  
- **Active/pressed:** brand-600 + 1px inset feel (darker)  
- **Disabled:** opacity 0.45, `cursor: not-allowed`, no hover  
- **Loading:** keep width; spinner 16px; label “Starting…”  
- **Focus-visible:** `--shadow-focus` always  

### 7.4 Rules

- One primary button per card/view region.
- Logout = Secondary `sm`, never Primary.
- Icon + label: 8px gap; icons 16px.

---

## 8. Card styles

### 8.1 Anatomy

```
┌─ border-default, radius-xl, bg-elevated, shadow-sm ─┐
│  padding 20–24px                                     │
│  optional header (h2 + caption)                      │
│  body                                                │
│  optional footer (border-top, pt-4)                  │
└──────────────────────────────────────────────────────┘
```

### 8.2 Variants

| Variant | Spec | Use |
|---------|------|-----|
| **Default** | white, border, shadow-sm | Pipeline status, forms |
| **Hero** | white, radius-2xl, shadow-sm, padding 28–32px | Home intro |
| **Interactive tile** | like default; hover border-strong; focus-visible ring | Step tiles 01–05 |
| **Locked tile** | opacity 0.55; `cursor: not-allowed` or still clickable with muted style | Locked pipeline steps |
| **Danger / error** | border danger @ 20%, bg danger-bg subtle | Error banners inside card |
| **Warning** | warn tokens | “Waiting for n8n…” |

### 8.3 Rules

- No cards nested more than one level.
- Tables: prefer **flush** table inside card (no double padding) — Clerk/Stripe pattern.
- Step number (`01`): overline + brand-500; not a badge pill.

---

## 9. Navigation style

### 9.1 Structure (visual IA — same routes)

```
[Brand]     [ Pipeline group ]     [ Records ]     [ Account ]
Atrium      Find · Research · …    Campaigns Leads  Log out
```

### 9.2 Specs

| Element | Spec |
|---------|------|
| Height | 56px single row desktop |
| Background | `rgba(255,255,255,0.85)` + blur 12px (keep screenshot frosted feel) |
| Border | bottom 1px border-default |
| Brand | Logo 28–32px + name 14px semibold; tagline 10px overline tertiary — hide tagline &lt;900px |
| Pipeline links | 13px, radius-full, px 10–12, py 6 |
| Active | brand-50 bg + brand-600 text **or** solid primary text pill (choose one; recommend soft brand) |
| Records | quieter tertiary; no pills |
| Logout | Secondary sm, right-aligned, separated by 1px vertical divider |
| Mobile | 56px bar + hamburger; drawer with grouped sections |

### 9.3 Badges in nav (design only)

- Drafts / Send: caption badge with count (`12`) — success/warning tint.
- Don’t badge every link.

### 9.4 A11y

- `nav aria-label="Primary"`
- `aria-current="page"` on active
- Skip link to `#main`

---

## 10. Table style

### 10.1 Anatomy (Linear/Stripe)

| Part | Spec |
|------|------|
| Container | Card flush or full-bleed within content width |
| Header | bg-subtle, caption 12px semibold uppercase optional OR 12px medium secondary — prefer **sentence case 12px medium** (Linear) |
| Header cell | py 10px, px 16px, text-tertiary, border-bottom border-default |
| Body cell | py 12–14px, px 16px, body 14px, border-bottom border-default |
| Row hover | bg brand-50 @ 40% or bg-subtle |
| Selected row | bg brand-50 |
| Empty | centered caption + secondary CTA |
| Density | Default comfortable; optional compact py 8px for power users later |

### 10.2 Column alignment

- Text left; IDs/counts right or tabular-nums.
- Status column: badge component, not raw string only.
- Actions column: right-aligned ghost/sm buttons.

### 10.3 Rules

- No zebra stripes (dated); use hover only.
- Sticky header optional for long lead lists.
- Don’t put heavy shadows on tables.

---

## 11. Form style

### 11.1 Field anatomy

```
Label (13px / 500 / secondary)
[ Input — height 40px ]
Helper / error (12px)
```

### 11.2 Input specs

| State | Border | Shadow | Background |
|-------|--------|--------|------------|
| Rest | border-default | none | elevated |
| Hover | border-strong | none | elevated |
| Focus | brand-500 | shadow-focus | elevated |
| Error | danger | focus danger @ 20% | elevated |
| Disabled | border-default | none | bg-subtle, text tertiary |

- Radius: `--radius-md` (8px)  
- Padding: 10px 12px  
- Placeholder: tertiary  
- Select: same as input  

### 11.3 Form card

- Max width 480–560px for Find Leads (don’t stretch full 1120).
- Primary submit full-width on mobile; auto width desktop.
- Validation: inline under field; don’t rely on alert alone.

### 11.4 Rules

- Labels always visible (no placeholder-only forms) — enterprise/a11y.
- Required indicator: subtle `*` in tertiary or “(required)” in caption.

---

## 12. Status badges

### 12.1 Anatomy

- Height ~22–24px  
- Padding 2px 8px  
- Radius full  
- Font 12px / 600  
- Border 1px matching tint  

### 12.2 Status → semantic map

| Lead / campaign status | Tone | Label (display) |
|------------------------|------|-----------------|
| `new` | info/neutral | New |
| `enriching` / `auditing` / `sending` / `running` | warning | Enriching / Auditing / Sending / Running |
| `enriched` | success | Enriched |
| `pending_review` | warning | Needs review |
| `approved` | success | Approved |
| `sent` / `completed` | success | Sent / Completed |
| `rejected` | danger | Rejected |
| `no_email` / `no_website` | neutral | No email / No website |
| `enrich_failed` / `audit_failed` / `send_failed` / `error` | danger | Failed |
| locked (UI only) | neutral | Locked |

### 12.3 Rules

- Display **human labels**; keep raw status in `title` tooltip for support.
- Never encode status by color alone — always text.
- Dot + label optional (Clerk style) for running states (animated pulse sparingly).

---

## 13. Motion

| Token | Value | Use |
|-------|-------|-----|
| Duration fast | 120ms | Hover, focus |
| Duration normal | 200ms | Pan active, drawers |
| Easing | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Default |

Home `fade-in` rise: keep subtle (8px / 300ms). No decorative ambient animation on ops pages.

---

## 14. Elevation & z-index

| Layer | z-index |
|-------|---------|
| Content | 0 |
| Sticky table header | 10 |
| Top nav | 20 |
| Dropdown | 30 |
| Drawer / modal | 40 |
| Toast | 50 |

---

## 15. Iconography

- Stroke icons 1.5–2px, 16/20px (Lucide / Heroicons style if added later).
- Current product is typography-first — **don’t force icons** into every nav item.
- Logo mark: keep teal rounded square “A” — treat as brand lockup, not a UI icon.

---

## 16. Breakpoints

| Name | Min width | Behavior |
|------|-----------|----------|
| `sm` | 640px | Single column tiles; form full bleed |
| `md` | 768px | Nav → drawer below this |
| `lg` | 1024px | Full horizontal nav groups |
| `xl` | 1280px | Comfortable table width |

---

## 17. Component ↔ screen mapping

| Screen | Components from this system |
|--------|----------------------------|
| Home | Hero card, Pipeline card, Interactive tiles, Primary/Secondary buttons |
| Find Leads | Form card, Inputs, Primary button |
| Research / AI Draft / Send | Page h1, Lock notice (warning card), Primary button |
| Drafts | Cards or table + badges + Danger/Primary actions |
| Campaigns / Leads | Table + badges + filters (future) |
| Login | Centered form card, Primary button |
| Global | Nav, Logout secondary |

---

## 18. Do / Don’t (premium SaaS)

| Do | Don’t |
|----|-------|
| Hairline borders + sm shadow | Heavy multi-shadow stacks |
| One teal accent | Purple gradients, neon glow |
| Fraunces for hero only | Serif in tables/nav |
| Clear disabled/locked | Hide locked steps with no explanation |
| Tabular numbers for counts | Misaligned numeric columns |
| Focus rings | `outline: none` without replacement |
| Group pipeline vs records in nav | 9 equal-weight pills wrapping on mobile |

---

## 19. Adoption roadmap (design → engineering, no feature change)

1. **Tokens** — Expand `:root` to full color/spacing/radius/shadow scales.  
2. **Buttons + badges** — Normalize all variants to §7 / §12.  
3. **Nav chrome** — Grouping + active style + mobile drawer (same hrefs).  
4. **Tables** — Header/row density pass.  
5. **Forms** — radius-md + focus ring consistency.  
6. **Home** — Flatten page bg; keep hero; tighten pipeline list typography.  

---

## 20. One-line brand statement

> **Atrium Reach looks like a calm operations console: teal actions, slate type, white surfaces, and status that speaks louder than decoration — closer to Stripe/Linear than a marketing landing page.**

---

*End of design system.*
