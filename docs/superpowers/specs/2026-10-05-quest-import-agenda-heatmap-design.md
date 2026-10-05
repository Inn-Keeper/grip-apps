# Quest Import, Agenda and Activity Heatmap Design

## Goal

Three Quest features, shipped in this order:

1. **Activity heatmap**: see your job hunt rhythm at a glance.
2. **Ledger import**: turn a messy .docx or .md list of applications into Quest contacts.
3. **Agenda**: a Quest panel with today's follow-ups, overdue items, interview prep notes
   and the week ahead. (Email delivery is deferred; see the end of this spec.)

Each ships on its own and gets its own implementation plan.

## Projects touched

| Feature | grip-apps | grip-ai-api | grip-pipeline-service |
| --- | --- | --- | --- |
| Heatmap | core helper + Quest panel | | |
| Import | modal + insert | parse endpoint | |
| Agenda | core helper + Quest panel | | |

---

## 1. Activity heatmap

### Placement

No new screen. A new **Activity** panel in the Quest right rail, under velocity. The rail
already holds the "how am I doing" signals (pace, conversion, velocity), and the heatmap
is one more of those.

```
Activity                     23 days active
 M ░░▓░░█░░▒░░░▓░░░█░▒░░▓░░
 W ░▒░░▓░░█░░▒░░░▓░░▒░░█░▒░
 F ░░▒░░░▓░░█░▒░░▒░░▓░░░▒░░
   Apr        Jun        Aug
Less ░▒▓█ More
```

- 26 weeks (fits the rail width), columns are weeks, rows are weekdays.
- 4 intensity levels from existing color tokens, plus empty.
- Hover or focus on a cell: "3 updates on Sep 14".
- Header shows days active in the window. No streak counter yet (add when there is a
  milestone to celebrate it, per BRAND.md).

### Data

Computed on the client. Quest already loads `status_events`, so a Java endpoint would
only move a group-by over data the page already has.

- `activityByDay(statusEvents, today, weeks)` in `@grip/core` (shared with mobile later),
  returns `{ date, count }[]` in the user's local time zone.
- Counts `status_events` only: one per contact added or moved. Retros and quiz activity
  are out of scope.

### Accessibility

- The grid is `role="img"` with a text summary label ("23 active days in the last 26 weeks").
- Cells are not focusable one by one; the tooltip is a mouse nicety, the summary carries
  the meaning.
- Intensity is not the only signal: the legend and summary state counts.

### Checks

Unit test for `activityByDay`: empty input, multiple events same day, events outside the
window ignored, time zone day boundary.

---

## 2. Ledger import

### Flow (web, Quest)

Entry: **Import list** button next to Add contact; also offered in the Quest empty state
("Already tracking applications somewhere? Import your list.").

One modal, three steps, then a confirmation:

**Upload**
```
Import your applications
Drop a .docx or .md file. Any format works: a list, notes, bullets.
We'll show you what we found before anything is saved.

[ Drop file here or browse ]          .docx or .md, up to 1 MB

Emails, phone numbers, links and salaries are removed before your list
is read by AI. Company names and the rest of your text are sent to
Google Gemini.
```
Wrong type or size is rejected right away with the reason.

**Reading**: "Reading your list..." with Cancel. On failure: "We couldn't read this file.
Try again, or paste the text instead." Paste is the fallback for any file.

**Review**
```
We found 14 applications. Check them, then import.

[✓] Acme      Frontend Dev   Applied       Follow up Oct 12
[✓] Globex    Backend Eng    Interviewing  ⚠ No date found
[ ] Initech   ?              Contacted     ⚠ Already in Quest
    from: "applied to acme for FE role, waiting to hear back"

2 lines we couldn't place  ▸

[ Back ]                              [ Import 12 applications ]
```
- Cells are editable in place; stage is a dropdown of the 5 Quest stages.
- Each row can expand to show the source text it came from.
- Likely duplicates (same name, case-insensitive, already in Quest) start unchecked.
- Unplaced text is listed as written, never dropped silently.

