# Personalized first-run journey and AI preparation plan

Date: 2026-11-07. Status: proposed product design and delivery roadmap; no implementation authorized or performed. Recommendations below are defaults for review, not previously approved decisions.

## Outcome

A new user should reach a useful practice task shaped around their stack, preparation goal, and optional target role. Setup is successful when they practice, not when they finish a form. Returning users should continue the same preparation focus and change it without losing work.

Preserve three questions: choose your stack; explain what you need help with; optionally supply a job description. Add a compact review before applying the result. Keep the initial path usable without AI, a job posting, a CV, or an existing career story.

Confirmed requirement: “problem” means a preparation goal plus an optional technical design problem. Distinguish those fields because “prepare for system design” and “design a payments service” require different outputs.

## Current foundations and implications

Source inspection on 2026-11-07, including existing uncommitted work; this is not runtime or usability-test evidence.

| Existing surface | Reuse and required change |
| --- | --- |
| `packages/core/src/api/profile.ts` | Stores favorite techs, CV techs, GitHub opt-in and an onboarding boolean. Explicit preparation selections need their own meaning; favorites and detected experience are not identical to learning goals. |
| `packages/core/src/user.js` | Profile saving marks onboarding completed. The new wizard must have independent version/status fields, so editing a profile cannot accidentally complete it. |
| `packages/core/src/prepPlan.js`, `nextUp.js` | Deterministic weak-topic ordering and next-action selection already exist. Extend these rules instead of asking a model to schedule every click. |
| `apps/web/src/lib/prepPlanHandoff.ts` | Quest-to-Prep target is currently a localStorage payload. A durable, account-owned focus should replace this as the source of truth and work across devices. |
| `packages/core/src/api/stories.ts`, `boards.ts`, `scenarios.ts` | Stories, custom scenarios and boards are persisted; story/scenario/board links already exist. Add focus associations and draft provenance without duplicating these editors. |
| `packages/core/src/scenarioCatalog.js`, `apps/web/src/archBoard/ArchBoard.tsx` | Built-in and custom scenarios are supported. A custom brief is not automatically a valid scored scenario: checks must match the supported evaluator. |
| `grip-ai-api/app/main.py`, `posting_reader.py`, `import_service.py`, `service.py` | Authenticated grading, ledger extraction and protected URL reading exist. Tailored preparation requires new contracts and evaluation fixtures, not just one larger grading prompt. |

Implementation spans **grip-apps and grip-ai-api**. No pipeline-service change is needed for the initial scope. This document lives in grip-apps so the product journey has one durable source.

## Approach choice

1. Preferences-only wizard: fast and inexpensive, but leaves the user to translate preferences into stories and board exercises.
2. Generate an entire workspace: impressive initially, but adds waiting, unsupported content and clutter before the user has practiced.
3. **Recommended: curated practice plus selective AI drafts.** Apply filters immediately, reuse relevant content, and generate a small editable starter only where useful. One persistent focus connects the screens.

Do not add an agent framework, vector database, external research crawler or background scheduler for this feature. Existing catalog matching, structured model responses and ordinary database writes are enough for the first version.

## First-run journey

### Entry and persistence

Show after the first authenticated entry, before ordinary practice, with “Set up your practice” and a visible “Explore first” link. Public boards, demo sessions and authentication callbacks must remain accessible. Resume the intended destination after setup or skipping. Existing accounts get a dismissible invitation, never a forced interruption.

Save completed steps as an account-owned draft. Back preserves inputs. Refresh and a second device resume the last saved step. Local unsaved edits show their save status; account changes clear local caches and prevent late responses from being applied to another user. Skipping records `skipped` and suppresses repeat automatic prompts; Profile always offers setup again. Completion is independent of AI success.

### 1. Choose your stack

Copy: **“What do you want to practice?”** Supporting text: “Choose technologies you use or want to learn. You can change these later.”

Use searchable, grouped multi-select chips sourced from the actual quiz catalog, with supported coverage visible. Suggest existing favorite/CV/GitHub signals only where previously authorized; do not silently select them as goals. Encourage a small starting selection without requiring a long questionnaire. Allow “Help me choose” and “Skip for now.”

