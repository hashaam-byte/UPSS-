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
(`oneWeekWarningSentAt`/`finalWarningSentAt`), `User.policyAcceptedAt`,
and `SchoolPaymentConfig`/`StudentFeeOnlinePayment` for the per-school
payment gateway feature.

## 2. New environment variables

Two are new this round — everything else is unchanged from before
(full list is in `.env.example`, included in this zip):

```
CRON_SECRET="generate-a-long-random-string-yourself"
PAYMENT_ENCRYPTION_KEY="generate-a-64-char-hex-string-yourself"
```

If deploying on **Vercel**: add `CRON_SECRET` in Project Settings ->
Environment Variables. Vercel automatically triggers
`/api/cron/subscription-check` daily (schedule is in `vercel.json`,
already set to run once a day) and sends this value as the Authorization
header — no further setup needed.

If **not** on Vercel: use any external cron service (e.g. cron-job.org)
to hit `https://yourdomain.com/api/cron/subscription-check` once a day
with header `Authorization: Bearer <CRON_SECRET>`.

`PAYMENT_ENCRYPTION_KEY` (see section 6 for the full picture) encrypts
schools' Paystack secret keys at rest. Generate it with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
This is required for the payment gateway feature to work at all — the
app will throw an error the moment any school tries to save or use a
payment key without it set.

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

## 6. This update: schools connect their own payment gateway

You can now let each school bring their own Paystack account, so parent
fee payments settle directly into the school's own bank account — U-Plus
never touches or holds that money at all. This also resolves the
age/KYC blocker from our earlier conversation a different way: you're no
longer the one whose identity needs to satisfy a gateway's KYC — each
school's own admin does, for their own account.

**Security model** (worth reading before you enable this for real):
- `PAYMENT_ENCRYPTION_KEY` (new required env var) encrypts every school's
  Paystack secret key at rest, using AES-256-GCM. This key is NOT a
  payment credential itself — generate it once, keep it safe, and never
  reuse it for anything else. If it's ever lost, every school's stored
  secret key becomes unrecoverable and each admin has to reconnect.
- The secret key is **never** sent back to the browser once saved, not
  even to the admin who set it — only "connected: yes/no" and the public
  key (which is safe to expose, that's how Paystack's model works).
- The webhook (`/api/webhooks/paystack`) verifies Paystack's signature
  using the correct **school's own** secret key — since each school has
  a different key, the webhook first extracts which fee/school a
  transaction reference belongs to, looks up that school's key, then
  verifies. A mismatched signature is rejected outright.
- Beyond signature verification, the webhook independently re-verifies
  the transaction server-to-server via Paystack's `/transaction/verify`
  endpoint before crediting anything — the webhook payload's amount
  field is never trusted on its own.
- Manual bank-transfer confirmation (built earlier) still works
  unchanged — online payment is additive, not a replacement. A parent
  sees a "Pay online" button only if their child's school has actually
  connected a gateway; otherwise they see the existing bank-transfer
  flow only.

**New files:**
- `src/lib/payment-crypto.js` — the AES-256-GCM encrypt/decrypt helpers.
- `src/app/api/protected/admin/settings/payment-gateway/route.js` —
  admin connects/updates/disconnects their Paystack keys.
- `src/app/api/protected/parent/fees/[feeId]/pay/route.js` — starts a
  Paystack transaction using the school's own key; verifies the fee
  actually belongs to one of the requesting parent's linked children
  first.
- `src/app/api/webhooks/paystack/route.js` — the verification logic
  above; on confirmed success, updates the fee's balance/status and adds
  a `StudentFeePayment` record so parents and admins see one consistent
  payment history regardless of whether a payment was manual or online.
- New "Payment Gateway" tab on the admin settings page, and a "Pay
  online" button on the parent fees page (conditionally shown).
- Schema: `SchoolPaymentConfig`, `StudentFeeOnlinePayment`,
  `PaymentProvider` enum (Paystack only for now — designed to extend to
  other providers later without a breaking schema change).

**You still need to do this yourself before it works:**
1. Set `PAYMENT_ENCRYPTION_KEY` in your environment (see `.env.example`
   for the generation command).
2. **Register your Paystack webhook URL** in the Paystack dashboard for
   each school's account (Settings → API Keys & Webhooks → Webhook URL),
   pointing to `https://yourdomain.com/api/webhooks/paystack`. This is a
   per-Paystack-account setting on Paystack's side — U-Plus can't
   configure it for them automatically.
3. Each admin who wants online payments enabled needs to actually go to
   Settings → Payment Gateway and paste in their own Paystack public and
   secret keys.