**Confirm**
```
Import 12 applications into Quest?
  10 new
   2 missing a follow-up date
   2 skipped (already in Quest)
[ Cancel ]                  [ Import 12 ]
```
Cancel returns to review with edits kept. Import inserts the rows from the web client
(clients own writes), then shows "12 applications added to Quest."

### Saving (web)

- **Adapter.** `upsertContact` takes the UI shape (camelCase, dates as `DD-MM-YYYY`), so
  passing parse rows through would drop `nextAction`, `nextActionDate` and every date.
  A pure `importRowToContact(row)` in `@grip/core` maps the parse response (snake_case,
  ISO dates) to the UI shape, with a unit test per field.
- **Atomic.** A new `importContacts(contacts)` in the contacts API sends all rows in one
  `insert([...])` request. PostgREST runs one request as one statement, so either every
  row is saved or none is.
- **Retry safe.** Each review row gets a client UUID (`crypto.randomUUID()`) when the
  preview loads, kept across edits and retries. The insert is an upsert on `id` with
  `ignoreDuplicates`, so retrying after a timeout cannot create copies. The import button
  stays disabled while a request is in flight; on error the modal stays open with
  "Nothing was imported. Try again." unless a refetch shows the rows exist.

### Endpoint (grip-ai-api)

`POST /import/parse`, multipart file or `text` field, Supabase JWT required (same check
as grading).

```
file → text  (.docx via python-docx, .md as is; >1 MB or other types → 400)
     → redact (placeholders, values kept in memory for this request only)
     → Gemini, structured JSON output
     → validate (Pydantic), restore placeholders
     → { rows: [...], unplaced: [...] }
```

Row shape:

```json
{
  "name": "Acme",
  "role": "Frontend Dev",
  "status": "Applied",
  "date": "2026-09-30",
  "next_action": "Follow up",
  "next_action_date": "2026-10-12",
  "link": "https://jobs.acme.com/123",
  "note": "Recruiter: jane@acme.com",
  "source": "applied to acme for FE role [LINK_1], recruiter [EMAIL_1]...",
  "warnings": ["missing_next_action_date"]
}
```

Fields map one to one onto `contacts` columns. `status` outside the 5 stages fails
validation and the row moves to `unplaced`. Dates the model cannot resolve are `null`
with a warning, never guessed.

### Redaction

Regex replacement before the prompt, restore after:

| Pattern | Placeholder | Restored into |
| --- | --- | --- |
| Email | `[EMAIL_n]` | note |
| Phone | `[PHONE_n]` | note |
| URL | `[LINK_n]` | `link` (first one), others to note |
| Money amount | `[SALARY_n]` | note |

Known limit: people's names in free text ("talked to Maria") are not detected. The upload
copy says what is sent.

The file and its text are never stored or logged; only counts are logged.

### Failure modes

| Case | Behavior |
| --- | --- |
| Invalid JSON from model | one retry, then 502 with a readable message |
| Gemini quota exhausted | 503 "Import is busy, try again in a minute" |
| Empty result | review step shows "We didn't find any applications" with paste fallback |
| Huge list | cap at 200 rows, warn the rest were not read |

### Imported history (decided)

The `contacts_status_event` trigger stamps the status event with `now()`, so an import of
40 old applications puts 40 events on today in the heatmap. Velocity is unaffected at
import (one event per contact gives no interval), but it would be later: a contact
imported as Interviewing and moved to Offer next week would show only a week in
Interviewing.

**What the event date means.** The insert event marks when the contact reached its
**current** stage, not when the application started. An application date is wrong for an
Interviewing contact: it would inflate later Interviewing dwell.

- The parse row gets `stage_date`: the date the current stage was reached, only when the
  ledger says so ("interview on Sep 20"). The model never infers it from other dates.
- `date` (application date) is used for the event only when the status is Applied or
  Contacted, since reaching those stages is the application or first contact itself
  (added after testing with a real ledger that only had application dates).
- Earlier history (when they applied, when interviews started) is unknown and is not
  invented. Velocity only measures moves that happen after import. The review step shows
  "Stage date unknown, today is used" when `stage_date` is null.

