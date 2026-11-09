# Profile Preparation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development if the user chooses delegation. Steps use checkbox (`- [ ]`) syntax for tracking. Do not commit unless asked.

**Goal:** Replace overlapping Profile setup areas with Account, Your preparation, and Preferences, preserving GitHub sync and preferred technologies while making playbook freshness explicit.

**Architecture:** Extend the existing History API navigation rather than adding a router. Keep existing profile fields as the source of truth for role, stack, favourites, and CV detections; add a small user-owned preparation record for focus, accepted GitHub signals, sync time, and active playbook metadata. Reuse the existing generation endpoint, with atomic publication of replacement artifacts so failures preserve the active playbook.

**Tech Stack:** React 19, TypeScript/JavaScript, TanStack Query, Supabase/Postgres, existing CSS Modules and design tokens; node:test and Jest.

**Spec:** The design contract below records the agreed mockup and review corrections. Visual reference: `../.superpowers/brainstorm/34683-1794222732/content/profile-concept-v3.html` relative to the repository root (outside this git repository). The contract takes precedence over prototype shortcuts.

## Global Constraints

- Web UI only. Changes stay in `grip-apps/`, including shared types/API and Supabase migrations; no mobile screen changes or AI service changes.
- Read `BRAND.md`, `SCREEN-GUIDELINES.md`, `DESIGN.md`, and relevant README before implementation. Use existing tokens, accessible controls, and English/Portuguese/Swedish translations.
- No new production dependencies, real model calls during tests, automatic destructive resets, or commits without authorization.
- Preserve existing account fields, settings, sign-out, score reset, goal reset confirmation, and existing generated content.
- Keep one primary action at the top; do not require CV or GitHub for a usable preparation.
- Scope passing checks accurately. Deployment, applying production migrations, and live model acceptance are separate from local verification.

## Design Contract

### Navigation and layout

- Menu links: `/profile/account`, `/profile/preparation`, `/profile/preferences`.
- `/profile` redirects with replaceState to `/profile/preparation`; `/profile/preparation/edit` is the editor. Active menu remains Your preparation on nested routes.
- `/profile/preparation/playbook` displays the active playbook summary and links to its existing Prep, Stories, and Arch Board outputs. It is not a new practice engine.
- Legacy `/profile/cv` and `/profile/connections` redirect to preparation; unknown Profile subpaths show a recoverable not-found state.
- Keep account details and preferences in their respective sections. Remove Profile's completion percentage and CV/GitHub completion prompts. Retain XP/rank without implying setup completion is skill readiness.
- Preparation overview order: playbook action/status; compact role/focus/stack summary with Edit; preferred technologies; compact experience-source rows. No duplicate onboarding panel or explanatory product footers.

### Data meanings and editing

- `targetRole`: target role; remains optional, as it is in existing onboarding. Do not copy the prototype's required-role restriction.
- `goalTechs`: explicitly chosen preparation stack, including accepted suggestions. Preserve unsupported custom technologies with honest availability messaging.
- `favoriteTechs`: preferred practice technologies. Never overwrite them from imports, sync, onboarding, or playbook generation. Preserve existing favourites even if outside `goalTechs`; allow catalogue-wide choice rather than silently dropping them.
- `cvTechs`: accepted CV detections. Upload parses on-device; only reviewed technology identifiers are saved. Raw CV text remains ephemeral and requires the existing editable/redacted preview before any generation request.
- GitHub connection, fetching repository signals, and permission to use them are separate states. Existing authentication connection is not the sync itself. Do not add account unlinking in this task: the prototype's Disconnect was only a sample control.
- Sync shows connection, last successful fetch time, Sync now, local loading/error/retry, and a review list. Successful fetch is not acceptance. Dismiss changes no stack or favourites. Accept unions selected technologies into `goalTechs` and records accepted GitHub identifiers; never changes favourites.
- Sync is manual from Profile. Prep consumes accepted GitHub signals rather than auto-including newly fetched languages. Turning GitHub usage off excludes its source category but retains explicitly accepted stack choices and favourites. Explain that removal from practice is a separate stack edit.
- Keep accepted CV detections removable and clearable. Manual technology addition, import review, and preferred selection are available without GitHub.
- Editor uses a detached draft for all editable fields and accepted imports. Save performs one transactional preparation save; failure keeps draft and errors beside Save. Cancel discards it. Navigation away from a dirty draft uses the existing `grip:navigate` guard to offer Stay/Discard.
- Save preserves the old playbook and returns to the overview with confirmation. Inline preferred-technology selection is a small explicit save; disable repeated toggles while pending and restore the prior value on failure.
- Persist saved preparation on the server across refresh/device sessions. Do not persist raw CV, job text, or experience notes to browser storage. Unsaved editor drafts may be lost on reload; use beforeunload warning and state this only when relevant.

