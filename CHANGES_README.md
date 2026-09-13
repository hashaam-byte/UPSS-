# U-Plus — Complete admin redesign + correctness pass

This is everything from this whole session on the admin section,
bundled into one zip: dashboard, sidebar, users, analytics, settings
(multi-tenancy fix), fees/announcements color pass, and the
notifications investigation.

## Setup

```bash
npm install
npx prisma migrate dev --name settings_scoping_and_dashboard
npx prisma generate
npm run build
```

## New this round: Notifications — investigated and fixed

You asked me to look into notifications and how they're handled. Found
two real, confirmed bugs:

1. **"Mark as read" on a single notification silently did nothing.**
   The frontend called `PATCH /api/protected/admin/notifications/{id}/read`
   — that exact route never existed. The real route (already built)
   handles `PATCH` at `/api/protected/admin/notifications/{id}`, no
   `/read` suffix. Fixed by correcting the frontend URL. Before this
   fix, clicking a notification looked like it worked (the UI updated
   optimistically) but the database row was never actually marked read
   — refreshing the page would show it unread again.
2. **"Mark all as read" also silently did nothing** — the frontend
   called `/api/protected/admin/notifications/mark-all-read`, which
   never existed at all (a different, oddly-placed version existed
   nested under a dynamic `[notificationId]` route, which the frontend
   never actually called). Built the missing route properly.

Messaging — you asked me to look into this too, but said "after you've
given me all the new designs," so I've held off per your own
sequencing. Let me know when you want that investigation.

## New this round: Profile tab — email field was lying about what it does

Inside Settings → My Profile, the Email field was a normal editable
text input — you could type a new email, no error shown, "Save" would
appear to succeed. But the backend (fixed a few sessions ago) silently
ignores any email change in that request. So the form was actively
misleading: it let you edit something that would never actually change.
Fixed by making the field visibly disabled/read-only with a one-line
explanation, so the UI honestly reflects what happens.

## New this round: Fees & Announcements — color harmonized

Quick pass to swap `emerald-600` for the exact jade hex used everywhere
else in the redesign, for pixel-consistency. These pages were already
using real data (I built them a few sessions ago), so no functional
changes needed here.

## Carried over from the last two messages (included again for a clean single zip)

- **Multi-tenancy leak**: `SystemSetting` had no per-school scoping —
  security/notification settings were shared across every school on the
  platform, and partially collided with headadmin's own settings too.
  Fixed across 7 files with a proper schema change.
- **Analytics page**: several metrics were fabricated
  (`activeUsers * 0.85`, hardcoded `24`, hardcoded `85`, an invented
  retention formula, and a mislabeled query counting assignments instead
  of resources). Replaced with real computed values; the one metric with
  genuinely no data source (session duration) now honestly shows "Not
  tracked yet."
- **Hardcoded "© 2025"** fixed in 5 layout files — now always correct.
- **Dashboard**: rebuilt with real charts (recharts, already installed,
  unused until now) instead of fabricated trend badges.
- **Sidebar**: scroll bug fixed (`flex flex-col` + `min-h-0` — the
  actual flexbox fix for "stiff, not scrolling"), reorganized into
  collapsible groups.
- **Users page**: visual-only pass (primary buttons + CSV callout to
  jade), zero logic changes — 718 lines of working CRUD I can't test
  live.

## Verified clean, no changes needed

- **Subscription page & its two API routes** — already correctly wired
  to the shared pricing config, no fabricated numbers found.
- **Resources page & its four API routes** — all exist, all correctly
  scoped by school.

## Still open

- Messaging investigation (deferred per your instruction — after all
  designs are done).
- Extending the jade/chart visual system to the remaining pages not yet
  touched (School Info tab visuals, Security/Payment Gateway tabs).
- Your "access denied, logs out" bug on Fees — still unconfirmed whether
  it was the missing migration. Let me know if it's resolved after
  running the migration above.
- Storage, payment gateway (Paystack only), automated tests — all
  unchanged, per earlier discussions.
