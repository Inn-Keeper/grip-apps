# Arch Board Experience Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task. The user approved the seven-part direction in chat; implementation stays in the existing web app.

**Goal:** Make the build → evaluate → improve → explain → save journey clear, calm and actionable.

**Architecture:** Keep existing canvas, scoring and document persistence. Add small web helpers for connection guidance, evaluation targets/deltas and anchored AI availability. Use existing tokens and colocated CSS Modules; no new dependencies.

**Tech stack:** React, TypeScript/JavaScript, TanStack Query, CSS Modules.

**Spec:** Approved chat direction: stable quota time; specific actionable arrow guidance; Redis/unspecified protocols; evaluation-to-canvas feedback; distinct design/reasoning/coverage signals; calm working surface; confident save/resume.

## Constraints

- Web only; preserve native/mobile behavior and shared scoring rules.
- English, Portuguese and Swedish copy; accessible controls, reduced motion, dark/light themes.
- No changes to provider limits, account data, database schema or automatic saving.
- Preserve save/reopen and assessment invalidation. Commit only when requested.

## Review focus

- Missing node/edge targets must explain what to add, without highlighting unrelated components.
- Failed checks remain actionable after diagram edits and reevaluation; stale results clear as today.
- AI limits expire without typing moving the reset time; unavailable/busy must not pretend to be daily quota.
- Short/empty descriptions and explicit unspecified protocols must have predictable guidance and unchanged scores.
- Board/scenario switches must clear transient highlights and evaluation comparisons; input focus and narrow layouts remain usable.

## Tasks

### 1. Availability and connection guidance

Files: `archBoard/queries.ts`, `types.ts`, `ArchBoard.tsx`, new `boardFeedback.js`/test, `EdgeInspector.tsx`, locales.

- [x] Test anchored retry deadline, missing mode/protocol selection and all-described state; verify failures first.
- [x] Anchor deadline when service status arrives; refresh when it expires. Distinguish quota and temporary limitation.
- [x] Identify the first incomplete arrow by endpoints and missing detail; offer one click to inspect it. When all arrows are described, invite evaluation.
- [x] Add web-only Redis (RESP) and explicit Unspecified protocol options; explain protocol labels do not earn checklist points.
- [x] Run focused tests and web typecheck.

### 2. Evaluation feedback and canvas polish

Files: `EvalResults.tsx`, new `EvalResults.module.css`, `boardFeedback.js`/test, `ArchBoard.tsx`, `BoardNodeCard.tsx`, `BoardEdges.tsx`, `ArchBoard.module.css`.

- [x] Test node/property/directed/bidirectional-edge targets and evaluation deltas; verify failures first.
- [x] Make check rows keyboard-accessible actions. Select relevant nodes/connections, fit their area and open the matching inspector/palette where useful; explain missing targets.
- [x] Keep missing checks ordered by points, passed checks folded, and display a restrained reevaluation change summary.
- [x] Add clear selected/feedback node and edge states, readable backed connection labels and responsive feedback layout. Motion only explains changes; honor reduced motion.
- [x] Verify focused tests and browser interaction.

### 3. Progress and completion

Files: `ScorePanel.tsx`, `TalkTrack.tsx`, `BoardToolbar.tsx`, locales, changelog.

- [x] Show design-check score separately from reasoning assessment and written coverage; explain completeness is not quality.
- [x] Preserve existing saved/resume flow; refine saved status and toolbar hierarchy without extra main actions or persistence changes.
- [x] Update changelog, run lint/tests/typecheck/build, review diff, and verify clean Firefox E2E plus representative viewport/theme/reduced-motion states with synthetic fixtures.

## Execution notes

- Existing save/reopen passed the prior regular-user journey; preserve its mechanics.
- Live AI grading is quota-blocked; verify error/recovery with fixtures and report live acceptance as untested.


## Verification and decisions

- Kept the five existing workflow steps; arrow description is coaching, with evaluation still available as a secondary action.
- Kept protocols web-only and scoring unchanged. Unspecified is an explicit stored label, localized for display.
- Only a validated current reasoning assessment advances the web workflow to Grade; legacy score-only boards remain unassessed.
- Review correction: locating a check clears armed drawing tools and pending connections before focusing targets.
- Firefox regular-user acceptance passed clean board construction, precise arrow guidance, Redis/Unspecified, missing-component picker, reevaluation, target highlights, stable quota time and save/reopen.
- Isolated Chromium fixture acceptance passed those interactions, Space-key check activation, exact node/edge highlighting, drawing-tool dismissal, five exact web viewport sizes (375, 740 landscape, 1024, 1280, 1680), both themes and reduced-motion preference. No real account or provider writes in fixtures.
- Core (503), web (97) and mobile regression (23) tests passed; lint, typecheck, production build and git diff --check passed. The production build retained its large-bundle warning. Default CI reached the known sandbox Watchman socket failure; Jest suites passed using --runInBand --watchman=false --no-cache. Mobile tests emitted the existing missing stories queryFn warnings.
- Remaining limits: successful live AI grading/quota reset, native-device acceptance and browser-restart persistence were not tested. A clean synthetic demo draft remains from Firefox acceptance; preexisting boards were preserved.

- Final focused code review found no further concrete issue after the drawing-tool correction. No new dependencies.

## Deferred AI quota review

- A fresh Firefox board was created and saved with four components, three connections, all six reasoning sections and self-rating 3.
- After the grading button became enabled, one live submission showed Grading and then returned to the daily-quota block; no assessment was returned.
- Opening the arrow inspector coincided with availability changing, but causation was not established. Investigate status refresh/provider quota behavior later, as requested.
