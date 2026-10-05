# Quest Agenda Plan

Spec: `docs/superpowers/specs/2026-10-05-quest-import-agenda-heatmap-design.md`, section 3.

**Goal:** an Agenda panel at the top of the Quest left rail listing Today, Overdue,
Interview prep and This week, each line opening its contact.

**Scope:** grip-apps only. No endpoint, no migration, no new dependency. Contacts (with
retros) are already loaded by Quest.

## Files

| File | Change |
| --- | --- |
| `packages/core/src/agenda.js` | new: `buildAgenda` |
| `packages/core/package.json` | add `"./agenda": "./src/agenda.js"` to `exports` |
| `packages/core/src/__tests__/agenda.test.js` | new |
| `packages/core/src/locales/{en,pt,sv}.js` | 12 keys |
| `apps/web/src/quest/QuestAgenda.tsx` | new panel |
| `apps/web/src/quest/QuestLeftRail.tsx` | render the panel above the stage filters |
| `apps/web/src/quest/Quest.tsx` | pass contacts state and `onOpen` to the left rail |
| `CHANGELOG.md` | entry under the existing 2026-10-05 Added |

## Task 1: core helper (TDD)

`buildAgenda(contacts, now)` returns
`{ today, overdue, prep, week }`, each an array of the input contacts (plus `daysLate`
on overdue items), and `isEmpty`.

Rules (dates are `DD-MM-YYYY`, parsed with the existing `parseDDMMYYYY`, compared as
local days):

| Section | Rule | Order |
| --- | --- | --- |
| `today` | non-terminal, `nextActionDate` is today | by name |
| `overdue` | non-terminal, `nextActionDate` before today; `daysLate` = whole days | most late first |
| `prep` | status `Interviewing`; adds `techs` (`postingTechs`) and `lastToImprove` (the last retro's `toImprove`, retros arrive sorted by `created_at`) | by name |
| `week` | non-terminal, `nextActionDate` 1 to 7 days ahead | soonest first |

- Terminal is Offer or Rejected, from a shared `TERMINAL_STATUSES` constant added to
  `contacts.js` (the Java service uses the same pair).
- A contact with a date but no `nextAction` text is still listed; the panel shows a
  fallback label. (Unlike `isDue`, which requires both: a dated contact with no action
  text is still something on your week.)
- An Interviewing contact can appear in both `prep` and a date section. That is
  intended: one is "prepare", the other is "do this today".

Tests first, in `agenda.test.js`, with a fixed `now`:

1. empty input: every section empty, `isEmpty` true
2. today, overdue, week and beyond-week dates land in the right section (beyond: nowhere)
3. Offer and Rejected contacts never appear in a date section
4. `daysLate` is 3 for a date three days back; overdue sorted most late first
5. week sorted soonest first; a date exactly 7 days ahead is included, 8 is not
6. prep picks the last retro's `toImprove`; an Interviewing contact with no techs and
   no retros is still listed with empty `techs` and `null` `lastToImprove`
7. a contact with an unparseable `nextActionDate` is ignored by date sections

Run: `pnpm --filter @grip/core test`

## Task 2: copy

| Key | en |
| --- | --- |
| `quest.agendaTitle` | Agenda |
| `quest.agendaToday` | Today |
| `quest.agendaOverdue` | Overdue |
| `quest.agendaPrep` | Interview prep |
| `quest.agendaWeek` | This week |
| `quest.agendaDaysLate` | Late: {days} d |
| `quest.agendaLastRetro` | Last retro: {note} |
| `quest.agendaNoAction` | No action set |
| `quest.agendaEmpty` | Nothing on your agenda. Add a follow-up date to a contact to plan your week. |
| `quest.agendaLoading` | Loading agenda… |
| `quest.agendaError` | Agenda unavailable. Try again later. |

Plurals avoided ("Late: 3 d"), as with the heatmap. Weekday names in This week come from
`Intl.DateTimeFormat(locale, { weekday: "short" })`. No em or en dashes.

## Task 3: panel

`QuestAgenda({ contacts, loading, error, onOpen })`, a `WorkspacePanel` with
`WorkspaceTitle` (calendar icon).

- Sections render only when non-empty, each under a small uppercase label.
- Line: `name · role` on the left, `nextAction` (or `quest.agendaNoAction`) on the right;
  overdue lines add `quest.agendaDaysLate` in `colors.warning`; week lines start with the
  weekday.
- Prep lines: name and role, then techs joined by commas, then `quest.agendaLastRetro`
  when present. Long text truncates with ellipsis on one line each.
- Each line is a `<button>` calling `onOpen(id)`, full width, visible focus ring, so the
  whole panel works by keyboard and reads as a list of buttons to screen readers.
- Long lists: show at most 5 lines per section with a "+N more" note; the full list is the
  pipeline below. (`quest.agendaMore`: `+{count} more`, the 12th key.)
- States: contacts `null` and no error → `quest.agendaLoading`; error →
  `quest.agendaError` (the center column already shows the detailed load error); success
  with nothing → `quest.agendaEmpty`.

Wiring: `Quest.tsx` passes `loadError` and the same `onOpen` handler `QuestNextUp` uses
(`setFocus({ mode: "detail", id })`) into `QuestLeftRail`, which renders `QuestAgenda`
first. The rail currently receives `contacts ?? []`; also pass the raw `contacts` so
loading can be told apart from empty.

## Task 4: verify

- `pnpm run ci`
- Manual (needs a signed-in session): contacts in each section, open one from the agenda
  by mouse and by keyboard, a contact with no action text, more than 5 overdue, pt and sv
  labels, and the empty state on a fresh account.
- Changelog line under 2026-10-05 Added.

## Out of scope

Email delivery (deferred in the spec), mobile panel, editing from the agenda, snoozing.
