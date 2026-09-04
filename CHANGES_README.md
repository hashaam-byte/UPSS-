# U-Plus — Changes from this session

This zip contains ONLY new/changed files, in the same folder structure as
your project, so you can copy them straight over your real repo (overwrite
when prompted). It does NOT include node_modules or a full project copy.

## 1. Files to DELETE from your real project first

These were duplicates or empty/broken files causing real bugs (build
failures, blank pages, 404s). Delete them before copying the rest in:

- `src/app/protected/Admin/` (capital A — duplicate of `admin/`, breaks
  builds on case-sensitive filesystems like Linux/Vercel)
- `src/app/protected/Headadmin/` (capital H — same issue)
- `src/app/protected/Teachers/` (capital T, plural — was an empty file,
  this is why teachers landed on a blank/not-found page after login)
- `src/app/protected/teacher/director/students/report/` (empty page file,
  nothing links to it — you already have a working `director/reports`)
- `src/app/(protected)/` (contained only a stray empty `middleware.ts`
  that Next.js never actually executes from that location)
- `src/app/middleware.ts` (the real one, at the app root) — replaced by
  `src/app/proxy.ts` in this update, as part of the Next.js 16 upgrade.
  Delete the old file so it isn't sitting there confusing anyone; Next 16
  won't execute it either way.

## 2. Copy everything else in this zip over your project

Preserve the folder structure — copy `src/`, `prisma/`, `test/`, and
`.env.example` into the root of your real project, overwriting existing
files with the same path.

## 3. After copying, run these commands in your real project

```bash
npm install
npx prisma migrate dev --name add_parent_portal
npx prisma generate
node prisma/seed-test-accounts.js   # optional — creates test accounts for every role
npm run build   # sanity check — should compile clean
```

The `prisma migrate dev` step is required — this changeset adds a
`preferences` JSON column to `UserSettings` and three new tables
(`ParentProfile`, `ParentStudentLink`, `OtpVerification`) plus a new
`PARENT` enum value. None of this exists in your database yet.

`npm install` will also pull in Next.js 16 and React 19.2 (bumped in
`package.json` as part of this update) — make sure your local Node.js
is **20.9.0 or newer** first (Next 16's hard minimum; Node 18 is no
longer supported), or `npm install`/`next build` will fail.

## 4. New environment variables needed

Check `.env.example` for the full list. Nothing else changed for existing
vars — only these are new, for the parent portal's SMS OTPs:

```
SMS_PROVIDER=""       # e.g. "termii" — leave blank and OTPs just log to
                       # the console instead of sending, for local dev
TERMII_API_KEY=""
TERMII_SENDER_ID=""
```

No SMS provider is wired up with real credentials yet — you'll need to
sign up with one (Termii is pre-built in `src/lib/sms.js`; any other
provider can be dropped in behind the same `sendSms()` function) before
parent OTPs will actually reach a phone.

## 5. What changed, grouped by purpose

**Branding**: UPSS → U-Plus in remaining internal comments/seed data.

**Critical bug fixes**:
- `src/app/middleware.ts` — role-permission lookup was case-mismatched,
  silently blocking ALL headadmin/admin/student requests. Also fixed
  stale duplicate-role path entries.
- `src/app/api/auth/verify/route.js` — same case-mismatch pattern in a
  second place, plus two broken fallback redirect paths that pointed to
  pages that never existed (`/protected/teachers` plural).
- 33 API route files (`[id]/route.js` etc.) — Next.js 15 made dynamic
  route `params` an async `Promise`; these were reading `params.id`
  synchronously, which returns `undefined` at runtime. Full list in
  `params_files_fixed.txt` in this zip.
- `src/app/protected/headadmin/users/[id]/page.tsx` — same async-params
  issue, server-component version.
- `src/app/protected/teacher/subject/online-tests/grade/[testId]/page.jsx`
  — was reading a `testId` prop that Next.js never actually passes to
  page components; fixed to read it from the URL via `useParams()`.
- `src/app/api/protected/teachers/director/teachers/[id]/route.js` — had
  a `GET_PERFORMANCE` export, which isn't a real HTTP method Next.js
  recognizes, so it was dead code. Moved to its own proper route at
  `.../[id]/performance/route.js`.
- Two empty (0-byte) API route files implemented for real:
  `teacher/class/notifications/count` and `.../mark-read`.
- One empty API route implemented: `teachers/director/assign-class`.
- Orphaned dead code fragment removed from
  `headadmin/invoices/[id]/route.js`.
