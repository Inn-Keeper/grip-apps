# ArchBoard Improvements Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Execute sequentially unless the user explicitly requests delegation.

**Goal:** Make the web Arch Board safer to edit, accessible on narrow screens and by keyboard, responsive during dragging, and economical when loading saved designs.

**Architecture:** Retain React, the SVG graph, shared evaluator, and TanStack Query. Isolate the canvas from page controls, use a scrollable logical workspace, and keep a small bounded editor history. Add summary/detail reads for the web without changing the mobile `listBoards()` contract.

**Tech Stack:** React 19, TypeScript, CSS modules, SVG, TanStack Query, Supabase, shared JavaScript core, Jest.

**Spec:** The requirements and acceptance criteria below capture the September 10 archBoard review and the user's request to include every finding. This document is the implementation specification and execution plan; product changes have not been implemented.

## Constraints and evidence

- Follow `AGENTS.md`, `BRAND.md`, `DESIGN.md` where present, and shared tokens/i18n. Preserve Grip naming and the existing visual identity.
- Prefix shell commands with `rtk`. Paths below are relative to `grip-apps/`.
- No new production dependencies, diagram framework, global state library, or speculative graph engine.
- Scope: web editor and necessary shared API additions. Preserve mobile behavior, persisted node/edge formats, sharing permissions, and existing scoring semantics.
- Source review confirmed fixed five-column placement, hidden canvas overflow, destructive replacement without dirty protection, inconsistent target-handle clicks, pointer-only graph operations, page-level drag state, and eager full-board fetching.
- Performance impact and rendered layout have not been measured. Treat performance improvements as hypotheses until profiled.
- Baseline: 26 evaluator tests passed using `rtk pnpm --filter @grip/core exec jest --runInBand --no-watchman arch.test.js`. This does not verify the browser or live database.
- No commits or deployment are part of writing this plan. During implementation, keep each task independently reviewable and follow the user's commit instructions.

## Coverage and sequence

| Review finding | Task |
| --- | --- |
| Unsafe clear, load, scenario switch and navigation | 1 |
| Offscreen nodes and inaccessible larger boards | 2 |
| Connection target inconsistency and cancellation | 3 |
| Keyboard editing and small targets | 4 |
| Narrow screens, crowded toolbar, distant inspectors | 5 |
| Missing save, share and clipboard feedback | 1, 6 |
| Misleading drag-from-palette instructions | 3, 5 |
| Percentage implies broader validation than performed | 7 |
| Whole-page rerenders and duplicate pointer processing | 8 |
| Eager full-board loading and broad refetches | 9 |
| Browser, regression and runtime verification | 10 |

Implement tasks 1–7 first, then profile/optimize in task 8 and change data loading in task 9. Task 10 verifies the integrated result. Record before/after profiling evidence before changing the rendering boundary.

## File responsibilities

Existing files to modify:

- `apps/web/src/archBoard/ArchBoard.tsx`: editor orchestration, scenario selection, dirty protection, save/load lifecycle.
- `apps/web/src/archBoard/types.ts`: editor snapshot and saved-board summary types.
- `apps/web/src/archBoard/NodePalette.tsx`: accessible click-to-add palette and responsive presentation.
- `apps/web/src/archBoard/NodeInspector.tsx`, `EdgeInspector.tsx`: selection editing and focus return.
- `apps/web/src/archBoard/SavedBoards.tsx`, `queries.ts`: async feedback, summary listing, detail reads, cache updates.
- `apps/web/src/archBoard/EvalResults.tsx`: honest score labels and prominent warnings.
- `apps/web/src/archBoard/constants.ts`: named spacing and history limits where reused.
- `apps/web/src/App.tsx`: guard in-app transitions that unmount a dirty board.
- `apps/web/src/lib/api.ts`: expose new shared reads.
- `packages/core/src/api.js`, `packages/core/src/__tests__/api.test.js`: additive summary/detail APIs and compatibility tests.
- `packages/core/src/i18n.js`, `packages/core/src/__tests__/i18n.test.js`: new copy and interpolation coverage.

New web-local files:

- `apps/web/src/archBoard/BoardCanvas.tsx`: SVG/nodes, pointer lifecycle, selection and keyboard interactions; extracted in task 8 after behavior is established.
- `apps/web/src/archBoard/ArchBoard.module.css`: responsive layout, focus, hit areas and overflow rules.
- `apps/web/src/archBoard/editorState.js` and `editorState.test.js`: framework-free history and snapshot helpers, checked with Node's built-in test runner.
- `apps/web/src/archBoard/boardGeometry.js` and `boardGeometry.test.js`: placement/content bounds/pointer coordinate helpers; Node tests.
- `apps/web/src/archBoard/connectionState.js` and `connectionState.test.js`: small shared transition function for pointer and keyboard connection behavior; Node tests.
- `docs/archboard-verification.md`: reproducible interaction scenarios, environment and measured results.

Use JSDoc for the local JavaScript helpers. If the web TypeScript configuration requires declarations, add matching `.d.ts` files beside these helpers; keep types aligned with `types.ts`. Do not move web-only editor concerns into shared domain exports.

## Task 1: Protect work and make save state truthful

**Files:** `ArchBoard.tsx`, `types.ts`, `editorState.js`, `editorState.test.js`, `App.tsx`, `i18n.js`.

**Contract:** `EditorSnapshot` contains `scenarioId`, `nodes`, `edges`, `talkSections`, `talkRating`, and `talkGrade`. Board ID/title and the saved baseline are session metadata, not undoable graph edits. History stores up to 50 snapshots. `sameSnapshot(a, b)` compares persisted content; selection, panel visibility, timer and evaluation result are excluded.

- [ ] Add failing tests for edit/undo/redo, redo invalidation after a new edit, the 50-entry cap, clear restoration, and save-baseline comparison. Use this minimum history contract:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHistory, commitSnapshot, undo, redo } from './editorState.js';

test('undo restores nodes and their incident edges together', () => {
  const original = { scenarioId: 's', nodes: [{ id: 'a' }, { id: 'b' }],
    edges: [{ id: 'e', from: 'a', to: 'b' }], talkSections: {}, talkRating: null, talkGrade: null };
  const history = commitSnapshot(createHistory(original), { ...original,
    nodes: [{ id: 'b' }], edges: [] });
  assert.deepEqual(undo(history).present, original);
  assert.deepEqual(redo(undo(history)).present, history.present);
});
```

- [ ] Implement `{ past, present, future }` history helpers. Record one drag at pointer release and one inspector/text editing session at blur, not every pointer move/keystroke. Keep live content available to dirty checks before blur. Undo/redo invalidate derived evaluation output.
- [ ] Track the last successfully saved snapshot. A successful save marks only the submitted snapshot saved: edits made while the request is pending remain dirty. Disable duplicate save requests. A failed save retains the full draft and dirty state.
- [ ] Add Undo/Redo actions and shortcuts, ignoring shortcuts inside editable controls. Clear resets content through history while retaining the active board identity; it becomes an explicit saveable edit. Show “New board”, “Unsaved changes”, “Saving…”, or “Saved” based on actual state.
- [ ] Guard scenario changes, loading a different board, and in-app navigation with “Discard unsaved changes?” only when dirty. Cancel preserves all content. Install `beforeunload` only while dirty. Clean transitions never prompt.
- [ ] While saving/loading, disable conflicting board replacement actions so a late response cannot change another board's identity. Confirm dirty replacement before starting a load, and replace the editor only after the requested board and scenario are available. Failed loads preserve the current draft.
- [ ] Run `rtk node --test apps/web/src/archBoard/editorState.test.js`. Manually verify clear→undo restores talk sections and incident edges, and save→edit during request→success still shows unsaved changes.

## Task 2: Keep every node reachable

**Files:** `ArchBoard.tsx`, `boardGeometry.js`, `boardGeometry.test.js`, `ArchBoard.module.css`, `constants.ts`.

**Contract:** `findPlacement(nodes, viewport, nodeSize)` returns `{x, y}` for an unoccupied cell. `contentBounds(nodes, viewport, nodeSize)` returns `{width, height}` containing every node plus handle padding. `pointerToBoard(client, rect, scroll)` maps client coordinates into the unscaled board content.

- [ ] Add failing geometry tests for 320px and 480px viewports, a fourth/fifth node, a full first row, deletion followed by addition, and loaded nodes beyond the viewport.

```js
assert.equal(pointerToBoard({ x: 140, y: 90 },
  { left: 100, top: 50 }, { left: 200, top: 120 }).x, 240);