Show a small immediate preview such as “Your first drill will cover React and TypeScript.” No AI call is needed. Unknown technology requests can be retained as interests, clearly marked “No quiz coverage yet”; never substitute a vaguely related technology without showing the choice. A selection with no supported questions offers a broader fundamentals drill or a story/board path.

Do not infer proficiency from stack selection. Use current difficulty controls and a short first drill; optional level and session length can be edited in the review/settings area. Proposed initial drill: five questions, capped by available valid questions.

### 2. Define the need

Copy: **“What would you like to work on?”** Choose one primary goal: technical interview practice, explaining past work, system design, or exploring/improving skills. Include an optional plain-text description and optionally a technical scenario: “Design a reliable payments service.”

Keep the goal and technical brief separate in storage. Offer examples and allow broad answers. Do not require a polished specification. If the user supplies a specific scenario, ask only a truly blocking follow-up; otherwise show editable assumptions in the preview.

The goal controls the first destination and relative recommendations; it does not hide the other parts of Grip. A behavioral goal can lead directly to Stories. A technical scenario can lead directly to Arch Board. Users should not have to complete a quiz to unlock either.

### 3. Optional target role

Copy: **“Preparing for a particular role?”** Supporting text: “Add a job link or paste the description to focus your practice.”

Accept a URL, pasted text, or an existing Quest application. Do not require both a URL and text. Use the existing protected posting reader. On blocked, expired, empty or unreadable pages, show paste/manual-entry options beside the field and preserve everything already entered. Do not attempt to bypass login or anti-bot protections.

Extract an editable summary: role/title, explicitly stated seniority, responsibilities, required and preferred technologies, relevant competencies, and source excerpts. Missing details stay unknown. The role describes employer expectations, not the user's experience. Show conflicts: “This role mentions Java; you selected TypeScript.” Offer adding Java, keeping the original stack, or tracking it as a gap.

Suggested deadline and practice duration are optional, outside the mandatory path. Adding a posting does not mark an application as submitted. “Track in Quest” is a separate explicit action and can link an existing application to prevent duplicates.

### Review and start

Use a summary within the wizard, not another questionnaire: selected stack, primary goal, target if any, assumptions/gaps, and three small proposed outputs:

- A ready-to-run quiz selection from the curated bank.
- Up to three story prompts mapped to relevant competencies, preferably pointing to existing stories.
- One matching catalog scenario or a proposed custom board brief.

One primary action reflects the chosen goal: “Start a 5-question drill”, “Shape your first story”, or “Open your design brief”. Secondary links edit inputs or open other activities. No full-page AI spinner blocks entry. If drafts are pending, show their local status and offer the curated option immediately. Late suggestions must never replace an activity already started.

Wizard outline: `Stack → Goal and optional scenario → Optional role → Review → Chosen practice`. Skip from any input stage reaches a useful default, with no invented personalization claim.

## Personalization that continues after setup

Use one **active preparation focus**, with saved focuses available later for different roles. Show its short name consistently in Prep, Stories and Arch Board. Switching focus changes recommendations, not historical results or editor contents. During a task, defer the switch until completion or explicit save/exit; never discard an answer, story draft or diagram.

Precedence: explicit edits and exclusions first; confirmed target requirements next; selected goal next; previously authorized profile suggestions last. AI recommendations never override user decisions. Keep excluded techs excluded until the user changes that choice. A JD change produces a reviewable difference, not automatic regeneration.

| Area | Focus behavior |
| --- | --- |
| Prep | Start with selected/confirmed techs; prioritize unattempted and weaker topics using existing evidence. Relevant due reviews remain useful; allow opening global reviews separately. Apply session size/difficulty explicitly. |
| Stories | Suggest competencies and real existing stories; give reflection prompts where evidence is missing. Preserve the user's facts and wording choices. |
| Arch Board | Choose a suitable existing scenario first; otherwise offer a validated custom brief. Start with an empty canvas and clear requirements by default. Optional hints are distinguishable from the user's solution. |
| Quest | Link a focus to an application only when requested. A role can have a focus before the user applies. |
| Profile | Edit default stack and manage/resume setup. Separate durable defaults from temporary role-specific additions. |

