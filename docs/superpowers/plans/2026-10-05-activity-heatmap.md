# Activity Heatmap Plan

Spec: `docs/superpowers/specs/2026-10-05-quest-import-agenda-heatmap-design.md`, section 1.

**Goal:** an Activity panel in the Quest right rail showing 26 weeks of `status_events`
(52 was tried and dropped: cells got too small for the rail)
as a weekday by week grid.

**Scope:** grip-apps only. No new endpoint, no migration, no new dependency.

## Files

| File | Change |
| --- | --- |
| `packages/core/src/activity.js` | new: `activityByDay`, `activityLevel` |
| `packages/core/package.json` | add `"./activity": "./src/activity.js"` to `exports` |
| `packages/core/src/__tests__/activity.test.js` | new |
| `packages/core/src/locales/{en,pt,sv}.js` | 9 keys |
| `apps/web/src/quest/ActivityHeatmap.tsx` | new panel |
| `apps/web/src/quest/QuestRightRail.tsx` | render the panel under velocity |
| `apps/web/src/quest/Quest.tsx` | pass status events loading and error state to the rail |
| `CHANGELOG.md` | dated entry, Added |

## Task 1: core helper (TDD)

`activityByDay(events, now, weeks = 26)`:

- Returns `weeks` columns of 7 days `{ date: "YYYY-MM-DD", count }`, Monday first,
  ending with the week that contains `now`. Days after `now` are `null` (rendered blank).
- Days are local time (matches the funnel's `startOfDay`).
- Events outside the window and unparseable `createdAt` are ignored.

`activityLevel(count, max)`: 0 for 0, otherwise 1 to 4 by quarter of `max`.

Tests first, in `activity.test.js`:

1. no events: every past day has count 0, the grid is 26 x 7
2. three events on one day count as 3
3. an event older than the window and an invalid date are ignored
4. an event at 23:30 local lands on that day, not the next
5. future days in the current week are `null`
6. `activityLevel`: 0 → 0, max → 4, middle values spread across 1 to 3

Run: `pnpm --filter @grip/core test`

Export it: add `./activity` to `packages/core/package.json` `exports` (core only exposes
listed entry points).

## Task 2: copy

Keys in en, pt and sv:

| Key | en |
| --- | --- |
| `quest.activityTitle` | Activity |
| `quest.activityDays` | Active days: {count} |
| `quest.activitySummary` | Active days in the last {weeks} weeks: {count} |
| `quest.activityCell` | {date}: {count} |
| `quest.activityLess` | Less |
| `quest.activityMore` | More |
| `quest.activityLoading` | Loading activity… |
| `quest.activityError` | Activity unavailable. Try again later. |
| `quest.activityShowDays` | Show daily counts |

Weekday and month labels are not locale keys: format them with
`Intl.DateTimeFormat(locale, { weekday: "narrow" })` and `{ month: "short" }` using the
active i18n locale, so en, pt and sv need no hand-written names.

No em or en dashes in any string.

## Task 3: panel

`ActivityHeatmap({ statusEvents })`, a `WorkspacePanel` with `WorkspaceTitle`
(calendar icon, title, days active on the right).

- CSS grid, `grid-template-columns: repeat(26, 1fr)`, 7 rows, cells `aspect-ratio: 1`,
  gap 2px, so it fills the rail at any width from 260 to 340.
- Colors from tokens only: level 0 `colors.well`, levels 1 to 4 `colors.accent` with
  alpha `40`, `70`, `A0`, `colors.accentBright` solid.
- Month labels under the first week of each month; weekday labels M, W, F on the left.
- Legend under the grid: `Less` then the 5 level swatches then `More`.
- Hover tooltip per cell (`title` with `quest.activityCell`) is a mouse extra only.
- Keyboard and screen reader access (guideline 41) without 182 tab stops:
  - the grid is `role="img"` with `aria-label` from `quest.activitySummary`;
  - one `quest.activityShowDays` disclosure button below it opens a list of active
    days only, newest first, each line `quest.activityCell` with a localized date.
    One tab stop, and it carries every date and count the grid shows.
- States, from the Supabase status events query (this is remote data):
  - loading: `quest.activityLoading`, no grid;
  - error: `quest.activityError`, no grid, never a zero grid;
  - success with no events: empty grid and "0 days active".

Data flow: `Quest.tsx` currently does `const { data: statusEvents = [] } =
useStatusEventsQuery()`, which hides errors. Keep that default for the funnel (it already
falls back to contacts), and also read `isPending` and `error` from the same query and
pass them to `QuestRightRail`, which passes them to `ActivityHeatmap`. Widen the rail's
`statusEvents` prop type to include `createdAt`.

## Task 4: verify

- `pnpm run ci`
- Manual: open Quest in the dev server, check the grid at the rail's min and max width,
  hover a cell, tab to the daily counts button and open it, read the grid with a screen
  reader, switch the language to pt and sv to check weekday and month labels, block the
  status events request in devtools to see the error state, and check that adding a
  contact lights today after the status events query refetches.
- Changelog entry under today's date, Added.

## Out of scope

Streak counter, mobile panel, counting retros or quiz answers.