const p = findPlacement([], { width: 320, height: 560 }, { width: 132, height: 54 });
assert.ok(p.x >= 0 && p.x + 132 <= 320);
```

- [ ] Replace fixed five-column placement with columns derived from available viewport width and existing spacing. Scan for a free cell; never reuse an occupied position merely because the node count decreased.
- [ ] Separate the scroll viewport from the logical canvas. Use native `overflow: auto`; derive content dimensions from viewport and node bounds, preserving room for handles. Scroll the new node into view after insertion. Loaded diagrams retain their coordinates.
- [ ] Measure viewport size with one `ResizeObserver`. Convert pointer coordinates with scroll offsets and borders consistently; capture geometry at gesture start and refresh when the viewport scrolls/resizes. Growing content must not move the coordinate origin.
- [ ] Add “Go to selected” and “Reset view” controls using native scrolling. Keep all diagram content reachable at narrow widths without horizontal page overflow. A zoom engine and auto-layout are outside this iteration.
- [ ] Run `rtk node --test apps/web/src/archBoard/boardGeometry.test.js`. Manually drag after horizontal/vertical scrolling, resize a saved wide board, and add 30 nodes without losing access to any node.

## Task 3: Unify connection behavior

**Files:** `ArchBoard.tsx`, `connectionState.js`, `connectionState.test.js`, `i18n.js`.

**Contract:** `activateConnection(sourceId, targetId)` returns `{ sourceId, edge }`, where `edge` is either `null` or `{from, to}`. First activation selects the source, same-source activation cancels, another node completes and clears selection. Duplicate and self-edge rejection stays in the graph update boundary.

- [ ] Write and run transition tests before changing handlers:

```js
assert.deepEqual(activateConnection(null, 'a'), { sourceId: 'a', edge: null });
assert.deepEqual(activateConnection('a', 'b'), {
  sourceId: null, edge: { from: 'a', to: 'b' }
});
assert.deepEqual(activateConnection('a', 'a'), { sourceId: null, edge: null });
```

- [ ] Route body and either side-handle activation through the same transition. Preserve click-to-connect and Shift-drag. Add a movement threshold before treating a pointer interaction as a drag.
- [ ] Use one owner for connection move/up events. Stop propagation where needed; remove overlapping node/canvas processing. Handle `pointercancel` and lost capture by clearing transient state without creating an edge.
- [ ] Escape cancels, empty-canvas activation cancels, and removing the source cancels. Keep click suppression tied to the completed gesture so it cannot suppress an unrelated later click.
- [ ] Show “Connecting from {node}. Choose a target or press Escape.” Highlight the hovered valid target and selected source with more than color alone.
- [ ] Replace introductory copy with “Click a component to add it. Move it on the canvas, then select a connection handle and a target.” Provide the Shift-drag shortcut as secondary help.
- [ ] Run `rtk node --test apps/web/src/archBoard/connectionState.test.js`. Verify body→handle, handle→handle, same-source cancellation, reverse-direction edges, duplicate rejection, touch activation and canceled gestures.

## Task 4: Complete keyboard editing and increase hit areas

**Files:** `ArchBoard.tsx`, `NodeInspector.tsx`, `EdgeInspector.tsx`, `ArchBoard.module.css`, `i18n.js`.

- [ ] Make node bodies focusable with accessible names including type and instance position/name. Enter selects and opens available editing controls; arrow keys move by 10px, Shift+arrow by 1px. Delete/Backspace removes the selected graph item only when focus is in the canvas, never in text inputs.
- [ ] Keep connection handles native buttons with source-specific accessible labels. Enter/Space on source and target handles uses task 3's transition, allowing the full connection flow without a pointer.
- [ ] Provide a native “Connections” select/list control for choosing an edge and opening its inspector; do not depend on SVG paths being keyboard accessible. Show from/to labels and protocol/mode where present.
- [ ] Increase handle, inspect and remove hit boxes to at least 32px, and 44px for coarse pointers. Keep visual circles compact. Adjust padding/position so hit boxes do not overlap adjacent controls or get clipped.
- [ ] Add visible focus rings, selected-node styling and a polite live region for add/remove/connect/save outcomes. Do not announce every drag frame. Restore focus to the triggering node/control when an inspector closes, or to the canvas after deletion.
- [ ] Complete a keyboard-only scenario: add nodes, move them, connect them, edit a connection, delete, undo, evaluate and save. Test browser zoom at 200%, and screen-reader labels/status announcements. Record results in `docs/archboard-verification.md`.

## Task 5: Rebalance the editor layout

**Files:** `ArchBoard.tsx`, `ArchBoard.module.css`, `NodePalette.tsx`, `NodeInspector.tsx`, `EdgeInspector.tsx`, `EvalResults.tsx`, `ScaleBrief.tsx`.

- [ ] Replace layout-heavy inline styles with the module stylesheet while preserving shared tokens. At 1100px and above use palette / flexible canvas / optional inspector columns; below 1100px place the inspector below the canvas. Below 760px use a collapsed palette disclosure and wrapped toolbar.
- [ ] Use `minmax(0, 1fr)` for flexible grid tracks and `min-width: 0` on children. Remove the canvas's fixed 480px minimum and the action group's nonwrapping assumption. Let the board viewport, not the page, scroll horizontally.
- [ ] Put Save and Evaluate in the primary toolbar; group history and view controls separately. Keep Clear visually secondary and separated from Save. Keep the current board title/status visible without opening saved boards.
- [ ] Keep scenario selection and a short brief visible. Make the longer scale brief collapsible using a native disclosure with a clear label. Preserve the timer's sticky behavior and avoid introducing a second overlapping sticky header.
- [ ] Display only the currently selected node or edge inspector. On compact screens, selecting an item reveals and scrolls to its inspector without stealing focus during dragging. Evaluating reveals results and brings their heading into view, respecting reduced motion.
- [ ] Verify 360, 768, 1024 and 1440px viewports, long scenario names, open saved boards, open talk track and 200% zoom. Ensure controls remain reachable, canvas height is useful, and results do not overflow due to their existing 320px grid minimum.

## Task 6: Surface async errors and progress

**Files:** `SavedBoards.tsx`, `queries.ts`, `ArchBoard.tsx`, `i18n.js`.

- [ ] Render separate loading, empty and error states for saved boards and custom scenarios. Do not show an empty list while the first request is pending. Keep retry available and preserve editor content when reads fail.
- [ ] Surface share/unshare errors next to the affected card. Disable conflicting actions for that card while its mutation is pending. Only reflect sharing changes after a successful response; keep the server's actual token.
- [ ] Wrap clipboard writes in `try/catch`. Show “Link copied” only after success. On failure expose the link as selectable text with “Copy failed. Copy the link below.” Clear/reset status timers on unmount.
- [ ] Reset stale errors when a new operation begins. Use existing translation conventions and polite status announcements. A failed save leaves Retry and the draft available.
- [ ] Manually exercise offline reads, rejected save/share/unshare requests, denied clipboard access, retry success and rapid repeated clicks. No action should report success before its promise resolves or produce an unhandled rejection.

## Task 7: Make evaluation honest and actionable

**Files:** `EvalResults.tsx`, `i18n.js`, `packages/core/src/__tests__/arch.test.js`, `packages/core/src/__tests__/i18n.test.js`.

- [ ] Label the percentage “Checklist coverage” and add “Checks matched for this scenario; review the warnings and explain your trade-offs.” Replace the web result's score-only shipping verdict with “Checklist complete” or “Checklist partially complete”. Use new keys if existing verdict strings are shared with mobile.
- [ ] Promote warnings from “Meeting notes” to a clearly labeled “Design warnings” section near the score. Show warning count even at 100%; preserve warning text and checks without inventing severity classifications.
- [ ] Label cost and maintenance as relative units, not currency estimates. Keep over-budget status visible independently of checklist percentage.
- [ ] Preserve the evaluator formula and stored score contracts. Do not turn warnings into undisclosed point deductions. Add a domain regression if one is missing for this combination:

```js
const result = evaluate({ budget: 0, checks: [
  { kind: 'node', type: ['service'], label: 'Service exists', points: 100 }
] }, [{ id: 's', type: 'service', x: 0, y: 0 }], []);
expect(result.score).toBe(100);
expect(result.warnings.some(w => w.startsWith('Over budget:'))).toBe(true);
```

- [ ] Verify the UI displays both 100% checklist coverage and the over-budget warning. Run `rtk pnpm --filter @grip/core exec jest --runInBand --no-watchman arch.test.js i18n.test.js`.

## Task 8: Profile and isolate drag rendering

**Files:** `ArchBoard.tsx`, new `BoardCanvas.tsx`, `NodePalette.tsx`, geometry helpers, `docs/archboard-verification.md`.

**Interface:** `BoardCanvas` receives nodes/edges, selected IDs and graph edit/selection callbacks. It owns transient drag position and preview connection state. It reports a completed move as `onMoveNode(id, {x, y})`, once per gesture; unrelated page state stays outside it.

- [ ] Before extracting, capture three comparable five-second drags for 12 nodes/20 edges and a stress board of 100 nodes/150 edges. Record browser, device, viewport, React Profiler commits, scripting/layout time and long tasks. Use the same board and environment after changes; development profiling is diagnostic, production tracing checks user-facing timing.
- [ ] Extract canvas rendering and gesture state. During drag render the transient position locally and compute attached edge geometry from the same position. Commit one final graph edit to page/history on release; cancellation restores the original position. Do not let a save omit an active drag: finalize the gesture or disable Save until it ends.
- [ ] Keep scenario options dependent only on custom scenario data, and cost/maintenance dependent on node types/properties rather than transient coordinates. Memoize the canvas boundary only with stable callbacks and props; a wrapper alone does not eliminate rerenders.
- [ ] If traces still show redundant updates within one frame, coalesce pointer positions through a single `requestAnimationFrame`. Flush the final pointer position on release and cancel scheduled work on unmount/cancellation.
- [ ] Avoid virtualization, worker evaluation, spatial indexes and a replacement graph library. The evaluator runs on demand and its current collection sizes do not establish a bottleneck.
- [ ] Reprofile and document measured deltas. Acceptance: no unrelated page-panel commits during a steady drag, no duplicate event handling, one history entry per completed drag, no incorrect endpoint positions after scroll, and no material regression in keyboard or touch interaction. Report frame-time results instead of claiming an unmeasured speedup.

## Task 9: Load summaries and update caches precisely

**Files:** `packages/core/src/api.js`, `packages/core/src/__tests__/api.test.js`, `apps/web/src/lib/api.ts`, `queries.ts`, `types.ts`, `SavedBoards.tsx`, `ArchBoard.tsx`.

**Additive API contracts:**

```ts
type BoardSummary = {
  id: string; title: string; scenarioId: string;
  shareToken: string | null; createdAt: string; updatedAt: string;
};
listBoardSummaries(): Promise<BoardSummary[]>;
getBoard(id: string): Promise<SavedBoard>;
// Existing listBoards(): Promise<SavedBoard[]> remains unchanged for mobile.
```

- [ ] Add failing API tests proving summary reads exclude `nodes`, `edges`, `talk_track` and `talk_grade`; detail reads filter by ID and propagate missing/unauthorized errors; existing mobile list behavior remains intact. Use the existing Supabase mock conventions in `api.test.js`.
- [ ] Implement summary projection with `id,title,scenario_id,share_token,created_at,updated_at`, ordered by `updated_at` descending. Implement detail with `.select('*').eq('id', id).single()` and existing `boardToUi`. Update API JSDoc, returned methods and web bindings. Preserve RLS and token-based public sharing; no new open read policy or schema migration.
- [ ] Use distinct query keys: `['arch-board-summaries']` and `['arch-board', id]`. Enable summary loading when Saved boards opens. Remove the eager saved-count badge; show a count only after the list loads. Replace card node/edge counts with last-updated information rather than downloading graph JSON for counts.
- [ ] Load selected details on demand. Treat cached detail as stale for explicit loads unless freshly revalidated, so another tab/device's edits are not silently ignored. Keep the old draft visible while loading and ignore responses from superseded requests. Confirm scenario availability before replacement; do not report unknown custom scenarios merely because their query is still loading.
- [ ] On save success write the returned full board into its detail cache and insert/replace its summary in an already loaded summary cache, preserving updated-at ordering. On deletion remove both entries; on share/unshare update only the token after success. Do not synthesize a complete summary list from a single saved item when none was fetched.
- [ ] Include both new key families in the existing auth-cache reset boundary. Inspect `packages/core/src/authCache.js` and web auth wiring; test sign-out/account switching so cached summaries/details never survive into another user's session. Retain normal freshness/refetch behavior when reopening a stale list.
- [ ] Seed a test account with many boards and inspect the network: no board list on opening the editor, metadata-only list on opening Saved boards, one detail read on Load, no full-list refetch after each successful mutation. Compare bytes transferred against baseline. If the metadata list itself becomes measurably large, propose pagination separately rather than adding it without evidence.
- [ ] Run `rtk pnpm --filter @grip/core exec jest --runInBand --no-watchman api.test.js authCache.test.js` and the relevant mobile board checks after the additive shared API change.

## Task 10: Integrated verification and delivery

**Files:** `docs/archboard-verification.md` and regression checks associated with changed behavior.

- [ ] Run all new native checks: `rtk node --test apps/web/src/archBoard/editorState.test.js apps/web/src/archBoard/boardGeometry.test.js apps/web/src/archBoard/connectionState.test.js`.
- [ ] Run `rtk pnpm --filter @grip/core exec jest --runInBand --no-watchman`, `rtk pnpm --filter web typecheck`, `rtk pnpm lint`, and `rtk pnpm --filter web build`. Run mobile typechecking/tests appropriate to any shared changes. Separate pre-existing/environment failures from introduced failures.
- [ ] Use the available browser automation tooling for repeatable interaction checks. There is no confirmed web E2E harness in the inspected files; do not invent a passing E2E command or add a framework solely for this plan. Keep exact manual steps and evidence where automation is unavailable.
- [ ] Exercise a complete flow: pick scenario → add/move/connect → inspect → undo/redo → evaluate → save → share/copy → reload → unshare. Repeat core editing by keyboard and on a narrow touch viewport.
- [ ] Exercise loss prevention: dirty scenario switch canceled/confirmed, dirty navigation, clear→undo, node removal→undo, save failure, edits during save, rejected/slow load, custom scenario read failure and browser refresh warning.
- [ ] Exercise geometry: scrolled drag, resized viewport, saved offscreen nodes, overlapping nodes, reverse edges and canceled pointer capture. Confirm arrows and hit areas follow the rendered positions.
- [ ] Check desktop/compact layout with open panels, long labels, 200% browser zoom and reduced motion. Record screenshots for the tested viewports and accessibility observations without claiming a formal accessibility audit.
- [ ] Capture before/after drag profiles and network payloads. Verify live Supabase summary/detail ownership and share revocation with test accounts if credentials are available; otherwise explicitly mark live checks unverified.
- [ ] Review the final diff for unrelated changes, new dependencies, misleading score copy, missing error states and accidental mobile contract changes. Summarize files changed, commands/results, measurements and remaining verification limitations.

## Definition of done

Every finding in the coverage table has a verified implementation or a clearly documented evidence-based reason for deferring an optimization. Users can recover destructive edits, find every node, complete the editing flow with a keyboard, understand save/error/evaluation status, and use the editor on narrow screens. Dragging does not rerender unrelated panels, and saved graph payloads are fetched only when needed. Passing unit tests, successful builds, rendered behavior and live database checks are reported separately.