**Migration `0020`.** Adds a nullable column `contacts.stage_reached_on date`, written
only by import from `stage_date`. The trigger's INSERT branch uses
`coalesce((new.stage_reached_on + time '12:00') at time zone 'UTC', now())`.
Noon UTC keeps the event on the same calendar day for every viewer between UTC-11 and
UTC+11, so the heatmap does not slide to the previous day. Updates keep using `now()`.

**Check.** A SQL test in the migration's IT: insert with `stage_reached_on = 2026-09-20`
gives an event at `2026-09-20 12:00 UTC`; insert without it gives `now()`; a status update
gives `now()`.

### Checks

- `test_redact.py`: each pattern is replaced, nothing matching leaks into the prompt,
  every placeholder restores.
- Endpoint test with a stubbed provider: valid rows, invalid stage goes to unplaced,
  oversize file 400, missing JWT 401.
- Web: unit test for duplicate detection and the confirm summary counts.

---

## 3. In-app agenda

### Placement

A new **Agenda** panel at the top of the Quest left rail, above the stage filters. The
left rail is for navigating (rule 4), and every agenda line opens its contact, so it
fits there. `QuestNextUp` stays the single main action; the agenda is the list behind it.

```
Agenda
TODAY
  Acme · Frontend Dev           Follow up on application
OVERDUE
  Initech · Platform Eng        Ask for timeline · 3 days late
INTERVIEW PREP
  Globex · Backend Eng
    Kafka, PostgreSQL, Kubernetes
    Last retro: "Explain partitioning trade-offs more clearly"
THIS WEEK
  Thu  Umbrella · Data Eng      Second round
```

- Empty sections are hidden. With nothing at all: "Nothing on your agenda. Add a follow-up
  date to a contact to plan your week."
- Each line is a button that opens the contact (existing `onOpen`), so it works with the
  keyboard and needs no deep link.
- Overdue uses the warning color token; everything else stays neutral.

### Data

Computed on the client from the contacts Quest already loads (with retros). No
endpoint, no migration.

`buildAgenda(contacts, today)` in `@grip/core`, exported as `./agenda`:

| Section | Rule |
| --- | --- |
| Today | non-terminal, `nextActionDate` is today |
| Overdue | non-terminal, `nextActionDate` before today, oldest first, with days late |
| Interview prep | status Interviewing; techs from `postingTechs`, `toImprove` from the newest retro |
| This week | non-terminal, `nextActionDate` in the next 1 to 7 days, soonest first |

Terminal means Offer or Rejected, same as the pipeline service. Dates are the user's local
day. The panel follows the contacts query states: loading text, an error message on
failure, never an empty agenda on error.

### Checks

Unit tests for `buildAgenda`: each section rule, terminal contacts excluded, overdue day
count, newest retro picked, an interviewing contact with no techs or retros still listed,
empty input.

---

## Deferred: agenda email (halted 2026-10-05)

Kept for when email returns. The in-app agenda (section 3) ships first and its
`buildAgenda` rules become the email's content.

### What it looks like

One email per opted-in user, only on days with something to say. Subject:
**"Today in Grip: 2 follow-ups, 1 interview"**

```
Good morning,

DUE TODAY
  Acme · Frontend Dev            Follow up on application
  Globex · Backend Eng           Send thank-you note

OVERDUE
  Initech · Platform Eng         Ask for timeline (3 days late)

INTERVIEW PREP
  Globex · Backend Eng · Interviewing
    Techs in the posting:  Kafka, PostgreSQL, Kubernetes
    From your last retro:  "Explain partitioning trade-offs more clearly"
    [ Open prep plan ]

COMING UP THIS WEEK
  Thu  Umbrella · Data Eng       Second round

[ Open Quest ]

You get this because the daily agenda is on. Turn it off in Profile.
```

- Plain, calm tone (BRAND.md). No mascot in email.
- **Coming up this week** means non-terminal contacts with `next_action_date` in the next
  7 days.
