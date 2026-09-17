# Grip Evaluation Findings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Close the six evaluation findings and restore the mobile Jest suites without widening Grip's service boundaries.

**Architecture:** Keep identity transitions in the clients, data aggregation and mutations in the shared core/Supabase boundary, and request-aware evidence validation in the AI service. Structural writing progress remains local, while only a validated AI grade may contribute reasoning quality to readiness.

**Tech Stack:** React 19, React Native/Expo, TanStack Query 5, JavaScript/TypeScript, Jest, Supabase/PostgreSQL, FastAPI/Pydantic, pytest.

**Spec:** `docs/superpowers/specs/2026-09-07-evaluation-findings-design.md`

## Global Constraints

- Do not write to or repair a live Supabase project.
- Preserve current public data shapes unless a task explicitly changes them.
- Keep web and mobile behavior aligned.
- Derive database users only from `auth.uid()`.
- Implement each behavior test-first and commit each task separately.
- Preserve the existing ungraded Qwen calibration and optional Gemini provider.

---

### Task 1: Restore the mobile Jest runner

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `pnpm-lock.yaml`
- Test: `apps/mobile/src/**/*.test.tsx`

**Interfaces:**
- Consumes: Jest's existing `jest.setup.js` imports.
- Produces: a direct mobile dependency on `@babel/runtime`.

- [x] **Step 1: Reproduce the missing runtime failure**

Run: `pnpm --filter mobile test --runInBand`

Expected: all four suites fail before execution with `Cannot find module '@babel/runtime/helpers/interopRequireDefault'`.

- [x] **Step 2: Add the direct runtime dependency**

Run: `pnpm --filter mobile add @babel/runtime`

Expected package change:

```json
"dependencies": {
  "@babel/runtime": "^7.29.0"
}
```

Accept the compatible version selected by pnpm and record its exact resolution in `pnpm-lock.yaml`.

- [x] **Step 3: Verify the real suites execute**

Run: `pnpm --filter mobile test --runInBand`

Expected: four suites execute with no module-resolution failure. Fix only newly exposed compatibility failures needed to make those existing tests pass.

- [x] **Step 4: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml apps/mobile/jest.setup.js
git commit -m "fix: restore mobile test runtime"
```

### Task 2: Clear private caches on identity transitions

**Files:**
- Create: `packages/core/src/authCache.js`
- Create: `packages/core/src/__tests__/authCache.test.js`
- Modify: `packages/core/package.json`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/mobile/src/app/_layout.tsx`

**Interfaces:**
- Produces: `identityChanged(previousUserId, nextUserId): boolean` from `@grip-apps/core/authCache`.
- Consumes: TanStack `QueryClient.clear()` and mobile persister `removeClient()`.

- [x] **Step 1: Write transition tests**

Add `authCache.test.js` assertions:

```js
expect(identityChanged(undefined, "user-a")).toBe(false);
expect(identityChanged("user-a", "user-a")).toBe(false);
expect(identityChanged("user-a", null)).toBe(true);
expect(identityChanged("user-a", "user-b")).toBe(true);
```

- [x] **Step 2: Verify RED**

Run: `pnpm --filter @grip-apps/core test -- authCache`

Expected: FAIL because `authCache.js` and its export do not exist.

- [x] **Step 3: Implement the shared decision**

Create:

```js
export function identityChanged(previousUserId, nextUserId) {
  return previousUserId !== undefined && previousUserId !== nextUserId;
}
```

Export `./authCache` from `packages/core/package.json`.

- [x] **Step 4: Apply it to web authentication**

In `App.tsx`, obtain `queryClient` with `useQueryClient`, retain the last user ID in a ref, and before rendering a changed subject run:

```ts
if (identityChanged(previousUserId.current, nextId)) queryClient.clear();
previousUserId.current = nextId;
setSession(nextSession);
```

The explicit sign-out handler must call `queryClient.clear()` before `supabase.auth.signOut()` so private rows disappear immediately.

- [x] **Step 5: Apply it to mobile persistence**

In `_layout.tsx`, use the same transition check. On a changed subject, call `queryClient.clear()` and `void persister.removeClient()` before setting the new session. Do not mount `PersistQueryClientProvider` while the initial session is unresolved. When authenticated, set:

```tsx
persistOptions={{ persister, maxAge: CACHE_TTL, buster: session.user.id }}
```

Render `SignIn` without the private provider when signed out.

- [x] **Step 6: Verify cache behavior and clients**

Run:

```bash
pnpm --filter @grip-apps/core test -- authCache
pnpm typecheck
pnpm --filter mobile test --runInBand
```

Expected: transition tests pass, both clients typecheck, and mobile tests remain green.

- [x] **Step 7: Commit**

