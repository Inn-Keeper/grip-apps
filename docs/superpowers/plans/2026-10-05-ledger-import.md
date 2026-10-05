# Ledger Import Plan

Spec: `docs/superpowers/specs/2026-10-05-quest-import-agenda-heatmap-design.md`, section 2.

**Goal:** upload a messy .docx or .md list of applications, review what the AI found,
confirm, and get Quest contacts.

**Scope:** three reviewable parts across grip-ai-api, grip-apps and one test in grip-pipeline-service:

| Part | Repo | What |
| --- | --- | --- |
| A | grip-ai-api | `POST /api/v1/ai/import/parse`: extract, redact, parse, restore |
| B | grip-apps (+ one IT in grip-pipeline-service) | migration `0020`: `stage_reached_on` and the trigger change |
| C | grip-apps | core adapter and duplicate check, the import modal, the atomic save |

A and B are independent; C needs both.

## Changes to the spec found while planning

1. **No multipart, no new Python dependency.** FastAPI file uploads need
   `python-multipart`, and the spec proposed `python-docx`. Both are avoidable: the
   browser reads the file and sends JSON `{ "filename", "content_base64" }` or
   `{ "text" }`, and a .docx is a zip whose text lives in `word/document.xml`, which
   the standard library (`zipfile` + `xml.etree`) reads in about 15 lines. Paragraph
   breaks (`w:p`) become newlines, list items stay one per line.
2. **Chunking.** The provider caps context at `AI_CONTEXT_MAX_CHARS` (12,000) and output
   at `AI_MAX_OUTPUT_TOKENS`. A 200-row ledger does not fit one call. Text is split on
   line boundaries into chunks of at most 8,000 characters (room for the prompt) and
   parsed one chunk at a time, then merged. At most 5 chunks (about 40,000 characters,
   roughly 200 to 300 entries); longer input is rejected with a clear message rather
   than half-parsed. The 1 MB file limit stays as a transport guard; the character
   limit is what actually bounds work.
3. **Same provider and quota guard as grading.** Import uses the configured provider
   (Gemini in production, Ollama locally) through the existing `generate()` and shares
   `GradeService`'s rate limit memory, so a spent daily quota blocks both features
   with the same message instead of failing one call at a time.

4. **Line numbers, not echoed text.** Found while building Part A: if the model repeats
   each row's source text, its output roughly doubles, which forces smaller chunks and
   more calls against a free tier of about 20 requests a day. The ledger is sent with
   numbered lines, the model returns `lines: [int]` per row and line numbers for
   `unplaced`, and the service builds `source` from the original lines.

## Part A: grip-ai-api

### Files

| File | Change |
| --- | --- |
| `app/ledger.py` | new: `extract_text`, `redact`, `restore`, `split_chunks` |
| `app/import_schemas.py` | new: request, model output and response models |
| `app/import_prompt.py` | new: system prompt |
| `app/import_service.py` | new: `ImportService.parse` |
| `app/main.py` | route, wiring |
| `tests/test_ledger.py`, `tests/test_import.py` | new |
| `README.md` | endpoint section |

### Contract

Request (JSON, bearer token required):

```json
{ "filename": "ledger.docx", "content_base64": "..." }
{ "text": "applied to acme for FE role..." }
```

Exactly one of `content_base64` or `text`. `filename` decides .docx or .md; anything
else is 415. Decoded size over 1 MB is 413; extracted text over 40,000 characters is
413 with "This list is too long to import at once. Split it into smaller files."

Response:

```json
{
  "rows": [
    {
      "name": "Acme", "role": "Frontend Dev", "status": "Applied",
      "date": "2026-09-30", "stage_date": null,
      "next_action": "Follow up", "next_action_date": "2026-10-12",
      "link": "https://jobs.acme.com/123", "note": "Recruiter: jane@acme.com",
      "source": "applied to acme for FE role https://jobs.acme.com/123 ...",
      "warnings": ["missing_next_action_date", "stage_date_unknown"]
    }
  ],
  "unplaced": ["random line the model could not place"]
}
```

- `source` is restored too, so the user sees their own words, not placeholders.
- Model output schema is strict (`extra="forbid"`), `status` is a `Literal` of the 5
  stages, dates are ISO strings validated as real dates. A row that fails validation is
  moved to `unplaced` with its source line; one bad row never fails the request.
- Warnings are computed in code, not by the model: `missing_role`,
  `missing_next_action_date`, `stage_date_unknown`.
- The model is told today's date so "next Tuesday" resolves; it must return `null` for
  any date it cannot resolve, never a guess.

### Redaction

`redact(text) -> (clean_text, mapping)`, `restore(value, mapping) -> value`:

| Pattern | Placeholder |
| --- | --- |
| URL (`https?://` and `www.`) | `[LINK_n]` |
| Email | `[EMAIL_n]` |
| Phone (7+ digits with spaces, dashes, parens, optional `+`) | `[PHONE_n]` |
| Money (currency symbol or code next to a number, `k` suffix) | `[SALARY_n]` |

Order matters: URLs first (they can contain digits and `@`). Placeholders the model
invents (not in the mapping) are left out of restored fields rather than shown raw.
After restore, a row's first `[LINK_n]` becomes `link`; other placeholders restore in
place inside `note` and `source`.

