# Product UX Repairs Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Steps use checkboxes for tracking. Do not commit unless the user asks.

**Goal:** Fix the seven product-review findings so candidates can trust saved work, understand progress, complete a design round, and resume useful practice.

**Architecture:** Keep the existing React/Expo, TanStack Query and shared-core boundaries. Repair local mutation lifecycles, clarify existing metrics, and keep board assessment state tied to the document it describes. Use an additive Supabase migration only for persisted grading feedback.

**Tech stack:** TypeScript/JavaScript, React, Expo, TanStack Query, Supabase, Jest, node:test and existing React Native Testing Library.

**Spec:** The seven findings in the November 7, 2026 evaluate-product review, captured as requirements and acceptance criteria below. These are proposed implementation decisions, not implemented or user-approved behavior.

## Scope and constraints

- Work only in `grip-apps`, including its shared core and Supabase migration. No AI API or pipeline-service changes are expected.
- Follow `BRAND.md`, `DESIGN.md` and `SCREEN-GUIDELINES.md`; add English, Portuguese and Swedish copy together.
- No new production dependencies, general form framework, navigation rewrite, durable offline write queue or onboarding wizard.
- Preserve existing accounts, scores, boards, anonymous-demo upgrades, share links, and web/mobile document compatibility.
- Reproduce each finding against the implementation revision before changing it. The review used source and older repository screenshots; live behavior and phone rendering were not verified.
- Keep each task independently reviewable. Add dated `CHANGELOG.md` entries for actual changes, preserving history.
- Tests should exercise failure and recovery behavior, not implementation details. Use current test tools; browser checks can cover web interaction where its node:test setup cannot render components.

## Proposed approach and tradeoffs

Prefer targeted repairs over a shared workflow rewrite. Existing forms and query hooks already provide the necessary boundaries; a framework would increase scope without improving the candidate's outcome.

For readiness, remove the composite headline from user-facing surfaces and show separately labeled evidence. Reweighting the current formula would still combine story count with assessed performance. A new readiness model would require validation beyond this repair.

For grading feedback, store an optional assessment with the saved document. Do not regrade on reload: that spends quota and can produce a different explanation for the same saved score.

## Delivery order

| Phase | Tasks | Exit condition |
| --- | --- | --- |
| Now: protect trust | 1 to 3 | Failed saves preserve drafts; displayed metrics mean what they say; progress-write failures are visible |
| Next: complete and resume | 4 to 6 | Explanation edits preserve topology results; phone tasks are usable; saved assessments retain their diagnosis |
| Then: clarify entry | 7 | Sign-in promise matches first destination; an empty board offers a usable first action |

Task 6 builds on Task 4's invalidation rules. Tasks 5 and 7 share Arch Board surfaces and should follow those state changes. Other tasks do not require each other's interfaces.

## Review focus

1. A rejected or slow save must not destroy a draft or create duplicate submissions (Task 1).
2. No practice, partial evidence and failed queries must never look like assessed readiness (Task 2).
3. Overlapping answer writes and ambiguous network failures must not double-award XP (Task 3).
4. A late grading response must not attach to edited text or another board (Tasks 4 and 6).
5. Legacy boards, free boards and narrow translated layouts must remain usable (Tasks 5 to 7).

## Task 1: Preserve drafts through failed saves

**Finding:** 1, high. Include the related unsaved-navigation path so leaving a form cannot silently erase writing.

**Files:**
- Web: `apps/web/src/storyBank/{StoryBank,StoryForm}.tsx`, `apps/web/src/quest/{Quest,ContactForm,RetroForm}.tsx`.
- Mobile: `apps/mobile/src/app/(tabs)/{stories,quest}.tsx`, their form components and `apps/mobile/src/queries/{stories,contacts}.ts` as needed.
- Existing navigation guard pattern: `apps/web/src/archBoard/useBoardShortcuts.ts` and `apps/web/src/lib/usePageRoute.ts`.
- Tests: mobile screen tests under `apps/mobile/src/components/__tests__/`; web browser failure scenarios below.

