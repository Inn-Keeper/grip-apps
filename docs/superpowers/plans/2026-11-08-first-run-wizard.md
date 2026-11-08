# First-Run Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A web wizard (stack, goal, role, experience) that has Gemini generate a playbook of interview questions as sample STAR stories plus one scored Arch Board scenario, saves them, and lands the user on practice.

**Architecture:** grip-ai-api gets one endpoint, `POST /api/v1/ai/first-run/playbook`, sharing GradeService's provider, auth and quota memory (the ImportService pattern), with a cache, a per-user daily cap and a concurrency cap. `@grip/core` gets pure helpers (redaction, playbook client, save orchestration). The web app gets a scoped `apps/web/src/firstRun/` folder mounted from `App.tsx`. One Supabase migration adds two story columns and resets the onboarding flag.

**Tech Stack:** Python 3.11, FastAPI, Pydantic, pytest; React, TypeScript/JS, TanStack Query, Supabase; core tests via `pnpm --filter @grip/core test`, web tests via `node --test` (`.test.js` only).

**Spec:** `docs/superpowers/specs/2026-11-08-first-run-wizard-design.md`

## Global Constraints

- Web only; do not touch `apps/mobile` except where shared core changes require it to keep compiling.
- Copy in English, Portuguese and Swedish (`packages/core/src/locales/{en,pt,sv}.js`), keys under `firstRun.*`. No em or en dashes in any copy.
- Colors and sizes from `apps/web/src/lib/tokens.ts`; no hardcoded hex in components. Labels never use teal.
- Follow `SCREEN-GUIDELINES.md`, `DESIGN.md`, `BRAND.md`. Reduced motion skips every effect.
- No new production dependencies.
- Never log job text, CV text, notes or URLs; log counts and codes only.
- Comments: one or two lines, what and why.
- Commit only when the user asks: short imperative subject, no type prefix, no co-author trailer, on `main`.
- Checks: grip-apps `pnpm run ci`; grip-ai-api `.venv/bin/python -m pytest -q`, `.venv/bin/python -m ruff check .`, `.venv/bin/python -m ruff format --check .`. No live model tests.

## Review Focus

1. **Double click / resubmit on Generate** should produce one playbook, not two scenarios. Pinned in Task 6 (button disabled while pending) and Task 4 (save resumes with the known `scenarioId`).
2. **Anonymous demo session** must never see the wizard. Pinned in Task 6 `shouldShowWizard` test.
3. **CV with the user's name in different case or split across a line** should still be redacted. Pinned in Task 3 test `redacts display name parts case-insensitively`.
4. **Model returns a check with an unknown node type or a competency outside the list** must yield 502 and nothing saved. Pinned in Task 1 validation tests.
5. **Editing a sample story on web** must clear `is_sample` but keep the `playbook` label. Pinned in Task 2 `storyToDb` tests and Task 7.

---

### Task 1: Playbook schemas and validation (grip-ai-api)

**Files:**
- Create: `grip-ai-api/app/playbook_schemas.py`
- Test: `grip-ai-api/tests/test_playbook_schemas.py`

**Interfaces:**
- Produces:
  - `PlaybookRequest(StrictModel)`: `stack: list[str]` (≤ 30 items, each ≤ 40), `goal: Literal["technical","stories","design","explore"]`, `brief: str = ""` (≤ 500), `role: str = ""` (≤ 120), `job_text: str = ""` (≤ 4000), `cv_text: str = ""` (≤ 3000), `notes: list[str] = []` (≤ 3 items, each ≤ 500), `locale: Literal["en","pt","sv"] = "en"`, `competencies: list[str]` (1..20), `node_types: list[str]` (1..60).
  - `ModelStory`: `title` (≤ 200), `competency`, `situation`, `task`, `action`, `result` (each ≤ 1200), `technical: bool`.
  - `ModelCheck`: `kind: Literal["node","edge"]`, `type: list[str] = []`, `from_: list[str] = Field([], alias="from")`, `to: list[str] = []`, `label` (≤ 120), `points: int` (1..30).
  - `ModelScenario`: `name` (≤ 80), `brief` (≤ 1500), `checks: list[ModelCheck]` (3..12).
  - `ModelPlaybook`: `stories: list[ModelStory]` (5..8), `scenario: ModelScenario`. This is also the response model.
  - `validate_playbook(playbook: ModelPlaybook, competencies: list[str], node_types: list[str]) -> None`, raising `AppError(502, "invalid_model_response", ...)`.