### Playbook lifecycle

- States: no playbook, current, preparation changed, generating, failed/interrupted, and legacy playbook with unknown freshness.
- Main action: Set up preparation/Create playbook when empty; Open playbook when current; Update playbook when changed; Retry update when failed. Previous playbook remains openable throughout a replacement attempt.
- A canonical versioned snapshot includes role, focus (`technical | stories | design | explore`), selected stack, preferred technologies, and locale. Sort/deduplicate sets; ordering alone does not make a playbook stale. Compare saved effective inputs to the active snapshot, not `updated_at` or source connection status.
- Persist optional technical brief with preparation. Reuse existing role/JD and experience steps during first run; private JD/CV/notes are request-only context, not silently persisted. A later replacement must say it uses saved preparation and offer optional fresh context through existing preview controls.
- Existing playbooks without a snapshot remain available with “Created before preparation tracking”; never claim current or regenerate automatically. Existing stories/scenarios are retained.
- Existing AI schema has no separate favourites field: send the selected stack with preferred technologies ordered first, then remaining stack (deduplicated, existing 30-item cap). Include catalogue-supported favourites outside stack in the request. Unsupported selections remain visible with no invented drills.
- Reuse `generateWithTimeout` (200 seconds), existing API limits, retry-after handling, and failure messages. No fallback action during normal generation; Retry is primary after failure.
- Own generation above the Profile subroute so navigating within Profile does not interrupt it. Leaving Profile/unmount/sign-out aborts the client operation and ignores late responses; do not promise background server jobs. After refresh, show an interrupted attempt with Retry and the previous playbook.
- Publish artifacts and active snapshot only together after generation succeeds. A failed replacement never deletes or overwrites previously generated or edited content. No automatic cleanup of old versions in this scope.

## Review Focus

1. Nested Profile links, OAuth callbacks, and browser Back must preserve the full destination and existing unsaved-task guards (Task 1).
2. Dismissed imports and failed saves must not mutate the chosen stack or favourite technologies (Tasks 2–4).
3. Reload, account switching, and late async responses must not expose another user's preparation or publish an abandoned update (Tasks 2 and 5).
4. Existing playbooks without metadata and unsupported technologies must remain usable without a false “current” claim (Tasks 2, 3, 5).
5. Duplicate clicks, request retries, or publication failure must not duplicate artifacts or replace the old active playbook (Tasks 2 and 5).

## Task 1: URL-backed Profile navigation

**Files:** Modify `apps/web/src/lib/usePageRoute.ts`, `lib/navigation.js`, `lib/navigation.test.js`, `App.tsx`, `profile/sections.ts`, `profile/Profile.tsx`, and `profile/ProfileRails.tsx`; create `apps/web/src/profile/routes.js` and `routes.test.js`.

**Interfaces:** `parseProfilePath(pathname)` returns `account | preparation | edit | playbook | preferences | notFound`; `profilePath(section)` returns its canonical URL. Extend `usePageRoute()` with `pathname` and `navigatePath(path: string, options?: { replace?: boolean }): void`; keep `selectPage(id)` for existing callers.

- [ ] Add route tests for canonical paths, bare Profile, legacy aliases, unknown paths, refresh initialization, Back/Forward, and retaining the full current pathname when navigation is vetoed.
- [ ] Run `rtk pnpm --filter web test` and confirm the new assertions fail before implementation.
- [ ] Make the first path segment select the top-level page. Use the shared guarded navigation for both menu anchors and existing tab buttons; ordinary modified clicks/open-in-new-tab must retain native anchor behavior.
- [ ] Preserve Supabase auth code/hash processing. GitHub linking returns to `/profile/preparation?linked=github`; adjust `useLinkGitHubMutation` in `profile/queries.ts` and App callback handling without breaking fresh-sign-in defaults or public share links.
- [ ] Move Profile section state into the URL and implement aliases with replacement, focus on route headings, accessible current-link state, and a recoverable unknown route.
- [ ] Run web tests; manually verify direct nested links after reload and signed-out/authenticated transitions. No router dependency.