**Contract:** Save keeps the editor mounted while pending or failed. Only `onSuccess` closes it. Form props expose `saving: boolean` and `error: string | null`; prevent duplicate submission while saving. Keep user input intact on rejection. Do not disable fields without defining how edits made during saving are retained; simplest behavior is to freeze the submitted form until the request settles.

- [ ] Reproduce rejected create/edit saves for stories, contacts and retros; verify equivalent mobile paths before extending changes there.
- [ ] Add focused mobile regression tests: rejected save retains all values and error; pending save ignores another Save; success closes once. Establish the equivalent web browser scenarios before implementation.
- [ ] Move focus/editor transitions to success callbacks; show localized pending/error state beside Save and retry the retained form.
- [ ] Guard dirty Back, Cancel, tab navigation and web reload; cancelling discard preserves the draft. Use native navigation conventions on mobile. Do not persist private drafts to browser storage for this task.
- [ ] Validate create/edit/retry, user cancellation, duplicate clicks and successful save on both clients. Verify no duplicate records and no phantom success message.

## Task 2: Replace composite readiness with explicit evidence

**Finding:** 2, high.

**Files:** `packages/core/src/readiness.js`, `packages/core/src/__tests__/readiness.test.js`, `apps/web/src/quest/PrepPlanSection.tsx`, `apps/mobile/src/components/contacts/PrepPlanSection.tsx`, `apps/mobile/src/components/ReadinessCard.tsx`, and all connected `computeReadiness` callers found with `rg`.

**Contract:** Show role-tech answer accuracy, story competencies covered (`n of 8`), and assessed design performance as distinct signals. Missing assessments say “Not assessed”; no posting stack says “Add role technologies.” Unknown/loading/error is distinct from zero. Story existence never becomes a quality percentage. Preserve unattempted role technologies as zero in the scoped accuracy calculation.

- [ ] Inventory every readiness label and consumer before changing the shared return shape.
- [ ] Add core regression cases: eight story competencies and no other evidence cannot produce a visible 100% readiness claim; no attempts; mixed attempted/unattempted role techs; ungraded board; graded board; invalid/duplicate competencies.
- [ ] Add `storyCovered` and `storyTotal` to shared output; migrate clients to the separate signals. Remove `overall` and its consumers together once unused; do not keep a misleading compatibility field indefinitely.
- [ ] Replace the composite headline with a next-action heading or scoped metric using existing layout patterns. Explain each metric where shown; do not imply interview pass probability.
- [ ] Verify failed/loading supporting queries do not feed empty defaults into a confident metric display.
- [ ] Validate identical interpretation on both clients; ask a fresh reviewer to explain each number and what remains unassessed without coaching.

## Task 3: Make failed progress writes visible and recoverable

**Finding:** 3, high.

**Files:** `apps/web/src/interviewPrep/{useScores,InterviewPrep,Card,MockLoop,DrillSession}.tsx` (the hook is `.ts`), `apps/mobile/src/lib/useScores.ts`, connected quiz/drill/mock components, `packages/core/src/api/scores.ts`, existing score API tests.

**Contract:** Keep immediate local answer feedback. Both hooks expose a small save status contract: pending count, failed count and retry action. Every failed answer retains its original request ID and payload for a session-only retry. Retry must not reapply optimistic XP. Clear pending retry data on account change/sign-out; it must not leak into another account.

- [ ] Confirm the answer RPC's request-ID deduplication and test it before exposing Retry. Inspect bonus `addXp` separately: it has no request ID in the current client signature.
- [ ] Test failed answer write → visible unsaved status → retry with the same ID → exactly one persisted answer/XP award; test two overlapping writes where one fails.
- [ ] Expose localized “Progress not saved” status beside the active task and its result, with an accessible announcement and Retry for idempotent answer writes. Keep the status visible after exiting the task.
- [ ] Treat score-load failure as unavailable rather than a ready empty score. Reconcile optimistic data after writes settle without erasing newer successful progress.
- [ ] Surface failed bonus writes explicitly. Do not automatically retry a non-idempotent bonus RPC after an ambiguous failure. If safe bonus retry is required, extend its RPC with request-ID deduplication in an additive migration and test that contract first.
- [ ] State the session-only recovery limit in the UI before navigation/reload loses failed writes; warn on leaving with outstanding writes. This task does not promise durable offline synchronization.
- [ ] Validate reconnect, retry, result screen, account switch and a successful refresh. A network timeout after server commit must not duplicate an answer award.