- `prop` checks are out of v1 (my call in this plan): the model only emits `node` and `edge`, which `arch.js` already scores.

- [ ] **Step 1: Write failing tests**

```python
def test_rejects_unknown_competency(): ...      # competency "Teamwork" not in list -> AppError 502
def test_rejects_unknown_node_type(): ...       # edge from ["kafka"] -> AppError 502
def test_edge_needs_from_and_to(): ...          # kind "edge" with empty to -> 502
def test_node_needs_type(): ...                 # kind "node" with empty type -> 502
def test_valid_playbook_passes(): ...           # 5 stories, 3 checks, all ids allowed -> no raise
def test_request_caps(): ...                    # job_text of 4001 chars -> pydantic ValidationError
def test_check_serializes_from_alias(): ...     # ModelCheck(...).model_dump(by_alias=True) has key "from"
```

- [ ] **Step 2: Run** `.venv/bin/python -m pytest tests/test_playbook_schemas.py -q`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** the models and `validate_playbook` in `app/playbook_schemas.py`, reusing `StrictModel` from `app/import_schemas.py`.
- [ ] **Step 4: Run** the same command. Expected: all pass.

### Task 2: Playbook endpoint, guards and provider status (grip-ai-api)

**Files:**
- Create: `grip-ai-api/app/playbook_prompt.py`, `grip-ai-api/app/playbook_service.py`
- Modify: `grip-ai-api/app/config.py` (two settings), `grip-ai-api/app/main.py` (`attach_services`, route), `grip-ai-api/app/service.py` (`grading_status` adds `provider`)
- Test: `grip-ai-api/tests/test_playbook.py`, extend `grip-ai-api/tests/test_health.py` or `test_quota.py` for status

**Interfaces:**
- Consumes: Task 1 models and `validate_playbook`; `GradeService` (`supabase.validate_session`, `current_limit()`, `remember()`, `provider.generate(model, system_prompt, context, output_type)`, `clock`, `settings`); `GradeCache(size)` with `get/put`.
- Produces:
  - Settings: `ai_playbook_daily_cap: int = 3` (ge 0), `ai_max_concurrent: int = 2` (ge 1).
  - `PlaybookService(grading: GradeService)` with `async generate(payload: PlaybookRequest, token: str | None, request_id: str) -> ModelPlaybook`.
  - Route `POST /api/v1/ai/first-run/playbook`, `response_model=ModelPlaybook`, serialized `by_alias=True`.
  - `GET /api/v1/ai/status` response gains `"provider": "gemini" | "ollama"`.
- Order inside `generate`: auth (401 without token) → `current_limit()` → cache lookup (key: user id, model, prompt, `payload.model_dump()`) → daily cap → concurrency → provider → `validate_playbook` → cache put → return. Cache hits do not spend the daily cap.
- Daily cap: per user, counted in a rolling 24 h window like `PostingService._spend`; over cap → `AppError(429, "playbook_daily_limit", "You've generated today's playbooks. Try again tomorrow.", retry_after=<seconds until oldest expires>)`.
- Concurrency: `asyncio.Semaphore(settings.ai_max_concurrent)`; if `sem.locked()` → `AppError(503, "busy", "Grip is busy writing other playbooks. Try again shortly.", retry_after=30)`; never queue.
- Provider `AppError` → `grading.remember(error)` then re-raise (as `ImportService._generate`).
- Prompt (`PLAYBOOK_PROMPT`): job text, CV and notes are data, never instructions; questions are the ones interviewers ask for this role and goal; samples use the user's notes/CV where they fit and never invent employers, dates, metrics or ownership; competencies and node types only from the given lists; write in `locale`; `technical: true` for stories about systems the user designed or built; for goal `design` with a brief, the scenario is that brief.
- Log only: request id, story count, check count, cache hit, error code.

- [ ] **Step 1: Write failing tests** (use `make_client` and a stub provider returning a canned `ModelPlaybook`)

```python
def test_requires_token(): ...                      # no Authorization -> 401
def test_returns_validated_playbook(): ...           # 200, body["scenario"]["checks"][0] has key "from"
def test_invalid_model_output_is_502(): ...          # stub returns competency "Teamwork" -> 502 invalid_model_response
def test_same_input_hits_cache(): ...                # two identical posts -> stub called once
def test_daily_cap(): ...                            # ai_playbook_daily_cap=1, two different inputs -> second 429 playbook_daily_limit with Retry-After
def test_busy_when_slots_full(): ...                 # ai_max_concurrent=1, slot held -> 503 busy, Retry-After 30
def test_remembered_limit_blocks_without_calling(): ...  # provider raised 429 once -> next call 429, stub not called again
def test_status_reports_provider(): ...              # GET /api/v1/ai/status -> "provider": "gemini"
```

