# U-Plus — everything new/changed since your current repo

This zip contains ONLY files that are new or different compared to your
actual GitHub repo (I cloned it fresh and diffed against it directly, so
this should be a clean, accurate delta — nothing you already have is
included). Copy these into your project, preserving folder structure,
overwriting when prompted.

## 1. Required setup after copying

```bash
npm install
npx prisma migrate dev --name subscription_fees_theme_policy
npx prisma generate
npm run build
```

This migration adds: `StudentFee`/`StudentFeePayment` tables, `School.themeColor`,
two subscription-warning tracking fields on `School`
(`oneWeekWarningSentAt`/`finalWarningSentAt`), and `User.policyAcceptedAt`.

## 2. New environment variable

Only one is new this round — everything else is unchanged from before
(full list is in `.env.example`, included in this zip):

```
CRON_SECRET="generate-a-long-random-string-yourself"
```

If deploying on **Vercel**: add this in Project Settings -> Environment
Variables. Vercel automatically triggers `/api/cron/subscription-check`
daily (schedule is in `vercel.json`, already set to run once a day) and
sends this value as the Authorization header — no further setup needed.

If **not** on Vercel: use any external cron service (e.g. cron-job.org)
to hit `https://yourdomain.com/api/cron/subscription-check` once a day
with header `Authorization: Bearer <CRON_SECRET>`.

## 3. What's in this update

### Email/slug security fixes
- `admin/profile` and `teachers/coordinator/settings` both let a user
  silently change their own login email — removed. (Student, generic
  user, and other teacher settings routes were already correctly
  read-only — checked, no bug there.) School slug was already
  never editable — confirmed safe.

### Subscription payment warnings + auto-suspend
- `src/app/api/cron/subscription-check/route.js` — daily check: 7-day
  warning -> 2-day final warning (explicitly states the school and its
  slug will be suspended) -> auto-suspend past the deadline. Sends via
  in-app notification, email, and SMS (if the admin has a phone on
  file).
- Caught a critical detail before shipping: **Vercel Cron invokes via
  GET, not POST** — this was originally built POST-only, which would
  have meant it silently never triggered. Verified against Vercel's
  actual docs and fixed.
- Discovered `School` has two separate "active" flags (`isActive`,
  which actually blocks login, and `subscriptionIsActive`, used across
  many UI files for status display but never gates login) — the
  suspend logic now sets both, consistently.
- Warning flags are reset on renewal — added to extend-trial,
  payment-schedule, and the manual activate action, so a school that
  pays doesn't get warned again next cycle.
- `src/lib/email.js` — extracted a shared SMTP sender (previously
  inlined in one route only).

### Pricing consistency fix
Found pricing hardcoded in three separate places that could drift
apart: the landing page (flat NGN 300), the subscription status API
(per-user model), and the frontend's own independent recalculation of
those same numbers. All three now read from one shared,
headadmin-editable source:
- `src/lib/platform-settings.js` — get/set helper backed by
  `SystemSetting`.
- `src/app/api/protected/headadmin/platform-settings/route.js` —
  headadmin views/edits all pricing + the contact phone number shown to
  admins.
- `src/app/api/public/pricing/route.js` — public endpoint the landing
  page actually uses now instead of a hardcoded number.
- `subscription/status/route.js` and the admin subscription page's UI
  both updated to use this — previously the frontend recalculated its
  own hardcoded numbers even when the backend was correct, so editing
  settings wouldn't have changed what admins actually saw.

### Contact info (admin <-> headadmin)
- Admin's subscription page shows a "Chat on WhatsApp" card with the
  headadmin's number (from platform settings above).
- Headadmin's school detail page shows an "Admin Contacts" card listing
  every active admin at that school with a one-tap WhatsApp link. Also
  fixed `phone` missing from that route's user query.

### Theme color (foundation, not a full retheme)
- `School.themeColor` + validated GET/PUT on the school settings API +
  a working color picker on the admin settings page + `src/lib/theme.js`
  applying it as a CSS variable, wired into the admin layout.
- Honest scope note: this is the real, working mechanism — it does
  NOT retheme every existing hardcoded Tailwind gradient across the
  whole app (hundreds of files). Extending it further means migrating
  components to use `var(--brand-primary)` over time.

