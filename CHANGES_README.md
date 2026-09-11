# U-Plus — Admin dashboard redesign

Just 3 files this round — the admin dashboard, sidebar, and one new API
route. Copy these over the matching paths in your project.

## What changed

**New: `src/app/api/protected/admin/stats/overview/route.js`**
Consolidated dashboard data in one call. Fixes two real bugs found while
rebuilding this:
- The old stats endpoint returned `admins` (lowercase) while the
  dashboard read `.Admins` (capital) — that stat card has always
  silently shown zero.
- The dashboard's "estimated billing" number was hardcoded as
  `totalUsers * 250` — completely disconnected from the actual
  headadmin-editable pricing built a few sessions ago. Now reads the
  real `subscription.pricing.individual.totalCost` the backend already
  computes correctly.

**`src/app/protected/admin/page.jsx` — full rebuild**
- Removed fabricated trend badges (`{ positive: true, value: 12 }` —
  hardcoded numbers with no real data behind them, on every stat card).
  Replaced with real, honestly-labeled numbers: active users in the
  last 30 days, a real 7-day new-signups bar chart, a real role
  composition donut chart — all backed by actual queries, using
  `recharts`, which was already an installed dependency, unused until
  now.
- Removed two hardcoded placeholder tiles ("Messages: 0", "Resources: 0"
  that never fetched real data) and replaced with an Outstanding Fees
  card, since that's real, meaningful, and already fully built.
- Toned down the color treatment — the old version leaned heavily on
  blue/purple/pink gradients across nearly every element, which is part
  of what you flagged as unclear. Restyled around the single jade accent
  color already established on the landing/login pages, with a plain
  white/gray card system underneath so the accent color actually stands
  out instead of competing with itself everywhere.

**`src/app/protected/admin/layout.jsx` — sidebar redesign**
- Flat 10-item list restructured into four collapsible groups
  (Overview, People, School, Account) — click a group header to
  collapse/expand it.
- Purple/pink header and active-nav-item colors replaced with the jade
  accent, matching the rest of the redesign.

## This is step one of the admin section redesign

Per what we discussed — building the shell (sidebar) and one flagship
page (dashboard) first, rather than redesigning all eight admin pages
blind. Let me know if this direction works before I extend the same
system to Users, Fees, Announcements, Resources, and the rest.

## Still investigating: your "access denied, logs out" bug on the Fees page

Leading theory is still an unapplied database migration — if you
haven't run `npx prisma migrate dev` since the last zip (the one with
`StudentFee`, `SchoolPaymentConfig`, `policyAcceptedAt`, etc.), that
would explain it. If you have run it and this still happens, I need the
exact status code + response body from the failing request in your
browser's Network tab to pin it down further — I can't reproduce this
without that detail.