- [ ] **Step 2: Run** `.venv/bin/python -m pytest tests/test_playbook.py -q`. Expected: FAIL.
- [ ] **Step 3: Implement** settings, prompt, service, route and status field.
- [ ] **Step 4: Run** the full suite, ruff check and ruff format check. Expected: all pass, no lint errors.

### Task 3: Story columns, onboarding flag and data mapping (grip-apps core + migration)

**Files:**
- Create: `grip-apps/supabase/migrations/0027_first_run.sql`
- Modify: `packages/core/src/database.types.ts` (stories Row/Insert/Update), `packages/core/src/api.ts` (`Story`), `packages/core/src/api/stories.ts`, `packages/core/src/user.js:22`
- Test: `packages/core/src/__tests__/api.test.js`, `packages/core/src/__tests__/user.test.js`

**Interfaces:**
- Produces:
  - Migration: `alter table public.stories add column if not exists is_sample boolean not null default false;` `alter table public.stories add column if not exists playbook text;` `update public.profiles set onboarding_completed = false;` (one-time reset; the comment says why).
  - `Story` gains `isSample?: boolean` and `playbook?: string | null`.
  - `storyToUi` maps both; `storyToDb` writes `is_sample` / `playbook` only when the field is defined (same rule as `scenarioId`, so mobile saves leave them alone). List select includes both columns.
  - `profileFormToUpdate` no longer sets `onboardingCompleted`.

- [ ] **Step 1: Write failing tests**

```js
test("profileFormToUpdate leaves onboardingCompleted alone", ...)   // result has no onboardingCompleted key
test("storyToDb omits is_sample and playbook when undefined", ...) // upsertStory row lacks both keys
test("storyToDb writes isSample false and keeps playbook", ...)    // { isSample:false, playbook:"Backend Engineer" } -> is_sample:false, playbook:"Backend Engineer"
test("listStories maps is_sample and playbook", ...)
```

- [ ] **Step 2: Run** `pnpm --filter @grip/core test`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the migration, types and mapping.
- [ ] **Step 4: Run** core tests and `pnpm typecheck`. Expected: pass. Apply the migration locally with the project's usual Supabase command and confirm the columns exist.

### Task 4: Redaction, playbook client and save orchestration (grip-apps core)

**Files:**
- Create: `packages/core/src/firstRun.js`
- Modify: `apps/web/src/lib/api.ts` (export `playbookApi`, null when `VITE_AI_URL` unset)
- Test: `packages/core/src/__tests__/firstRun.test.js`

**Interfaces:**
- Consumes: Task 3 `Story` fields; `COMPETENCIES` (`stories.js`), `NODE_TYPES` (`arch.js`); `upsertCustomScenario(s) -> SavedScenario`, `upsertStory(s) -> void`.
- Produces:
  - `FIRST_RUN_LIMITS = { brief: 500, role: 120, jobText: 4000, cvText: 3000, notes: 3, note: 500 }` (must match Task 1).
  - `redactCv(text: string, displayName: string) -> string`: replaces emails with `[email]`, phone numbers (8+ digits with spaces, dots, dashes, parentheses, optional `+`) with `[phone]`, URLs and bare `linkedin.com/...`/`github.com/...` with `[link]`, street-address lines (a number next to a street word: street, st., road, rd., avenue, ave, rua, avenida, gatan, vägen) with `[address]`, and the full display name plus each name part of 3+ letters (case-insensitive, word boundaries) with `[name]`.
  - `playbookLabel({ role, goal }) -> string`: trimmed role, else the localized goal name.
  - `landingFor(goal) -> "prep" | "stories" | "board"`: technical/explore → prep, stories → stories, design → board.
  - `createPlaybookApi(getToken, baseUrl) -> { generatePlaybook(input, { signal }) }`, throws `PlaybookError` with `code`, `status`, `retryAfter` (from the `Retry-After` header). Same shape as `createPostingReaderApi`. Sends `competencies: COMPETENCIES`, `node_types: NODE_TYPES.map(n => n.type)`.
  - `savePlaybook(playbook, { label, upsertCustomScenario, upsertStory }, progress = { scenarioId: null, saved: [] }) -> Promise<{ scenarioId, saved: string[], failed: string[] }>`: creates the scenario only when `progress.scenarioId` is null (checks mapped back to `from` keys), then saves each story whose title is not in `progress.saved` with `isSample: true`, `playbook: label`, `scenarioId` on technical ones. Never throws for a single story; collects `failed` titles so a retry passes the returned progress back in.

