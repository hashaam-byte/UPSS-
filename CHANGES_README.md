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


## 8. Still open (not done in this session)

- Storage is still 100% Cloudinary — no Supabase migration has happened.
- AI test generation and timetable generation routes have not been
  audited yet.
- No automated tests exist.
- Payment gateway (Paystack/Flutterwave) still isn't wired up.
- In-memory rate limiter won't hold up across serverless instances.
- A full `tsc --noEmit` pass hasn't been run (only `next build`'s
  type-checking, which is close but not 100% identical).
- No SMS provider has real credentials configured yet — sign up with
  Termii and set `TERMII_API_KEY`/`TERMII_SENDER_ID`, or OTPs will only
  ever log to the console.