## Task 2: Persist preparation and publish playbooks safely

**Files:** Create `supabase/migrations/0030_profile_preparation.sql` (recheck latest number before creating), `packages/core/src/api/preparation.ts`, `packages/core/src/__tests__/preparation.test.js`, and `scripts/check-profile-preparation.sql`; modify `packages/core/src/api.ts`, `api/profile.ts`, API factory wiring, `database.types.ts`, and reset-goals behavior.

**Interfaces:**
- `PreparationGoal = 'technical' | 'stories' | 'design' | 'explore'`.
- `PreparationSnapshot = { version: 1; role: string; goal: PreparationGoal; brief: string; techs: string[]; favoriteTechs: string[]; locale: string }`.
- `PreparationRecord = { goal: PreparationGoal; brief: string; githubTechs: string[]; githubSyncedAt: string | null; activePlaybook: null | { generationId: string; snapshot: PreparationSnapshot; label: string; scenarioId: string; boardId: string | null; storyIds: string[]; createdAt: string } }`.
- `getPreparation(): Promise<PreparationRecord | null>`; `savePreparation({ profilePatch, goal, brief }): Promise<{ profile: User; preparation: PreparationRecord }>`; `saveGithubSignals({ acceptedTechs, syncedAt }): Promise<void>`; `publishPreparationPlaybook({ generationId, expectedGenerationId, snapshot, playbook }): Promise<PreparationRecord>`.

- [ ] Add API tests for null/default records, mapped fields, save failure, immutable favourites on sync, and user-scoped responses. Run `rtk pnpm --filter @grip/core test -- --runInBand --watchman=false` and establish failing assertions.
- [ ] Add `user_preparation`, one row per `auth.uid()`, with focus, brief, accepted GitHub technologies, successful-sync timestamp, and active-playbook JSON metadata. Use a user FK with cascade and own-row RLS for select/insert/update/delete. Do not store raw CV/JD/notes or generation prompts.
- [ ] Implement transactional `save_preparation` RPC that writes the existing profile columns and preparation record together. Accepted GitHub review updates accepted signals and `goal_techs` atomically while preserving `favorite_techs`; a separate successful-fetch timestamp update must not mark suggestions accepted.
- [ ] Implement transactional `publish_preparation_playbook` RPC using current scenario/board/story column mappings. Create new artifacts, then update active manifest in the same transaction; validate input shapes/caps and derive user from auth. No dynamic SQL or client-supplied owner IDs.
- [ ] Use `generationId` as the publication idempotency key. Retrying the same published generation returns its manifest. Lock the preparation row and compare `expectedGenerationId` to the active version before publishing; reject a conflicting concurrent replacement and retain all prior artifacts. Profile edits during generation remain valid; publication uses its captured snapshot and can immediately show stale.
- [ ] Extend `reset_goals` to remove preparation metadata alongside its existing effects. Ensure score reset leaves preparation intact. Regenerate database types from the migration; do not handwave RPC typing.
- [ ] Add transactional SQL assertions for two-user RLS isolation, rollback after an artifact insert failure, repeated publication, concurrent-version conflict, and reset. Run against a disposable local Supabase database with `rtk psql "$PROFILE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/check-profile-preparation.sql`; keep fixtures within a rollback transaction. If unavailable, report it as a required release check, not a pass.
- [ ] Run core tests/typecheck. Existing mobile callers must still compile with the additive API and schema.

## Task 3: Preparation overview, editor, and preferred technologies

**Files:** Create `apps/web/src/profile/PreparationSection.tsx`, `PreparationEditor.tsx`, `preparationState.js`, `preparationState.test.js`, and `Preparation.module.css`; modify `profile/Profile.tsx`, `ProfileSections.tsx`, `ProfileRails.tsx`, `queries.ts`, `types.ts`, and `sections.ts`.

**Interfaces:** `createPreparationDraft(profile, preparation)` creates independent arrays; `preparationPatch(draft)` builds Task 2 save input; `snapshotFor(profile, preparation, locale): PreparationSnapshot`; `playbookStatus(active, snapshot, operation)` returns the lifecycle state. Add `usePreparationQuery()` and `useSavePreparationMutation()` with user-scoped keys and profile-cache updates.