Keep a deterministic next-action rule: resume an unfinished task first; otherwise respect the selected starting goal; after that, use due review and weak-area evidence within the focus. Show a short reason, such as “You have not practiced SQL yet; this role requires it.” Avoid model-generated claims of readiness.

No XP for setup, accepting AI content, or generating artifacts. Quiz accuracy, practiced story coverage and assessed design remain distinct. Generated story prompts do not count as demonstrated competencies. Existing source scores remain intact when a focus changes; any focus summary states its coverage and sample size.

Example: a React developer targeting a backend-heavy payments role keeps React selected, confirms SQL as a preparation gap, receives a SQL drill, a prompt to recall a real reliability incident, and a payments design exercise with explicitly hypothetical scale assumptions. The app does not invent backend employment or imply those assumptions came from the employer.

## AI capabilities and boundaries

### Structured operations

Proposed authenticated endpoints in the existing AI service:

- `POST /api/v1/ai/preparation/analyze`: bounded user goal plus pasted/fetched description → role signals, source references, supported tech candidates, unsupported interests and ambiguities.
- `POST /api/v1/ai/preparation/draft`: confirmed focus plus allowed catalog/competency IDs and optional user-selected story facts → story prompts and one board proposal. Support requesting only the needed artifact type.

Return schema version, input fingerprint, assumptions and provenance with each result. Models do not write database records. Clients validate the response contract, preview it, then save accepted outputs through the existing authenticated database layer. Reject stale responses if the account, focus or input revision changed.

Analysis and drafting are separate because the user must be able to correct extracted requirements before they influence content. Without a JD, deterministic stack setup requires zero model calls. With a JD, budget one analysis call and one optional draft call; do not generate on every keystroke or tab change.

### Stories: truthful assistance

Distinguish `reflection_prompt`, `experience_draft`, and `fictional_practice`. A reflection prompt asks for evidence; an experience draft uses only supplied facts, marking missing action/results as questions; a fictional exercise is visibly labeled and excluded from personal-experience coverage. Never fabricate achievements, employers, years, metrics or ownership from a JD.

Do not send the entire story library by default. Deterministically shortlist relevant competencies; use selected story snippets only when the user asks for tailoring. Generated drafts remain separate until accepted. Regeneration creates a proposed revision, preserving edited text and allowing rejection.

### Boards: practice without giving away the answer

Generate requirements, constraints, questions and clearly labeled scale assumptions. Prefer catalog scenarios whose existing checks fit. A custom scenario may use only existing supported check types, validated references and bounded values. Do not generate executable scoring code or blindly copy checks from a loosely related scenario.

If reliable topology checks cannot be expressed, create an explicitly unscored design brief with supported reasoning feedback; never display a misleading topology pass. Keep generated hints and sample solutions out of assessed user work, and ensure public sharing does not expose private JD text or story notes.

### Reliability and cost

Reuse existing provider selection, authentication, quota/busy handling and typed generation machinery. Do not silently fall back from local inference to a cloud provider. Use operation-specific prompts/output limits rather than forcing generation through the grading rubric. Preserve grading capacity: cap concurrent personalization work using the existing provider slot and reject excess work with retry guidance instead of creating an unbounded queue.

Proposed application bounds: one role description up to 20,000 characters; goal up to 2,000 characters; at most three story prompts and one board brief per generation. Check the complete serialized context against the configured model budget; explain oversized input instead of silently truncating away requirements. These are product proposals to validate against provider adapters, not claims about model context capacity.

Cache successful validated results by user, operation, normalized input, model, prompt/schema version and relevant catalog version. Reuse unchanged previews. Never automatically retry an ambiguous generation timeout; the user can retry with clear status. A late canceled request cannot apply changes. Keep rendering, saving and AI availability as distinct states.

### Trust and privacy

Treat page content and user-supplied text as data, not executable instructions. Constrain IDs to supplied catalogs and validate source excerpts against submitted text. Keep existing URL-fetch safeguards, redirect validation, size/time limits and account rate limits. Raw URLs, job text and story text must not appear in logs or analytics.