- [ ] **Step 1: Write failing tests**

```js
test("redacts email, phone, url and address", ...)
test("redacts display name parts case-insensitively", ...)   // "Dalton Castro" removes "DALTON" and "castro", keeps "Costa"
test("keeps company names and tech words", ...)              // "Spotify", "React" survive
test("landingFor maps goals", ...)
test("playbookLabel prefers role over goal", ...)
test("savePlaybook links technical stories to the new scenario", ...)
test("savePlaybook retry reuses scenarioId and skips saved stories", ...)  // second call: upsertCustomScenario not called, only failed titles saved
test("generatePlaybook surfaces code and retryAfter", ...)   // mocked fetch 429 with Retry-After: 120
```

- [ ] **Step 2: Run** `pnpm --filter @grip/core test`. Expected: FAIL.
- [ ] **Step 3: Implement** `firstRun.js` and the `api.ts` binding.
- [ ] **Step 4: Run** core tests and typecheck. Expected: pass.

### Task 5: Wizard steps (web)

**Files:**
- Create: `apps/web/src/firstRun/FirstRunWizard.tsx`, `StepStack.tsx`, `StepGoal.tsx`, `StepRole.tsx`, `StepExperience.tsx`, `StepReview.tsx`, `wizardState.js`
- Modify: `packages/core/src/locales/en.js`, `pt.js`, `sv.js`
- Test: `apps/web/src/firstRun/wizardState.test.js`

**Interfaces:**
- Consumes: `PREP_TECHS`, `categories` (`prepData.js`); `extractTechsFromText` (`techMatch.js`); `postingReader.readPostings`; `readCvText` (`profile/cvParser.ts`); `redactCv`, `FIRST_RUN_LIMITS`; `useProfileQuery`, `useGradingStatusQuery` (for `provider`).
- Produces:
  - `wizardState.js`: `initialWizard(profile) -> WizardState` (prefills `stack` from `favoriteTechs`, `role` from `targetRole`), `wizardReducer(state, action)` with actions `toggleTech`, `setGoal`, `setField`, `next`, `back`, `skip`, `goTo`; steps `["stack","goal","role","experience","review","generate"]`. `canContinue(state)`: stack always true, goal requires a goal.
  - `<FirstRunWizard profile onDone(page) onExplore() />`.
- UI rules: one question per screen, one primary action, "Skip" on role and experience, "Explore first" link on every step. Goal is a radio group. Review rows have labelled edit buttons ("Edit stack" etc.) and names the provider: `firstRun.review.provider.gemini` = "Google Gemini", `.ollama` = "a local model". Experience shows the redacted CV in an editable textarea with a char counter at `cvText`; job text counter at `jobText`. Link fetch failure shows "Couldn't read that link. Paste the description instead." and keeps the input. Detected job techs not in the stack render as "Add {tech}" chips.

- [ ] **Step 1: Write failing tests** (`node:test`)

```js
test("prefills stack and role from profile", ...)
test("goal step blocks continue until a goal is chosen", ...)
test("skip on role moves to experience and keeps entered fields", ...)
test("back preserves inputs", ...)
test("goTo from review returns to the chosen step", ...)
```

- [ ] **Step 2: Run** `pnpm --filter web test`. Expected: FAIL.
- [ ] **Step 3: Implement** the reducer, step components and the three locales.
- [ ] **Step 4: Run** web tests, `pnpm lint`, `pnpm typecheck`. Expected: pass.

### Task 6: Generate screen, Poe walk, mounting and landing (web)

**Files:**
- Create: `apps/web/src/firstRun/GenerateStep.tsx`, `apps/web/src/firstRun/PoeWalk.tsx`, `apps/web/src/firstRun/gating.js`, `apps/web/public/mascot/poe-walk.png` (placeholder sprite sheet: 4 frames, 32×32 each, until the real art exists)
- Modify: `apps/web/src/App.tsx` (render wizard instead of the page when gated or opened), `SCREEN-GUIDELINES.md` rule 34, `docs/poe-mascot-spec.md` (add the pixel sprite section)
- Test: `apps/web/src/firstRun/gating.test.js`