```bash
git add packages/core/src/authCache.js packages/core/src/__tests__/authCache.test.js packages/core/package.json apps/web/src/App.tsx apps/mobile/src/app/_layout.tsx
git commit -m "fix: isolate query caches by account"
```

### Task 3: Reject AI evidence absent from the submitted section

**Files:**
- Modify: `../grip-ai-api/tests/test_grade.py`
- Modify: `../grip-ai-api/tests/test_ollama.py`
- Modify: `../grip-ai-api/app/service.py`

**Interfaces:**
- Produces: `validate_evidence(suggestion: GradeSuggestion, sections: dict[SectionId, str]) -> None`.
- Raises: `AppError(502, "invalid_model_response", ...)` for a non-verbatim quote.

- [x] **Step 1: Write endpoint tests for fabricated and exact evidence**

Build a provider suggestion whose `requirements` evidence is `"invented quote"` and assert the endpoint returns HTTP 502 with `invalid_model_response`. Change the successful suggestion fixture to accept the submitted sections and quote a literal substring from each one. Update the Ollama lifespan wiring fixture to return grounded evidence, then assert HTTP 200.

- [x] **Step 2: Verify RED**

Run: `.venv/bin/python -m pytest -q tests/test_grade.py`

Expected: the fabricated-evidence test receives HTTP 200.

- [x] **Step 3: Implement request-aware validation**

Add to `service.py`:

```python
def validate_evidence(suggestion: GradeSuggestion, sections: dict) -> None:
    for grade in suggestion.sections:
        evidence = grade.evidence.strip()
        if evidence and evidence not in sections[grade.section]:
            raise AppError(
                502,
                "invalid_model_response",
                "The model quoted evidence that was not in the submitted reasoning.",
            )
```

Call it after `provider.generate(...)` and before `score_from_verdicts(...)`.

- [x] **Step 4: Verify the AI service**

Run:

```bash
.venv/bin/python -m pytest -q -m "not live"
.venv/bin/ruff check .
.venv/bin/ruff format --check .
```

Expected: all offline tests and Ruff checks pass. The live suite need not rerun because the provider prompt and schema are unchanged and the existing live fixtures already assert verbatim evidence.

- [x] **Step 5: Commit in `grip-ai-api`**

```bash
git add app/service.py tests/test_grade.py tests/test_ollama.py
git commit -m "fix: require grounded grading evidence"
```

### Task 4: Read complete answer histories

**Files:**
- Modify: `packages/core/src/api.js`
- Modify: `packages/core/src/__tests__/api.test.js`

**Interfaces:**
- Produces: private `listAllAnswerEvents(columns): Promise<object[]>`.
- Preserves: `getScores`, `getAccuracyTimeline`, and `getReviewQueue` return shapes.

- [x] **Step 1: Extend the Supabase test double**

Record `.order(column, options)` calls and implement inclusive `.range(start, end)` slicing. Allow a configured server cap smaller than the requested range so tests reproduce silent truncation.

- [x] **Step 2: Add multi-page behavior tests**

Create more rows than the fake server cap. Assert `getScores` counts all rows, `getAccuracyTimeline` includes the last row, and `getReviewQueue` uses the final attempt. Assert both `created_at` and `id` ascending order calls are present.

- [x] **Step 3: Verify RED**

Run: `pnpm --filter @grip-apps/core test -- api`

Expected: later rows are missing because each existing method performs one select.

- [x] **Step 4: Implement complete stable pagination**

Use an offset that advances by the number of rows actually returned, not by the requested page size:

```js
async function listAllAnswerEvents(columns) {
  const rows = [];
  let start = 0;
  while (true) {
    const { data, error } = await supabase
      .from("answer_events")
      .select(columns)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(start, start + 999);
    if (error) fail(error);
    if (!data.length) return rows;
    rows.push(...data);
    start += data.length;
  }
}
```

Route the three history consumers through this helper.

- [x] **Step 5: Verify and commit**

Run: `pnpm --filter @grip-apps/core test -- api accuracy review`

```bash
git add packages/core/src/api.js packages/core/src/__tests__/api.test.js
git commit -m "fix: paginate answer history"
```

### Task 5: Make score mutations atomic and retry-safe

**Files:**
- Rename: `supabase/migrations/0005_questions.sql` through `supabase/migrations/0012_board_talk_track.sql`
- Create: `supabase/migrations/0014_atomic_scores.sql`
- Modify: `packages/core/src/api.js`
- Modify: `packages/core/src/__tests__/api.test.js`
- Modify: `apps/web/src/interviewPrep/useScores.ts`
- Modify: `apps/mobile/src/lib/useScores.ts`
- Modify: `README.md`