Never logged: file content, text, rows. Logged: request id, chunk count, row count,
unplaced count.

### Tests (written first)

`test_ledger.py`:
1. .docx extraction from a tiny docx built in the test with `zipfile` (paragraphs and
   a list become lines)
2. .md passes through; unknown extension is rejected
3. each redaction pattern is replaced, and none of the original values appear in
   `clean_text`
4. restore round trip returns the original text exactly
5. a URL containing an email and digits becomes one `[LINK_n]`, not three placeholders
6. chunking splits on line boundaries, never exceeds the limit, keeps every line once

`test_import.py` (stub provider, as `test_grade.py` does):
1. valid rows come back restored, with link moved to `link` and warnings computed
2. a row with an invalid status goes to `unplaced`
3. multiple chunks are merged in order
4. missing token is 401; both or neither of `text`/`content_base64` is 422; oversize is
   413; a spent quota is the same 429 grading returns
5. the provider receives redacted text only (assert no email or URL in the stub's input)

Checks: `.venv/bin/python -m pytest -q`, `.venv/bin/ruff check .`,
`.venv/bin/ruff format --check .`. No live model test unless asked.

## Part B: migration 0020 (grip-apps)

`supabase/migrations/0020_import_stage_date.sql`:

```sql
alter table contacts add column if not exists stage_reached_on date;

create or replace function record_contact_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into status_events (user_id, contact_id, status, created_at)
    values (
      new.user_id, new.id, new.status,
      -- Noon UTC keeps the event on the same calendar day from UTC-11 to UTC+11.
      coalesce((new.stage_reached_on + time '12:00') at time zone 'UTC', now())
    );
  elsif new.status is distinct from old.status then
    insert into status_events (user_id, contact_id, status)
    values (new.user_id, new.id, new.status);
  end if;
  return new;
end;
$$;
```

The trigger itself is unchanged (`after insert or update of status`). Existing rows get
`null`, so nothing changes for them.

Check: grip-apps has no local Postgres, but the pipeline service already tests the
status trigger with Testcontainers against a copy of the schema
(`src/test/resources/db/testcontainers-schema.sql`). Mirror the new column and trigger
there and add one IT: insert with `stage_reached_on = 2026-09-20` gives an event at
`2026-09-20 12:00 UTC`, insert without it gives `now()`, a status update gives `now()`.
That IT needs Docker running.

The migration is applied by hand, as the changelog header says; it is listed under
Database.

## Part C: web (grip-apps)

### Files

| File | Change |
| --- | --- |
| `packages/core/src/ledgerImport.js` | new: `importRowToContact`, `markDuplicates`, `importSummary` |
| `packages/core/src/__tests__/ledgerImport.test.js` | new |
| `packages/core/src/api/contacts.js` | `importContacts(contacts)` |
| `packages/core/src/api/` AI client | `parseLedger(payload)` next to the grading call |
| `packages/core/package.json` | `./ledgerImport` export |
| `packages/core/src/locales/{en,pt,sv}.js` | modal copy |
| `apps/web/src/quest/import/ImportModal.tsx` | the 3 steps and the confirm |
| `apps/web/src/quest/import/ReviewTable.tsx` | editable rows |
| `apps/web/src/quest/Quest.tsx` | Import list button, empty state link |
| `CHANGELOG.md` | Added and Database entries |

### Core (TDD)

- `importRowToContact(row)`: snake_case to the UI shape, ISO dates to `DD-MM-YYYY`
  (`formatDDMMYYYY`), `stage_date` to `stageReachedOn`, empty strings for missing text,
  `postingTechs: []`. One test per field, plus a null date staying empty.
- `markDuplicates(rows, contacts)`: case-insensitive, trimmed name match against existing
  contacts and earlier rows in the same import; returns the row ids to start unchecked.
- `importSummary(rows)`: counts for the confirm dialog (new, missing follow-up date,
  skipped).
- `contactsApi.importContacts(contacts)`: one
  `supabase.from("contacts").upsert(rows, { onConflict: "id", ignoreDuplicates: true })`.
  `contactToDb` gains `stage_reached_on` and passes `id` when present.

### Modal

Steps and copy as in the spec. Implementation points:

- Client ids: `crypto.randomUUID()` per row when the preview arrives, reused on retry.
- File read: `FileReader.readAsArrayBuffer`, base64 in the browser; type and size
  checked before upload so wrong files fail instantly.
- Cancel during reading aborts the fetch (`AbortController`).
- Import button disabled while saving; on failure "Nothing was imported. Try again."
  and a contacts refetch to catch the case where the save did land.
- After success: invalidate contacts and status events queries, close, notice
  "12 applications added to Quest."
- Focus moves to each step's heading; Escape closes only when not saving.
- Hidden entirely when `VITE_AI_URL` is unset, same as grading.

Checks: `pnpm run ci`, then a manual run against a local ai-api with a sample ledger
(fake names) covering a list, free notes, a duplicate, a bad date and a too-long file.

## Order and review points

1. Part A, reviewed and committed in grip-ai-api.
2. Part B, reviewed; applied by hand to Supabase when you choose.
3. Part C core, then the modal; reviewed after each.

## Out of scope

As in the spec: .pdf and .xlsx, repeat syncs, undo, LLM prep notes, mobile.
