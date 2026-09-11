# U-Plus — Sidebar scroll fix + Users page

## Sidebar scroll fix

Found the exact bug: the sidebar's outer container was `fixed inset-y-0`
(fills the viewport height) but was never `flex flex-col`. Its children
(header, nav, footer) just stacked in normal block flow — so the nav's
`overflow-y-auto` had no bounded height to actually scroll within, and
just grew past the fixed container instead ("stiff", not scrolling).

Fixed properly: outer container is now `flex flex-col`, header and
footer are `flex-shrink-0` (stay fixed size), and the nav is
`flex-1 min-h-0 overflow-y-auto` — the `min-h-0` is the actual fix here;
without it, a flex child won't shrink below its content size no matter
what overflow value you give it, which is the standard gotcha behind
this exact symptom.

## Users page — visual refresh (logic untouched)

Same approach as the login page: 718 lines of working CRUD logic
(create/edit/delete, CSV import, pagination, filters) that I can't
visually test live, so this was a class-name-only pass, zero behavior
changes. Swapped the primary-action color (`bg-gray-900`, used on 6
buttons/toggles) and the CSV-import info callout (previously blue) to
the jade accent, so the whole admin experience reads as one consistent
system alongside the redesigned dashboard and sidebar. Left the
role-badge colors (student=blue, teacher=emerald, admin=violet) alone —
those exist specifically to tell roles apart at a glance in a list,
which is a different, legitimate purpose from the page's primary-action
color.

## Next

Says to move to the next page after this — let me know which one, or
I'll pick the next highest-traffic one (Fees or Announcements, since
those already exist and are core to admin workflow) and keep going.

Notifications and messaging — noted, will look into these after the
page-by-page redesign pass, as requested.