### Legal pages + first-login consent gate
- `src/app/privacy/page.jsx`, `src/app/terms/page.jsx`,
  `src/app/refund-policy/page.jsx` — live pages, not just documents.
  I'm not a lawyer — these are a solid starting point covering NDPR
  basics, the auto-suspension policy, refund terms for manual bank
  transfer, and limitation of liability, but given you're a minor
  operating a platform handling children's academic data and payments,
  get these reviewed by an actual Nigerian lawyer once you have real
  users. Placeholder contact details need filling in before publishing
  (search for "[insert" in each file).
- `User.policyAcceptedAt` + `src/app/api/protected/accept-policies/route.js`
  + `src/Components/shared/PolicyConsentGate.jsx` — a full-screen gate
  shown to an admin on first login until they check a box agreeing to
  all three documents. Wired into the admin layout only, per what was
  asked — extend it to other roles if you want the same gate elsewhere.

### Found while building the above (not asked for, fixed anyway)
- `src/components` vs `src/Components` — I almost created a second
  case-collision duplicate exactly like the `Admin`/`admin` bug from
  earlier in this project. Caught it before it shipped: your real
  convention is `src/Components` (capital, actively used elsewhere) —
  moved my new file there and deleted the accidental lowercase one.
- `policyAcceptedAt` needed to be added in three separate places across
  `src/lib/auth.js` and `src/app/api/auth/verify/route.js` — both files
  manually whitelist which fields get returned after fetching a user,
  so adding a schema field alone doesn't automatically expose it to the
  rest of the app. Worth knowing for next time you add a User field.

### Recovered in this package
- The parent "grades/attendance/tests" child-detail feature (built two
  sessions ago) had been accidentally dropped when I switched my
  working copy over to sync with your real repo. Caught during final
  packaging and restored: `parent/child/[studentId]` API route, the
  detail page, and the dashboard page's link to it.

## 4. This update: UI for fees and announcements (was API-only before)

- `src/app/protected/admin/fees/page.jsx` — create fees (single or bulk,
  by selecting multiple students), filter by status, confirm bank-transfer
  payments with a running balance shown per fee.
- `src/app/protected/parent/fees/page.jsx` — read-only view of every
  linked child's fees, balance owed, and payment history.
- `src/app/protected/admin/announcements/page.jsx` — composer (target
  audience, pin, mark urgent) + list of posted announcements.
- Shared announcements feed page added for **every** role that can read
  them: `src/app/protected/parent/announcements/page.jsx`,
  `src/app/protected/students/announcements/page.jsx`,
  `src/app/protected/teacher/class/announcements/page.jsx` — all three
  just call the same `/api/protected/announcements` endpoint, styled to
  match each role's existing light/dark theme convention.
- Added "Fees" and "Announcements" to the admin sidebar nav, and a small
  top nav bar to the parent layout (Dashboard / Fees / Announcements —
  it had no navigation at all before, just a logout button).

**Note:** the student and teacher announcement pages exist and work when
navigated to directly, but I did not wire nav-link entries into their
sidebars this round (those are larger, more complex layout files than
admin's) — that's a small remaining step, not a missing feature.



## 5. This update: nav wiring + theme color everywhere

- Added "Announcements" to the sidebar nav for students
  (`src/app/protected/students/layout.jsx`) and class teachers
  (`src/app/protected/teacher/class/layout.jsx`) — the pages existed
  from the previous update but weren't linked from anywhere.
- Theme color (the accent color an admin picks on the school settings
  page) now applies across **every** role's layout, not just admin's:
  student, parent, and all four teacher sub-roles (class, subject,
  coordinator, director). Three of these layouts (coordinator, director,
  parent) were already receiving `school` data from `/api/auth/verify`
  but never capturing or using it — this was a one-line fix in each once
  found, not a bigger change.
- Same honest scope note as before: this applies the color as a CSS
  variable everywhere now, but still doesn't retheme every existing
  hardcoded Tailwind gradient across the app — that's still a
  file-by-file migration for later.

## 6. Still open

- Storage is still 100% Cloudinary (deliberate, per earlier discussion).
- No automated tests.
- Payment gateway still isn't wired to a live provider (deliberate —
  manual bank transfer for now, per the age/KYC discussion).
- A full `tsc --noEmit` pass hasn't been run independently.
- Retheming existing hardcoded gradients to actually use the new
  `--brand-primary` CSS variable, beyond the mechanism now being live
  everywhere.
- AI test generation, timetable generation, resources scoping — all
  fixed and verified in earlier sessions, unchanged in this update.