**Interfaces:**
- Produces SQL RPCs `record_answer(p_request_id text, p_tech text, p_correct boolean, p_source text, p_difficulty text)` and `reset_scores()`.
- Changes `recordAnswer` to accept `requestId` as its fifth argument.

- [x] **Step 1: Give every migration a unique version**

Rename the questions migration to `0006_questions.sql`, then increment each existing `0006` through `0012` filename by one, ending with `0013_board_talk_track.sql`. Preserve file contents. Add a README note that linked databases must reconcile the renamed local history before running `supabase db push`.

- [x] **Step 2: Write failing shared-API tests**

Assert `recordAnswer("Kubernetes", true, "drill", "high", "attempt-1")` makes exactly one `record_answer` RPC containing that request ID and no direct insert or `add_xp` RPC. Assert `resetScores()` makes exactly one `reset_scores` RPC and no delete/upsert sequence.

- [x] **Step 3: Verify RED**

Run: `pnpm --filter @grip-apps/core test -- api`

Expected: existing code records separate database calls.

- [x] **Step 4: Add transactional SQL**

Create `0014_atomic_scores.sql` with a nullable `request_id text`, a unique index on `(user_id, request_id)`, and backfill-safe behavior for existing rows. `record_answer` must reject a null `auth.uid()`, insert with `on conflict (user_id, request_id) where request_id is not null do nothing`, and update XP only when the insert affected a row. `reset_scores` must delete and reset XP inside one PL/pgSQL function. Revoke execution from `public` and grant it to `authenticated`.

- [x] **Step 5: Replace client database sequences**

Implement:

```js
async function recordAnswer(tech, correct, source = "card", difficulty = null, requestId) {
  const { error } = await supabase.rpc("record_answer", {
    p_request_id: requestId,
    p_tech: tech,
    p_correct: correct,
    p_source: source,
    p_difficulty: difficulty,
  });
  if (error) fail(error);
}
```

Replace reset with `supabase.rpc("reset_scores")`.

- [x] **Step 6: Generate one ID per mutation attempt**

Add `requestId` to each score hook's mutation variables. The public `record(...)` wrapper creates it before `mutate` using:

```ts
const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
recordMutation.mutate({ requestId, tech, isCorrect, source, difficulty });
```

Because React Query retries reuse the mutation variables, every transport retry reuses the ID. The ID is an idempotency token, not a credential.

- [x] **Step 7: Verify and commit**

Run:

```bash
pnpm --filter @grip-apps/core test -- api
pnpm typecheck
```

```bash
git add supabase/migrations packages/core/src/api.js packages/core/src/__tests__/api.test.js apps/web/src/interviewPrep/useScores.ts apps/mobile/src/lib/useScores.ts README.md
git commit -m "fix: make score writes transactional"
```

### Task 6: Separate practice completion from assessed reasoning

**Files:**
- Create: `supabase/migrations/0015_board_talk_grade.sql`
- Modify: `packages/core/src/talkTrack.js`
- Modify: `packages/core/src/boardScore.js`
- Modify: `packages/core/src/readiness.js`
- Modify: `packages/core/src/api.js`
- Modify: `packages/core/src/__tests__/talkTrack.test.js`
- Modify: `packages/core/src/__tests__/boardScore.test.js`
- Modify: `packages/core/src/__tests__/readiness.test.js`
- Modify: `packages/core/src/__tests__/api.test.js`
- Modify: `apps/web/src/quest/Quest.tsx`
- Modify: `apps/web/src/quest/types.ts`
- Modify: `apps/web/src/archBoard/ArchBoard.tsx`
- Modify: `apps/web/src/archBoard/types.ts`
- Modify: `apps/mobile/src/app/(tabs)/board.tsx`
- Modify: `packages/core/src/locales/en.js`
- Modify: `packages/core/src/locales/pt.js`
- Modify: `packages/core/src/locales/sv.js`
- Modify: `README.md`

**Interfaces:**
- `scoreTalkTrack(raw)` returns `completion` and no quality `score`.
- `scoreBoard({ topology, talkTrack, talkGrade })` returns nullable `talk` and `overall`.
- Saved boards gain `talkGrade: number | null`.

- [x] **Step 1: Rewrite scoring expectations first**

Assert arbitrary full-length sections produce `completion: 100` but no quality score. Assert self-rating never changes completion. Assert an ungraded board returns `{ topology: 100, talk: null, overall: null }`; a board with `talkGrade: 60` returns overall 80. Assert ungraded boards do not contribute `arch` readiness, while topology remains visible.

- [x] **Step 2: Verify RED**

Run: `pnpm --filter @grip-apps/core test -- talkTrack boardScore readiness`

Expected: current self-rating/completion score and 50/50 board averaging violate the new expectations.