- [ ] Add pure-state tests for detached drafts, Cancel, failed Save, focus restoration, canonical snapshots, absent legacy snapshots, empty stacks, custom technologies, and favourites outside stack. Establish failures with `rtk pnpm --filter web test`.
- [ ] Build the three-menu layout and preparation overview from the contract. Preserve existing Account details and Preferences controls; eliminate duplicate target-role editing and setup prompts on Account.
- [ ] Build the editor with role, goal, optional brief, manual stack additions/removals, catalogue favourites, and optional import review. Use shared first-run helpers/limits; do not add production sessionStorage state from the mockup.
- [ ] Save through the transactional mutation; Cancel and dirty-navigation discard touch no persisted values. Save errors stay with the draft. Server query refresh must not overwrite an open draft.
- [ ] Add directly selectable preferred technologies to the overview using existing `favoriteTechs` persistence. Do not constrain existing favourites to imported techs; display custom/no-drill availability honestly. On mutation success invalidate preparation freshness; on failure restore prior selection and display a local error.
- [ ] Run web tests/typecheck; inspect loading, empty, long labels, unsupported techs, and failed saves. Keep sections small and split only responsibilities already named here.

## Task 4: Visible GitHub sync and reviewed CV suggestions

**Files:** Create `apps/web/src/profile/PreparationSources.tsx`; modify `profile/CvUpload.tsx`, `profile/queries.ts`, `interviewPrep/queries.ts`, `interviewPrep/InterviewPrep.tsx`, `packages/core/src/githubTechs.js`, and `packages/core/src/__tests__/githubTechs.test.js`.

**Interfaces:** Reuse `fetchGithubTechSignals(username, knownTechs)`, adding optional `{ signal?: AbortSignal }`. Add `useSyncGithubMutation()` for fetching suggestions only; acceptance calls Task 2 persistence. Source review callbacks return selected technology IDs to a detached editor draft or an explicit overview acceptance mutation.

- [ ] Test fetch failure, partial repository scans, complete language-scan failure, empty results, duplicate IDs, cancellation, and user/account changes. A complete scan failure must not be reported as a successful empty sync; distinguish partial results without claiming all repositories were scanned.
- [ ] Show GitHub connection separately from usage, last successful fetch, and Sync now. Reuse existing identity linking and public-repository fetching; do not request broader OAuth permissions or claim private-repo/full-framework detection.
- [ ] Keep fetching and accepting separate. Dismiss changes no selections; Accept preserves favourites and unions reviewed IDs into stack. Bound rapid sync clicks, ignore results for a changed username/user, and keep failure/retry beside Sync now. Timestamp uses the last successful fetch, never an invented default.
- [ ] Change web Prep to read persisted accepted GitHub technologies when opted in. Stop automatic GitHub network scans from adding unreviewed languages; preserve other Prep categories and custom drills. Existing users with no accepted snapshot see an invitation to Sync/review without losing CV, stack, favourites, scores, or practice history.
- [ ] Adapt CvUpload so parsing can yield a reviewed draft rather than immediately invoking its save mutation. Preserve local-only extraction and existing clearing behavior; no raw text storage. Context sent to AI still goes through the existing redacted editable preview.
- [ ] Run web/core tests, including the existing GitHub tests. Manually cover connect callback, opted-out sync, review/dismiss/accept, empty scan, CV clear, and failed persistence.

## Task 5: Playbook freshness, first run, and safe replacement

**Files:** Create `apps/web/src/profile/PlaybookPanel.tsx`, `usePreparationGeneration.ts`, `playbookState.js`, and `playbookState.test.js`; modify `firstRun/FirstRunWizard.tsx`, `GenerateStep.tsx`, `wizardState.js`, `wizardState.test.js`, `profile/queries.ts`, `App.tsx`, and `lib/prepPlanHandoff.ts` where handoff integration requires it.

**Interfaces:** `usePreparationGeneration()` lives at the signed-in Profile owner and exposes `{ phase, error, retryAfter, start(snapshot, optionalContext), retry(), cancel() }`. Use the existing playbook client and Task 2 publication API. `playbookState.js` owns canonical request ordering, captured snapshots, and publication-attempt identity; lifecycle UI reads Task 3 status.