- 25 manual `prisma.$disconnect()` calls removed across 18 files (was
  fighting the global Prisma singleton, real risk under concurrent load).
- Two TypeScript implicit-`any` errors fixed in the headadmin messages
  routes.

**Real feature fixes (were faking data / silently no-op)**:
- `teacher/class/attendance` — was using `Math.random()` instead of the
  real `Attendance` table.
- `teacher/class/settings` — three `TODO` stubs that didn't persist
  anything; now backed by a real `preferences` JSON column.

**Navigation fixes**:
- `src/app/protected/teacher/page.jsx` — new file. Routes a logged-in
  teacher to the correct department dashboard (class/subject/coordinator/
  director). This page didn't exist before, which is why generic
  "teacher" links 404'd.
- Fixed broken links in `src/app/page.tsx` and
  `src/app/protected/page.jsx` that pointed at capitalized/duplicate
  routes, some with a literal (invalid) `/page.tsx` suffix in the URL.

**New feature — parent portal**:
- Schema: `PARENT` role, `ParentProfile`, `ParentStudentLink`,
  `OtpVerification`.
- `src/lib/sms.js`, `src/lib/otp.js` — SMS + OTP helpers.
- `src/app/api/auth/parent/*` — request-otp, verify-otp, set-password,
  login.
- `src/app/api/protected/parent/*` — dashboard data, child
  password-reset (parent re-verifies their own phone via OTP, then sets
  a new password for a linked child).
- `src/app/auth/parent/page.jsx` — public phone/OTP/password UI (covers
  first-time signup, login, and forgot-password in one flow).
- `src/app/protected/parent/layout.jsx` +
  `src/app/protected/parent/dashboard/page.jsx` — parent dashboard
  listing linked children with a password-reset action per child.

## 6. Next.js 16 upgrade (this update)

- `package.json` — bumped `next` to `^16.0.0`, `react`/`react-dom` to
  `^19.2.0`, `eslint-config-next` to `^16.0.0`, added an `engines.node`
  field requiring Node.js 20.9.0+ (Next 16's hard minimum — Node 18 is no
  longer supported).
- `src/app/middleware.ts` → **deleted**, replaced by `src/app/proxy.ts`
  (Next 16 renamed the convention; the exported function is now a
  **default export** named `proxy`, not the named export `middleware`).
  Logic is unchanged — same JWT check, same role permissions, same
  matcher config. As a side effect, this also fixes a latent issue:
  `jsonwebtoken` (a Node.js library) doesn't reliably run under the old
  Edge middleware runtime; `proxy.ts` runs Node.js-only, so this is now
  guaranteed to work correctly.
- `tsconfig.json` — Next 16 auto-migrated this on build (`jsx` set to
  `react-jsx`). Also cleaned up several stale `include` entries that
  pointed at files which no longer exist (leftover from the deleted
  `Headadmin/` duplicate, a typo'd path missing a `schools/[id]/`
  segment, and a couple of files that had since been renamed `.ts`).
- Verified clean of every other Next 16 breaking-change pattern: no
  `next/legacy/image`, no `images.domains` config, no
  `serverRuntimeConfig`/`publicRuntimeConfig`, no `next lint` script, no
  parallel-route (`@slot`) folders needing a `default.js`. The project
  already used `--turbopack` under Next 15, so Turbopack becoming the
  default bundler in v16 changes nothing here.
- A full `next build` was run in this session with Next 16.3.4 + React
  19.2.8 installed for real (not just planned) — it **compiled
  successfully** and passed the TypeScript check clean.

### After you upgrade, also check this build script

`package.json`'s `build` script currently runs
`prisma generate && prisma db push && node prisma/seed-production.js && next build`
— meaning it pushes schema changes AND re-seeds the database on every
single production build. That's unusual and risky (a bad seed script
could overwrite live data on every deploy). Not changed in this pass
since it wasn't asked for, but worth revisiting.

## 7. SMS provider recommendation

Termii is a solid, sensible pick and is what `src/lib/sms.js` already
targets — Nigerian-founded, does DND-bypass routing specifically for
transactional/OTP messages (a plain SMS route can get silently blocked
by Nigeria's Do-Not-Disturb registry; OTP traffic needs the
transactional route to get through reliably), reaches all four major
networks (MTN, Airtel, Glo, 9mobile), and bills in NGN. One thing worth
starting early: approval for that transactional/DND-bypass sender ID
route takes more paperwork than a basic promotional one — get that
process going with Termii before you need it in production.


## 8. Critical bug found in this update: login page redirect loop