Show which configured provider receives content before sending it, with an AI-free path. Store confirmed structured requirements and the minimal excerpts needed for their provenance; keep full fetched text transient by default. Explicitly saved private source text must support deletion. Do not infer personality, protected traits or “cultural fit” from the posting; interpret “vibes” as role responsibilities and technical emphasis.

Provider terms, quotas and hosting latency must be checked at implementation/deployment time. This plan selects no new model or paid service and makes no current pricing claims.

## Data and save semantics

Proposed small data model in Supabase:

- `preparation_focuses`: owner, name, version, selected tech IDs, excluded tech IDs, primary goal, optional technical brief, confirmed role signals/provenance, optional application reference, timestamps. JSON fields have explicit versioned runtime schemas and size limits.
- Profile fields: `active_preparation_focus_id`, `setup_version`, `setup_status` (`not_started`, `in_progress`, `skipped`, `completed`), and bounded draft/step state. Keep the legacy onboarding boolean compatible until callers are migrated.
- `preparation_artifacts`: owner/focus/revision, kind, validated proposal, provenance, state (`proposed`, `accepted`, `dismissed`), and accepted entity reference. The existing story/scenario/board tables remain canonical for editable user work.

Owner-based RLS applies to every new row and relationship; validate referenced rows belong to the same owner. A focus ID never grants access by itself. Use optimistic revision checks for two-device edits and show conflicts instead of overwriting.

Accept an artifact through one transactional database operation that creates its target entity and records the mapping. Uniqueness on the artifact identity makes retries return the same created entity. Creating a custom scenario and its board must also be atomic. This prevents double-click/reload duplicates and orphaned artifacts.

Save the focus before starting optional AI work. A failed draft generation cannot roll back completed setup. Saving a draft failure retains the user's form and exposes retry. On deletion, remove private proposals/source snapshots; keep accepted stories and boards unless separately selected for deletion, clearing their focus association. Deleting a source application must not erase practice history.

## Delivery slices and acceptance gates

Each slice needs a concrete implementation checklist against the then-current tree before coding. Existing unrelated changes are extensive; do not overwrite or bundle them. Commit only when requested.

### 1. Shared focus and deterministic onboarding

Affected: `packages/core/src/api.ts`, `api/profile.ts`, `database.types.ts`, new scoped focus API/schema helpers and Supabase migration; web `App.tsx` and a scoped `onboarding/` folder; mobile `app/_layout.tsx` and equivalent onboarding route; shared translations.

- [ ] Implement owned focus/setup persistence and migration compatibility before UI consumers.
- [ ] Build three skippable steps plus review; reuse existing tech picker and tokens.
- [ ] Connect selected stack to curated drills and selected goal to the starting destination.
- [ ] Test skip/resume, existing accounts, zero supported techs, auth changes, save failure, concurrent edits and public/deep-link entry.
- [ ] Demonstrate a useful first practice task with AI disabled on both clients.

### 2. Role understanding and confirmation

Affected: existing posting reader client/API; new `grip-ai-api/app/preparation_schemas.py`, `preparation_prompt.py`, `preparation_service.py`, routes in `main.py`; scoped web/mobile role review components.

- [ ] Reuse secure URL fetching and add pasted-text/manual fallbacks.
- [ ] Add bounded structured extraction with evidence and confirmed/excluded tech handling.
- [ ] Add operation-specific prompts/providers without changing grading behavior.
- [ ] Test blocked/expired links, malicious page instructions, mismatched evidence, unsupported techs, absent seniority, quota/busy/timeouts, stale results and account isolation.
- [ ] Show that step 3 can fail while the user still starts practice.

### 3. Story and board starters

Affected: new draft operation and offline fixtures in AI API; `api/stories.ts`, `api/scenarios.ts`, `api/boards.ts`; scoped proposal review components; artifact acceptance migration/RPC.

- [ ] Match existing content before generating; preview at most three story prompts and one scenario.
- [ ] Validate competency IDs, scenario checks, references, assumptions and story provenance.
- [ ] Add atomic idempotent acceptance and explicit unscored-board behavior.
- [ ] Test fabricated metrics, unsupported check types, duplicate acceptance, partial save failure, user-edited drafts and deletion/sharing boundaries.
- [ ] Demonstrate accepted content opening in the existing editors without artificial progress credit.

