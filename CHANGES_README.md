# U-Plus — Multi-tenancy leak fix, fabricated analytics fix, hardcoded years

## 1. Serious bug found and fixed: security/notification settings were shared across ALL schools

`SystemSetting.key` was globally `@unique` with no per-school scoping at
all. In practice this meant: when one school's admin changed their
security settings (session timeout, max login attempts, password
length) or notification settings, **it silently changed for every other
school on the platform too** — all schools' admins were reading and
writing the same global database rows.

It went further than that: headadmin's own two separate settings routes
(`settings/security` and `settings/system`) used the *exact same key
names* (`sessionTimeout`, `maxLoginAttempts`, `passwordMinLength`) as
the per-school admin security settings — so headadmin's platform-wide
values and every school's per-school values were actually the same
rows, overwriting each other depending on whoever saved last.

**Fix**: added a `schoolId` column to `SystemSetting` with a compound
unique constraint (`key` + `schoolId`), migrated every consumer (7
files) to scope correctly — school-level settings now use the admin's
real `schoolId`, and platform-wide settings (headadmin's) use a fixed
sentinel UUID instead of a real school ID. A sentinel rather than NULL
specifically because Postgres treats multiple NULLs as distinct under a
unique constraint, which would have silently defeated the fix.

Files touched: `prisma/schema.prisma`, `src/lib/platform-settings.js`,
`admin/settings/notifications/route.js`, `admin/settings/security/route.js`,
`headadmin/settings/security/route.js`, `headadmin/settings/system/route.js`,
`teacher/class/settings/route.js` (this last one had the same leak on
the *read* side — a teacher's settings page was pulling in
notification-category settings from every school, not just their own).

**Migration note**: since the old data was all globally shared anyway,
there's nothing meaningful to migrate forward — running
`npx prisma migrate dev` will add the column and every school will
start fresh with their own scoped settings (falling back to defaults
until each admin saves their own).

## 2. Analytics page — fabricated metrics replaced with real ones

Found while auditing: several "analytics" numbers were not real data —
`dailyActiveUsers: activeUsers * 0.85` (an arbitrary multiplier),
`averageSessionDuration: 24` (hardcoded, with a code comment admitting
"this would need session tracking implementation"), `userRetentionRate`
(an invented formula), `gradingTimeliness: 85` (hardcoded, same kind of
comment), and `resourceUploads` was actually counting **Assignment**
records, not Resources — a mislabeled query. The frontend then added
*its own* fake fallback numbers on top (`|| 5`, `|| 95.0`, `|| 4`) if
the already-fake backend numbers were ever falsy.

Replaced with real computed values: daily active users now counts
actual logins in the last 24 hours; retention compares real active-user
counts between two real time periods; grading timeliness checks real
`gradedAt` timestamps against assignment due dates; resource uploads
correctly queries the `Resource` table. Average session duration is
shown as "Not tracked yet" rather than a fabricated number, since no
session-duration data genuinely exists to compute it from.

## 3. Hardcoded "© 2025" fixed in 5 layout files

`admin/layout.jsx`, `teacher/coordinator/layout.jsx`,
`teacher/director/layout.jsx`, `headadmin/layout.jsx`, and the stale
`Headadmin/layout.jsx` duplicate all had a literal "© 2025" footer.
Replaced all five with `{new Date().getFullYear()}` so it's always
correct.

**Still flagging**: `Headadmin/layout.jsx` (capital) is the exact
case-duplicate bug I've mentioned before — it should be deleted from
your real repo, not just patched. I fixed it since it's live code you
currently have, but deleting the whole folder is still the real fix.

## 4. Dashboard/sidebar/users page (previous message, included again for completeness)

Same content as the last zip — sidebar scroll fix (`flex flex-col` +
`min-h-0`), dashboard rebuilt with real charts, users page recolored to
match. No changes since last time, just bundled together since the
schema file overlaps.

## Next

Still owed from your last message: Fees, Announcements, Notifications
(+ how it's handled), Subscription, Resources, and Profile pages.
Given how much ground this round covered, continuing those in the next
message.