- [ ] Test unchanged reordered input sets, changed role/goal/favourites/locale, duplicate starts, stale responses, failed generation, failed publication, same-attempt publication retry, changed inputs during generation, legacy outputs, and unavailable AI configuration. Run web tests and verify the new assertions fail first.
- [ ] Start generation only after the preparation save succeeds; fix FirstRunWizard's current fire-and-forget save before generation. First run and returning editor hydrate from the same persisted preparation semantics, preserving favourites and selected focus.
- [ ] Keep the first-run one-question-per-screen experience and existing redacted optional context. Use the same publication path for first-run and replacement results; preserve existing goal-specific landing/handoff and mark onboarding complete only at the established completion boundary.
- [ ] Use `generateWithTimeout`, existing request limits, and retry-after countdown. Retain generated response in memory after publication failure so Retry does not spend another model request; use the same generation ID and expected active ID. Never delete prior output before successful publication.
- [ ] Keep an in-flight update across Profile subroutes. Abort on Profile departure/sign-out, suppress late writes, and clear memory on account change. Persist only an account-scoped attempt marker (ID/status/start time, no response/context) for interrupted-state messaging after reload; clear it after successful publication. Do not implement a background worker.
- [ ] Render lifecycle states and correct primary actions. Open current/previous playbook routes to actual saved IDs, with missing-artifact recovery and no false readiness. Generation uses preferred techs first within the existing API schema; source toggles alone do not mark accepted preparation stale.
- [ ] On successful publication update query caches and the existing Prep plan handoff only for the captured inputs. Avoid overwriting a separately selected Quest plan on failed generation. Preserve retry-first failure behavior.
- [ ] Run web/core tests and manually exercise mocked timeout, retry, navigation, refresh interruption, no-AI mode, old playbook visibility, and successful goal-specific landing. Do not run live provider requests unless asked.

## Task 6: Copy, browser acceptance, and release notes

**Files:** Modify `packages/core/src/locales/en.js`, `pt.js`, `sv.js`, `CHANGELOG.md`, and relevant README Profile description; extend existing screenshot/fixture tooling only if needed to represent new states.

**Interfaces:** All UI strings use existing translation keys or new `profile.preparation.*` keys. No prototype “sample account”, state selector, route debug text, hardcoded example times, or inert global tabs ship.

- [ ] Add translations alongside each earlier task, then run existing i18n completeness checks. Confirm native/mobile consumers retain existing keys.
- [ ] Verify desktop widths 1280/1680, tablet 1024, phone 375, landscape 740×375, keyboard-only, focus after navigation/import, reduced motion, and supported light/dark themes. Check long translated role/technology values without sideways overflow.
- [ ] Walk direct links, Back/Forward, signed-out deep links, OAuth return, dirty editor exit, catalogue favourites, GitHub review/cancel/retry, local CV parsing, current/stale/legacy/failed/interrupted playbooks, user switching, and missing/deleted output IDs using controlled fixtures.
- [ ] Run `rtk pnpm run ci` from the repository root. If Watchman is blocked, report the default failure and separately run core Jest with `--runInBand --watchman=false`; do not describe that as a passing default gate.
- [ ] Add a dated Added/Changed/Fixed entry, plus Database for the migration; leave earlier changelog entries untouched. Record migration deployment before application rollout and any required Supabase OAuth redirect allowlist update. No deployment or commit in this planning request.
- [ ] Report changed files, exact commands/results, skipped SQL/browser/live-model checks, and manual release follow-up. Completion requires all local checks available in the environment; untested production/live-model behavior stays explicit.

## Execution Order and Completion

Tasks 1 and 2 establish interfaces; 3 uses both; 4 builds on 2–3; 5 integrates 2–4 with first run; 6 validates the connected journey. Implement inline by default unless the user selects delegation. Do not implement the mockup's sample data, fake 1-second sync, required role, or tab-only persistence.

Self-review completed against the v3 mockup and product findings: all three menu URLs, GitHub sync, preferred technologies, reviewed CV import, detached drafts, freshness, legacy migration, retry, previous-playbook preservation, persistence, account isolation, and first-run continuity have owning tasks and checks. Remaining environment-dependent checks are real OAuth configuration, disposable-database SQL execution, rendered browser acceptance, and opt-in live generation.