`src/app/protected/page.jsx` is your actual login page (role selector +
school-slug dropdown + credentials form) — an unusual but deliberate
location. The proxy guards everything under `/protected`, and its
no-token redirect target was `/protected` itself. Since `/protected` is
inside the guarded zone, this created an **infinite redirect loop**:
any unauthenticated visitor hitting any protected route (or the login
page directly) got bounced in a loop and could never actually reach the
login form. Fixed in `src/app/proxy.ts` by exempting the exact
`/protected` path from the auth check — the page already does its own
client-side "already logged in? redirect away" check, so it's safe to
let everyone reach it.

Also added a **Parent** card to the role selector (it existed nowhere in
the UI before — parents had no discoverable path to `/auth/parent`).

## 9. Teacher sub-role routing — verified correct, traced end-to-end

Confirmed the full chain works exactly as intended, no changes needed
here beyond the redirect-loop fix above:
- Admin's "create teacher" form writes `teacherProfile.department` as
  exactly `director` / `coordinator` / `class_teacher` / `subject_teacher`.
- `school/login` looks up that exact field after authenticating and
  switches on it to compute `redirectTo`.
- `proxy.ts`'s permission map allows each sub-role into their specific
  area.
- Each dashboard layout re-checks `department` client-side as a second
  guard.

One thing to check on your end: this only works for teacher accounts
that actually have `department` set. Any teacher created before this
dropdown existed, or imported another way, will fall through to the
generic (but now working) `/protected/teacher` instead of their specific
dashboard until that field is set.

## 10. Two more real bugs fixed while auditing

- **AI test generation was completely broken** for real usage —
  `src/app/api/protected/teacher/subject/ai-generate-test/route.js`
  used `prisma.subject.findUnique(...)` but never imported `prisma`.
  Threw a 500 every time a teacher selected an actual subject (the
  normal flow). Fixed.
- **Resources had a real privacy gap** — the schema had
  `targetClass`/`targetSubject` columns specifically for scoping a
  teacher's upload to one class, but neither the upload route nor the
  student-facing fetch actually used them. Every student in the school
  could see every resource any teacher uploaded, regardless of class.
  Fixed both `teacher/subject/resources/upload/route.js` (now accepts
  and stores `targetClass`/`targetSubject` from the upload form) and
  `students/resources/route.js` (now filters to the student's own class
  or untargeted school-wide resources only).
- Timetable generation: re-verified — I'd initially misread the
  frontend as calling a dead 11-line stub, but on closer inspection it
  actually calls the real, complete 376-line implementation. Corrected
  myself before reporting it. Did fix a real connection-pool bug in that
  real implementation (its own disconnected `PrismaClient` instead of
  the shared singleton) and deleted the now-confirmed-unused stub route.
- Announcements: the `Announcement` database model exists but has **zero
  API implementation** anywhere — no create route, no student view.
  Not built in this pass; flagged for later if you want it.

## 11. New seed script for testing

`prisma/seed-test-accounts.js` — separate from your existing
`prisma/seed.js` (which sets `teacherProfile.department` to subject
areas like "Mathematics", not the `director`/`coordinator`/
`class_teacher`/`subject_teacher` values the login system actually
checks — so it wouldn't exercise role routing correctly). This new
script creates one account for every role and every teacher
sub-department specifically so you can log in as each and confirm they
land on the right dashboard. Safe to re-run (upserts throughout).

Run it after migrating:
```bash
npx prisma migrate dev --name add_parent_portal
node prisma/seed-test-accounts.js
```

It prints every login identifier at the end. Shared password for every
seeded account: `Test@1234`. School slug to select on login:
`demo-school`. Includes a student with `parentPhone` set to
`+2348012345678`, so once you're ready to test the parent portal you can
use that exact number at `/auth/parent`.



## 12. Still open (not done in this session)

- Storage is still 100% Cloudinary — no Supabase migration has happened
  (and per our discussion, there's no strong reason to — see that
  conversation for the full reasoning).
- Announcements feature — schema exists, zero API/UI implementation.
- No automated tests exist.
- Payment gateway (Paystack/Flutterwave) still isn't wired up.
- In-memory rate limiter won't hold up across serverless instances.
- A full `tsc --noEmit` pass hasn't been run (only `next build`'s
  type-checking, which is close but not 100% identical).
- No SMS provider has real credentials configured yet — sign up with
  Termii and set `TERMII_API_KEY`/`TERMII_SENDER_ID`, or OTPs will only
  ever log to the console. No SMTP credentials configured yet either —
  see the Brevo setup notes from our conversation.