## Task 4: Keep design and explanation assessments independent

**Finding:** 4, medium.

**Files:** `apps/web/src/archBoard/{ArchBoard.tsx,useBoardDocument.ts}`, `packages/core/src/{boardHistory,gradeState,workflowState}.js`, their existing tests; inspect `apps/mobile/src/app/(tabs)/board.tsx` for equivalent invalidation behavior.

**Contract:** Explanation/self-rating/story-link changes preserve deterministic topology evaluation. Grading inputs changing invalidate the reasoning assessment. Scenario or evaluated topology changes invalidate both. Undo/redo obey the same dependency rules. A grading response applies only if the current board and grading inputs match its submitted snapshot.

- [ ] Add regressions for Evaluate → edit explanation, edit story link, edit node/edge, undo and redo; assert the correct assessment survives or clears.
- [ ] Replace unconditional `onApply` score clearing with comparison of evaluation-relevant document inputs. Keep connection cancellation separate from score invalidation.
- [ ] Guard async grading by submitted board ID and input snapshot; ignore late responses after text/brief/design edits, board switch or undo to different inputs.
- [ ] Validate the visible workflow no longer regresses when writing the explanation and never shows a stale grade against changed content.

## Task 5: Put scenario context before the canvas on phones

**Finding:** 5, medium; first reproduce visually.

**Files:** `apps/web/src/archBoard/{ArchBoard.tsx,ArchBoard.module.css,ScenarioPanel.tsx,TalkTrack.tsx}`, `apps/web/src/components/{WorkspaceLayout.tsx,WorkspaceLayout.module.css}` only if a narrowly scoped layout option is necessary.

**Contract:** On narrow screens the order is compact scenario/brief → next action → editor → feedback/explanation. Desktop keeps its useful rail layout. Scenario controls have one accessible instance per layout; no duplicate IDs, hidden focusable controls or repeated brief. Talk fields fit their container and explanation opens with focus on the requested field.

- [ ] Capture current 375px, 740×375, 1024px, 1280px and 1680px states with real or fixture content; include a long translated brief and open talk track.
- [ ] Apply an Arch Board-specific responsive arrangement rather than globally reordering every workspace.
- [ ] Replace the fixed 300px field minimum with a container-safe grid; check the rest of StoryForm/ContactForm only for regressions from any shared layout edit.
- [ ] Verify no page-level horizontal overflow, covered actions or unreachable footer; deliberate canvas pan remains available.
- [ ] Verify keyboard focus, touch, screen-reader order, browser zoom, software keyboard and reduced motion. Record screenshot evidence and any unavailable native checks honestly.

## Task 6: Persist assessment diagnosis with its document

**Finding:** 6, medium. Depends on Task 4.

**Files:** `packages/core/src/api.ts`, `packages/core/src/api/boards.ts`, `packages/core/src/database.types.ts`, `packages/core/src/gradeState.js`, `apps/web/src/archBoard/{types.ts,useBoardDocument.ts,ArchBoard.tsx}`, mobile board types/state/queries and talk-track renderer; next available numbered migration under `supabase/migrations/`.

**Contract:** Add optional nullable `talk_assessment` JSONB, mapped to `talkAssessment`, containing a versioned assessment result and the grading-input snapshot it belongs to. Reuse the current grading response shape in shared types. Keep `talkGrade` compatible with older clients. Score and feedback are saved from the same document revision; legacy score-only boards remain readable and say detailed feedback is unavailable.

- [ ] Add API round-trip tests for assessment, legacy null and malformed/unsupported payloads; add stale-input and save/reload regression cases.
- [ ] Add the nullable column without modifying existing migration files. Regenerate database types using the repository's configured tooling. Do not put private feedback into public shared-board responses by default.
- [ ] Store/load assessment with the document; include it in dirty/save state. Render persisted detail only when its input snapshot matches. Use Task 4's stale-response guard and invalidation rules.
- [ ] Update mobile loading and saving to preserve the field, even where its presentation differs. Verify web → mobile edit/save → web does not silently retain stale feedback or strip valid feedback.
- [ ] Validate grade → save → reload retains section gaps, evidence, follow-up and next improvement without another model call. Test legacy records and public share responses.
- [ ] Apply migration before deploying new clients; if rollout must be reversed, revert clients and leave the additive column/data intact. No destructive rollback or live model test is needed for automated verification; use a fixture response.