- [x] **Step 3: Implement honest scoring**

Remove the derived `score` from `scoreTalkTrack`. In `scoreBoard`, normalize `talkGrade` only when it is a finite 0–100 value; return null `talk` and `overall` otherwise. In readiness, average only graded board overall values for `arch`, while continuing to report average topology and nullable assessed talk score separately.

- [x] **Step 4: Persist an optional grade**

Add `talk_grade int null check (talk_grade between 0 and 100)` to `arch_boards` in migration `0015`. Map it as `talkGrade` in `api.js` reads and writes, defaulting legacy boards to null. Add `talkGrade` to the web and mobile board state/types, load it with a saved board, clear it when reasoning changes, and pass it back on save. This preserves an unchanged loaded grade while preventing a stale grade from surviving edited reasoning.

- [x] **Step 5: Update readiness mapping and copy**

Pass `talkGrade` from saved boards through `Quest.tsx`. Replace copy that calls character-count completion “reasoning score” with wording for diagram score, reasoning completion, and assessed reasoning. Update all three locale files and the README's claim that any written reasoning can complete a round.

- [x] **Step 6: Verify and commit**

Run:

```bash
pnpm --filter @grip-apps/core test -- talkTrack boardScore readiness api
pnpm typecheck
pnpm build
```

```bash
git add supabase/migrations/0015_board_talk_grade.sql packages/core/src/talkTrack.js packages/core/src/boardScore.js packages/core/src/readiness.js packages/core/src/api.js packages/core/src/__tests__/talkTrack.test.js packages/core/src/__tests__/boardScore.test.js packages/core/src/__tests__/readiness.test.js packages/core/src/__tests__/api.test.js apps/web/src/quest apps/web/src/archBoard apps/mobile/src/app/\(tabs\)/board.tsx packages/core/src/locales README.md
git commit -m "fix: separate reasoning progress from quality"
```

### Task 7: Reconcile setup documentation and run the full gate

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-09-07-evaluation-findings.md`

**Interfaces:**
- Documents separate web and mobile Supabase environment files.
- Records verification results without claiming unavailable live checks.

- [x] **Step 1: Add exact client setup**

Document:

```env
# apps/web/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Include the migration-history warning from Task 5 and commands for a fresh local Supabase reset without running them against a linked remote.

- [x] **Step 2: Run the full frontend/core gate**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm lint
git diff --check
```

Expected: core and all mobile tests pass, typechecks/build/lint pass, and no whitespace errors remain.

- [x] **Step 3: Run the AI gate**

From `../grip-ai-api`, run:

```bash
.venv/bin/python -m pytest -q -m "not live"
.venv/bin/ruff check .
.venv/bin/ruff format --check .
git diff --check
```

Expected: offline tests and formatting checks pass.

- [x] **Step 4: Verify migration structure**

Assert every file in `supabase/migrations` has a unique numeric prefix. If Docker and the Supabase CLI are already available, run `supabase db reset` only against a fresh local instance. Otherwise record that database execution was unavailable.

- [x] **Step 5: Record results and commit documentation**

Update this plan's completed checkboxes and append exact verification counts. Then:

```bash
git add README.md docs/superpowers/plans/2026-09-07-evaluation-findings.md
git commit -m "docs: reconcile Grip setup and verification"
```

- [x] **Step 6: Review repository state before push**

Run `git status --short`, `git log --oneline -8`, and compare `HEAD` with `origin/main` in both changed repositories. Push only the tested commits requested by the user.

## Execution Results

Implemented on 2026-09-07 in these commits:

- `aeeff4f` — restore mobile test runtime
- `23decb0` — isolate query caches by account
- `39a67f9` in `grip-ai-api` — require grounded grading evidence
- `5a99ca8` — paginate answer history
- `285445c` — make score writes transactional
- `5fbdd2b` — separate reasoning assessment from completion

Fresh final verification:

- Core Jest: 28 suites, 255 tests passed with `--no-watchman`.
- Mobile Jest: 4 suites, 7 tests passed with `--no-watchman`.
- TypeScript: mobile and web passed.
- ESLint: passed with 0 errors and 3 existing Fast Refresh warnings in `apps/web/src/components/shared.tsx`.
- Web production build: passed; Vite retained its existing large-chunk warning.
- AI service: 53 offline tests passed, 7 live tests deselected; Ruff check and format check passed. Pytest retained one dependency deprecation warning from FastAPI's test client.
- Migrations: 15 SQL files with unique versions `0001` through `0015`; macOS AppleDouble files were removed before the audit.
- SQL runtime: not executed because the installed Docker daemon was not running, so no fresh local Supabase instance was available. No linked or live database was changed.
- Whitespace: `git diff --check` passed.