### 4. Continued use across screens

Affected: `prepPlan.js`, `nextUp.js`, `apps/web/src/lib/prepPlanHandoff.ts`, Prep/Stories/Arch Board/Quest/Profile screens and mobile counterparts.

- [ ] Make the persisted active focus the common recommendation source; retain compatibility with existing navigation handoffs.
- [ ] Add focus switching, editable targets and application linking without duplicate Quest entries.
- [ ] Preserve active tasks, historical evidence and user exclusions; show why a recommendation appears.
- [ ] Test focus switches during drills and edits, reload/cross-device behavior, changed/deleted applications and insufficient question pools.
- [ ] Verify the first action and returning-user next action lead to real work rather than repeated setup.

### 5. Evaluation and staged release

- [ ] Offline AI fixtures cover concise/vague/no goal, missing JD, conflicting stacks, unsupported techs, frontend/backend/mobile/data roles, junior/senior roles and English/Portuguese/Swedish inputs.
- [ ] Assert schema validity, grounded source references, allowed catalog IDs, no fabricated personal claims and safe fallbacks. Separate extraction correctness from relevance and writing quality.
- [ ] Human review checks whether the exercise is useful for the stated need and whether assumptions are visible. Curated golden fixtures alone do not prove model quality.
- [ ] Live provider comparison is explicitly opt-in; record model/prompt versions, latency, token use and acceptance quality. Do not run quota-consuming live tests without authorization.
- [ ] Run `rtk pnpm run ci` in grip-apps; run `rtk proxy .venv/bin/python -m pytest -q`, `rtk proxy .venv/bin/ruff check .`, and `rtk proxy .venv/bin/ruff format --check .` in grip-ai-api. Include RLS/transaction integration checks and existing-client compatibility.
- [ ] Review keyboard/screen-reader flow, localized copy, reduced motion, 1280/1680 desktop, 375 portrait, 740×375 landscape and 1024 tablet; verify native behavior separately.
- [ ] Release behind independently controllable setup and AI-tailoring flags. Disable generation without removing saved focuses or accepted work. Prefer additive migrations for rollback.

## Visual and interaction direction

Use BRAND.md, SCREEN-GUIDELINES.md and current tokens: calm dark surfaces, teal selection/focus, visible field labels, one primary action in the main area, local loading/error feedback and no decorative waiting animation. Poe can introduce and encourage briefly; he must not obstruct fields or simulate human certainty. Translate product copy into English, Portuguese and Swedish. Apply reduced motion and announce step changes, errors and saves to assistive technology.

A compact step indicator should say “Stack · Goal · Role (optional)”. Keep Back and Skip secondary, keep selected chips readable on phones, and give each step a single-column layout at narrow widths. Reconcile any existing guideline/token discrepancies before visual implementation; do not hardcode new values to resolve them locally.

## Measuring efficiency

Proposed targets to validate with real users, not measured claims: median non-AI setup under 90 seconds; first meaningful task within two minutes; no mandatory model wait. Instrument step viewed/completed/skipped, focus applied, task started/completed, draft accepted/edited/dismissed and fallback reason using IDs/counts only.

Primary measure: first-session completion of one relevant activity. Supporting measures: time to first practice, setup abandonment by step, seven-day return to the same focus, draft usefulness/edits, successful fallback rate, generation latency/cost per activated user and grading contention. Compare against existing entry without treating wizard completion as activation. Track unsupported coverage to guide future content additions.

## Decisions for review and deferred scope

Confirmed scope: capture the preparation goal with an optional technical scenario.

Recommended defaults: skippable setup; review before acceptance; five-question first drill; one active focus; real-experience prompts rather than invented career stories; curated quizzes rather than generated question banks; optional role tracking; web and mobile parity through shared contracts.

Not in this release: CV rewriting, auto-applying, employer-specific interview predictions, autonomous browsing, unlimited generated content, full learning-path scheduling, automatic skill-level claims, or replacing existing scoring with AI judgment. Further tailoring should be driven by observed practice and explicit user edits.

No product code, database migrations, deployments or live AI calls were performed while preparing this proposal. Browser/native acceptance and provider quality remain implementation-stage work.