## 8. This update: security hardening + landing/login redesign

### Security — five layers added, all real gaps found while reviewing

1. **Rate limiting was completely unused.** A `RateLimiter` class existed
   in `auth.js`, exported, but wired to zero routes. Built a proper
   database-backed version (`src/lib/rate-limit.js` — works correctly
   across serverless instances/restarts, unlike an in-memory counter)
   and applied it to: school login, headadmin login, parent login,
   parent OTP request/verify, password reset request, and payment
   initiation. Each has both IP-based and account-based limits. The
   daily cron job now also sweeps expired rate-limit rows.
2. **Security headers were completely empty** — `next.config.ts` had
   nothing in it. Added CSP, X-Frame-Options, X-Content-Type-Options,
   HSTS, Referrer-Policy, Permissions-Policy. Verified via `next build`
   that these don't break anything server-side, but the CSP in
   particular should be checked against a real browser deployment
   before assuming it's fully correct — I can't visually test this from
   this sandbox.
3. **File uploads checked size in one route, nothing in the other** —
   neither restricted file *type*. Built `src/lib/upload-validation.js`
   with a real MIME-type allowlist (deliberately excludes SVG, which can
   carry embedded scripts) and applied it to both upload routes.
4. **Paystack webhook IP allowlisting**, as an *optional* extra layer
   alongside the signature verification that already existed. Made this
   env-configurable and fail-open (skipped if unset) rather than
   hardcode Paystack's published IPs, since those can change over time
   and a stale hardcoded list could start rejecting real payments.
5. **Audit logging** — the `AuditLog` table existed in your schema but
   nothing wrote to it. Built `src/lib/audit.js` and wired it into the
   payment gateway connect/update/disconnect actions first, since
   that's the highest-value place to have a "who did this and when"
   trail.

New model: `RateLimitAttempt` (backs #1 above).

**Honest gaps not covered by this pass**: no `npm audit` dependency scan
run, no automated tests, no formal penetration test. This was a code
review pass while actively building, not a systematic security audit —
treat it as a strong baseline, not a clean bill of health.

### Landing page — full redesign

New visual direction: dark hero section with a single orchestrated
moment — a 3D book opening (built with CSS 3D transforms + framer-motion,
already an installed-but-unused dependency, so no new packages needed),
revealing fragments of the product (attendance, a grade, a message) as
its pages. Below the hero: warm paper-toned sections with asymmetric
feature blocks (not a generic 3-card grid), a horizontal role-picker
band, and pricing pulled live from the same headadmin-editable config
built earlier. New fonts (Manrope + Fraunces) loaded, scoped to just
this page — deliberately did NOT change the font for the rest of the
already-built app, to avoid unintended visual regressions across every
dashboard.

Caught and fixed two real TypeScript errors before they'd have broken
your build: an implicitly-`any` function parameter, and calling that
same function with zero arguments where TypeScript required one (fixed
by making the parameter optional).

### Login page — visual refresh only, zero logic changes

Given this page's form/auth logic is complex and I can't visually test
a live rewrite from this sandbox, I deliberately did a class-name-only
visual update rather than a rebuild: swapped the background gradient and
two off-palette accent blobs (cyan/purple) to match the new night/jade
palette. Left the five role cards' individual accent colors untouched —
those exist to visually distinguish the roles from each other, which is
a different, legitimate purpose from the page's overall theme.

While in this file, confirmed something I'd suspected was a bug in an
earlier session actually isn't: the page already correctly reads a
`?role=` URL parameter and preselects that tab — I'd mis-grepped for it
before. No fix was needed there.

## 9. Still open

- Storage is still 100% Cloudinary (deliberate, per earlier discussion).
- No automated tests, no `npm audit` scan, no formal penetration test.
- A full `tsc --noEmit` pass hasn't been run independently (only what
  `next build` checks).
- Retheming existing hardcoded gradients (across the rest of the app,
  outside the landing/login pages) to actually use the `--brand-primary`
  CSS variable.
- Only Paystack is supported for online payments — schema is designed
  to make adding another provider additive, not breaking.
- Partial-payment amount isn't yet selectable by the parent in the UI
  (API supports a custom `amount`, button always pays full balance).
- PWA setup — not started.
- Full env-var walkthrough for final production readiness — not
  re-verified this round (mostly covered in earlier messages).
- Attendy (attendy-edu.vercel.app) integration for attendance — not
  investigated at all yet.
- AI test generation, timetable generation, resources scoping — all
  fixed and verified in earlier sessions, unchanged in this update.