**Interfaces:**
- Consumes: Task 4 `playbookApi.generatePlaybook`, `savePlaybook`, `landingFor`, `playbookLabel`; Task 5 `<FirstRunWizard>`; `openInBoard({ scenarioId })` (`lib/boardHandoff.ts`); `selectPage`; `useSaveProfileMutation` / `updateProfile`.
- Produces:
  - `shouldShowWizard({ session, profile, openedManually }) -> boolean`: true when `openedManually`, else when session exists, user is not anonymous, profile has loaded and `onboardingCompleted` is false. Share routes already return before this point.
  - App state `setupOpen` plus `openSetup()` passed to Profile and StoryBank (Task 7).
- Generate flow: on enter, save `favoriteTechs` and `targetRole` with `onboardingCompleted: true`, then call `generatePlaybook` once (AbortController; button disabled while pending), then `savePlaybook`, then invalidate stories and custom-scenario queries and land: `board` → `openInBoard({ scenarioId })`; others → `selectPage(landingFor(goal))`.
- "Start practicing instead" aborts the request and lands on the goal's page.
- Errors: show the service message plus a "Try again" button disabled for `retryAfter` seconds; partial save shows saved/failed counts and retries with the returned progress. No playbook API configured (`VITE_AI_URL` unset): skip generation and land directly.
- `PoeWalk`: sprite via CSS `steps(4)` on `background-position` plus a horizontal `translateX` across the container, `image-rendering: pixelated`, `aria-hidden`; under it a `role="status"` line cycling "Reading the role" → "Writing your playbook" → "Drawing your board". Reduced motion (`lib/motion.ts`): one still frame, status line only.
- SCREEN-GUIDELINES rule 34: append "Poe may also walk across the playbook generation screen while it waits, because there the motion is the message: work is in progress."
- "Explore first" sets `onboardingCompleted: true` and closes the wizard.

- [ ] **Step 1: Write failing tests**

```js
test("anonymous demo session never sees the wizard", ...)
test("shows for a signed-in user with onboardingCompleted false", ...)
test("hidden while profile is loading", ...)
test("manual open shows even when completed", ...)
```

- [ ] **Step 2: Run** `pnpm --filter web test`. Expected: FAIL.
- [ ] **Step 3: Implement** gating, generate screen, Poe walk, App mounting and the two doc edits.
- [ ] **Step 4: Run** `pnpm run ci`. Expected: pass.
- [ ] **Step 5: Browser check** with the `run` skill: new account path end to end with the AI service stubbed or local; verify 375 portrait, 1280 desktop and reduced motion; double click Generate creates one scenario.

### Task 7: Stories labels and setup entry points (web)

**Files:**
- Modify: `apps/web/src/storyBank/StoryCard.tsx`, `StoryForm.tsx`, `StoryBank.tsx`; `apps/web/src/profile/Profile.tsx` (or the relevant section in `ProfileSections.tsx`); `App.tsx` (pass `openSetup`); locales
- Test: extend `packages/core/src/__tests__/api.test.js` only if Task 3 did not cover the save shape; UI checked in browser

**Interfaces:**
- Consumes: Task 3 `Story.isSample`, `Story.playbook`; Task 6 `openSetup()`.
- Produces: StoryCard shows a "Sample" tag when `isSample` and a neutral label with `playbook` when set (colors from tokens, not teal). StoryForm save sends `isSample: false` and leaves `playbook` untouched. StoryBank shows "Generate my playbook" (calls `openSetup`) when the user has no playbook stories. Profile shows "Set up your practice" (calls `openSetup`).

- [ ] **Step 1:** Implement the labels, the save change and both entry points with locales.
- [ ] **Step 2:** Run `pnpm run ci`. Expected: pass.
- [ ] **Step 3:** Browser check: a generated story shows both tags; after editing, only the playbook label remains; Profile and Stories entries open the prefilled wizard; a rerun adds stories next to the old ones.

### Task 8: Changelog and final verification

**Files:**
- Modify: `grip-apps/CHANGELOG.md` (dated 2026-11-08 or the ship date: Added, Changed, Database)

- [ ] **Step 1:** Write the changelog entry; leave earlier entries untouched.
- [ ] **Step 2:** Run all checks for both repos (Global Constraints). Expected: pass; report any skipped check.
- [ ] **Step 3:** Summarize files changed, commands run, skipped checks and follow-ups (real Poe pixel sprite art; mobile parity for the new story fields; moving rate counters to Supabase if the API scales out).