## Task 7: Align arrival and the first board action

**Finding:** 7, medium; comprehension hypothesis, not a measured conversion defect.

**Files:** `packages/core/src/locales/{en,pt,sv}.js`, `apps/web/src/archBoard/{primaryAction.js,primaryAction.test.js,ArchBoard.tsx}`, existing canvas Components control; inspect mobile first-use copy and board entry for parity.

**Decision:** Keep Prep as the default destination. Broaden the sign-in promise to the actual product: “Prepare for technical interviews and track your applications.” This avoids changing authentication/deep-link behavior to solve a copy mismatch.

- [ ] Update localized arrival copy consistently; retain the specific assessed-reasoning benefit where Arch Board is introduced.
- [ ] Extend primary-action tests: latest saved board → Continue; empty scored board → Add component; diagram with nodes → existing evaluation/explanation path. Free boards retain their unscored behavior.
- [ ] Wire Add component to the existing Components picker and focus it; do not add another palette or a dead-end instruction.
- [ ] Preserve OAuth linking, returning-user routes, share links and saved-board continuation. Validate those paths with the current navigation tests and browser checks.
- [ ] Run a short comprehension check: can a new user explain the product, start relevant practice, and add a first board component without hints? Record observed confusion; do not claim conversion uplift.

## Verification and completion

- [ ] During each task, run the relevant focused tests with `rtk` prefixes. Core: `rtk pnpm --filter @grip/core test --runInBand --watchman=false`; web: `rtk pnpm --filter web test`; mobile: `rtk pnpm --filter mobile test --runInBand --watchman=false`.
- [ ] After integrated changes, run `rtk pnpm run ci` and `rtk git diff --check`. Record unrelated/environment failures separately.
- [ ] Use safe fixtures and a test account for rejected/slow writes, retry, reload, back navigation and cross-client saving. Never alter real candidate data for the checks.
- [ ] Use mocked grading for regression checks. Live AI tests remain opt-in and are not part of this plan's default execution.
- [ ] Update `CHANGELOG.md`, including Database when Task 6 or optional bonus deduplication adds a migration.
- [ ] Report files changed, checks run, skipped checks, migration order and remaining device/manual checks. Passing CI does not establish browser or native acceptance.

**Done:** All seven findings have their stated acceptance evidence; any unreproduced finding is documented with the actual observation rather than changed speculatively. No implementation, deployment or commit is authorized by this planning document alone.


### Breaking-change review follow-up, 2026-11-07

- Score retry queues now carry a unique scope that expires when auth clears the
  account cache. Answers, bonuses, optimistic updates, late callbacks and stale
  retry closures check that scope. A versioned cache key prevents replay of older
  persisted unscoped queues. This was applied to the concurrently completed shared
  `scoreStore.ts` refactor, preserving both client wrappers.
- Persisted assessments validate all six unique sections, verdict/evidence/gap
  fields, score/divergence bounds and board identity. Web and mobile supply the
  active board ID when reading feedback. Invalid payloads become unavailable.
- Regression tests exercised the actual malformed payloads and account-clear
  races. Queue guards were temporarily disabled to confirm both account tests
  fail, then restored and verified green.
- Migration 0026 still must precede client deployment. No database migration,
  native build, live inference, deployment or commit was performed here.

- Follow-up verification: 445 core, 23 mobile and 37 web tests passed; lint,
  typecheck, web build and diff checks passed. Default `pnpm run ci` stopped on
  Watchman socket permissions; its test stages were rerun with
  `--runInBand --watchman=false --no-cache`. Existing bundle-size warnings remain.
- Independent read-only review found no remaining material bugs in these three
  fixes and reran the ledger, assessment and account-switch regressions.