- Prep notes use data already in the database: `posting_techs` on the contact and
  `to_improve` from that contact's latest retro. Readiness scores stay in the app; the
  **Open prep plan** link deep-links to the contact in Quest, where `PrepPlanSection`
  already computes them. No prep logic is duplicated in Java.
- HTML email with a plain text part. Links go to the web app; no tracking pixels.

### Contact deep link (web work)

Quest opens a contact through component state today and reads nothing from the URL, and
signing in always lands on Prep. The email links need:

- **Route:** `/quest?contact=<uuid>`. Quest reads the param once its contacts load, opens
  that contact, then removes the param with `history.replaceState` so refresh and back
  behave normally.
- **After sign in:** if the URL has `?contact=` and the user is signed out, store it in
  `sessionStorage` (`grip.pendingContact`), the same pattern as
  `GITHUB_LINK_PENDING_KEY`. `initialPage` returns `quest` while it is set; Quest
  consumes and clears it.
- **Missing contact** (deleted, or another account): open Quest normally with a notice
  "That contact is no longer in your Quest." No error page.
- **Checks:** unit test for the param parsing and pending key; manual test signed in,
  signed out, and with a deleted contact id.

### Opt-in

Off by default. Toggle in Profile: "Daily agenda email". Migration `0021` adds
`profiles.agenda_email boolean not null default false` (same pattern as `0009`).

### Service (grip-pipeline-service)

- **Eligibility** replaces the current sweep, which only finds users with a follow-up
  due today or earlier and would miss someone who is only interviewing or only has
  something later this week. One query returns opted-in users with at least one
  non-terminal contact where `next_action_date <= today + 7` **or** `status =
  'Interviewing'`. That covers every section; a user matching none gets no email.
- The agenda is built per eligible user from the same rules, so the eligibility query and
  the sections cannot disagree (tested together).
- Email address read from `auth.users.email` (the service role can read it).
- `ReminderNotifier` gains a real send via the provider's HTTP API using the JDK
  `HttpClient` (no new SDK). The logging behavior stays when no API key is set, so local
  runs and tests need no provider.
- Per-user failures stay isolated (existing try/catch).

### Delivery and retries

- **No duplicate sends.** Each send carries Resend's `Idempotency-Key` header,
  `agenda/<userId>/<YYYY-MM-DD>`. Resend returns the original result for a repeated key
  within 24 hours instead of sending again, so rerunning the job after a timeout is safe.
  No delivery table is needed.
- **Observable outcome.** `ReminderNotifier.send` returns `SENT`, `SKIPPED` (nothing to
  say, or no API key) or `FAILED` instead of only logging. `POST /internal/agenda/run`
  returns `{ "date": "...", "sent": n, "skipped": n, "failed": [userId, ...] }` with 200
  when the run completes, even with failures, so the cron log shows exactly who to retry.
  A retry run sends only what did not succeed, because successful keys are replayed by
  Resend, not resent.

### Scheduling

The free Render instance sleeps, so `@Scheduled` will not fire. A Render Cron Job calls a
protected `POST /internal/agenda/run` once a day, authenticated with a shared secret
header from env. The in-process cron stays disabled in production (`GRIP_REMINDERS_CRON=-`).

All users get the email at the same UTC hour. Per-user time zones are out of scope.

### Provider and unsubscribe

- **Provider**: Resend (decided), via its HTTP API.
- **Unsubscribe**: the Profile toggle is enough for a personal app; a one-click
  unsubscribe link is needed before any wider launch.

### Checks

- Unit tests for agenda building: section grouping, skip when empty, overdue days.
- IT (Testcontainers): only opted-in users with due items get a send call.
- Notifier test against a stub HTTP server: request shape, failure is logged not thrown.

---

## Out of scope

- Import from .pdf, .xlsx, or repeated syncs of the same ledger.
- Undo after import (the confirmation step replaces it).
- LLM-written prep notes.
- Agenda email (deferred, design kept above), push notifications.
- Mobile UI for these features (core helpers are shared, so mobile can follow).
