# Changelog

Notable changes to Grip (web, mobile and the Supabase schema), newest first.
Dates are the day the work landed on `main`. Database migrations are listed
because they have to be applied by hand.

## 2026-11-08

### Added

- Chat with Poe: an in-app guide on every signed-in web screen that answers how to use Grip, in Poe's voice. On Prep the mascot opens it. Five messages a day per user while we validate it; nothing is stored. Needs grip-ai-api with `AI_MODEL_POE`.
- The header logo on web links to the home page (Prep) when signed in.
- Standalone first-open journey mockup (`docs/first-open-mockup.html`) for UI validation; prototype only.
- First-run wizard on web (design in `docs/superpowers/specs/2026-11-08-first-run-wizard-design.md`): stack, goal (with an optional design brief), target role with a job link or description, and optional experience (a CV redacted in the browser plus a few notes). Review names the AI provider before anything is sent. Gemini then writes a playbook of likely interview questions as sample STAR stories and one scored Arch Board scenario, which technical stories link to. Poe walks across the screen in pixel-art style while it waits (placeholder sprite). The user lands on Prep, Stories or the board, depending on the goal.
- Profile (web) has "Reset goals": after a confirmation it deletes the goals, every generated story (edited ones too), the generated scenarios and their boards, then reopens the wizard. The user's own stories, boards, answers and XP stay.
- Prep (web and mobile) lists "From My Goals" first: the wizard's stack plus the target role's techs, saved on the profile. Favorites stay separate and are edited in Profile.
- Next Up on Prep (web and mobile) suggests "Get your interview playbook" until the user has one: first for brand-new users who chose "Explore first", then as the last alternative. On mobile it opens the web wizard (`?setup=1`), which is web-only for now.
- Generated stories carry a "Sample" tag until edited and a permanent playbook label. Stories offers "Generate my playbook" and Profile offers "Set up your practice" to run the wizard again; reruns add, never replace.
- Light theme groundwork (plan in `docs/light-mode.md`, phase 1): `tokens.js` exports `themes.dark` and `themes.light` with the same keys, plus an `alpha()` helper for translucent colors. Token tests check both themes for matching keys, formats and text contrast. Dark stays the default and nothing renders differently yet.
- Light theme plumbing on web (phase 2): theme colors, tints and shadows are CSS variables written per `data-theme`, translucent colors go through `alpha()`, and SVG token colors moved into `style`. ESLint now rejects hex alpha appended to a color and theme tokens imported straight from core in web code. Still dark only; before and after screenshots match.
- Light theme on web (phase 3): Profile > Preferences has a Theme choice (Dark, Light, System), saved on the device. Dark stays the default; System follows the OS live. The theme is set before first paint, and the browser bar color and native controls follow it. Pastel data colors (board node types, prep categories, competencies, difficulty) are mixed with black in light so they stay readable; a core test checks every one at 4.5:1.
- Light theme plumbing on mobile (phase 4): components read colors from `useTheme()` (a `ThemeProvider` in `@/theme`, dark by default), translucent colors go through `alpha()`, and pastel data colors through `dataColor()`. Contact status colors now also follow the theme on web. Still dark only on mobile.
- Light theme on mobile (phase 5): Profile has the same Theme choice (Dark, Light, System), saved on the device; dark stays the default. Native chrome follows the choice (status bar, tab bar blur, date picker, keyboard and alerts via `Appearance.setColorScheme`), and the captcha widget matches the theme on both apps.
- grip-ai-api: `POST /api/v1/ai/first-run/playbook` with output validated against Grip's competencies and components, an input cache, a per-user daily cap (`AI_PLAYBOOK_DAILY_CAP`, default 3) and a concurrency cap (`AI_MAX_CONCURRENT`, default 2). `/api/v1/ai/status` reports the provider.

### Changed

- Saving the profile no longer marks onboarding as complete; finishing the wizard or "Explore first" does.
- SCREEN-GUIDELINES rule 34 allows Poe's walk on the playbook generation screen.

### Database

- `0029_reset_goals.sql`: adds `custom_scenarios.playbook` (backfilled through generated stories) and the `reset_goals()` function.
- `0028_profile_goal_techs.sql`: adds `profiles.goal_techs` for "From My Goals".
- `0027_first_run.sql`: adds `stories.is_sample` and `stories.playbook`, and resets `profiles.onboarding_completed` so every user sees the wizard once. Applied to grip-platform on 2026-11-08.

## 2026-11-07

### Added

- Proposed personalized first-run journey and AI preparation roadmap (`docs/superpowers/plans/2026-11-07-personalized-first-run.md`); planning only, not implemented.

- Product UX repair plan (`docs/superpowers/plans/2026-11-07-product-ux-repairs.md`) and its implementation below.
- Prep shows "Progress not saved" with Retry when an answer fails to save, on web and mobile. Retry reuses the answer's request id, so it is never awarded twice. A failed bonus is reported, not retried, and a failed score load says so instead of showing zeros.
- Arch Board grading feedback (section verdicts, evidence, follow-up) is saved with the board and shown again after reload, only while the board still matches what was graded. Score-only boards say detailed feedback is unavailable.
- An empty scored Arch Board offers "Add a component", which opens the Components picker, instead of a disabled Evaluate.

### Changed

- Web Poe keeps his original artwork with subtle breathing, occasional head movement and blinking instead of a continuous whole-body float. Incorrect answers get a gentle sympathetic lean. Reduced motion shows the original still image.

- Readiness no longer shows a composite "Ready" percentage. The prep plan lists role tech accuracy, story competencies covered (`n of 8`) and assessed design separately, with "Not assessed" and "Unavailable" in place of zeros. Prep's headline reads "Accuracy on your stack".
- Editing the talk track, rating or story link keeps the topology evaluation; node and edge edits still clear it. Any change to what was graded clears the reasoning grade, including node edits on web and mobile. A grading response that arrives after the board or its inputs changed is ignored.
- On phones the Arch Board shows the scenario brief above the canvas. Talk track fields no longer force a 300px minimum width.
- Sign-in subtitle now describes the whole product: "Prepare for technical interviews and track your applications."
- Mobile moves to Expo SDK 57 (React Native 0.86.3, expo-router 57, Reanimated 4.5.1, Worklets 0.10.1, Screens 4.26). `@expo/dom-webview` is now a direct dependency so its SDK 57 version resolves. Jest stubs RN 0.86's app bootstrap (`InitializeCore`) and `nativeFabricUIManager`. Native builds need Xcode 26.4 or newer.

### Fixed

- Fly Me feature disclosures follow live viewport changes instead of keeping the width sampled when the module loaded, fixing collapsed desktop cards after Safari window restoration/resizing.
- Styling accessibility: the guided tour and shared web switches respect reduced motion, and header/footer brand marks stay still.
- Shared caption colors now meet normal-text contrast across the elevation ladder. Web font tokens use rem so default text-size preferences scale the interface; native font tokens remain numeric.
- Contact and story forms stack fields in narrow containers; Profile account fields stay inside their card at 320px.

- Prep retries stay tied to the account cache they started in: late failures and stale Retry actions cannot restore or resend another account's answers or bonus writes.
- Saved Arch Board assessments reject malformed sections, invalid scores and mismatched board identities before rendering; damaged feedback no longer crashes the board.
- Story, contact and retro forms stay open with their text when a save fails, show the error beside Save, block a second Save while one is pending, and ask before Back, Cancel, a tab change or a reload discards changes. Web and mobile.
- Web Arch Board: undo then redo right after grading keeps the grade and its feedback instead of dropping them.
- Dependencies: pnpm overrides move node-forge to 1.4.3 (Expo CLI) and decode-uri-component to 0.5.1 (expo-router), closing 13 Dependabot advisories.

### Database

- `0026_arch_boards_talk_assessment.sql`: nullable `arch_boards.talk_assessment` jsonb for the saved grading feedback. Applied on 2026-11-07, before the new clients deployed; older clients keep working. `database.types.ts` was edited by hand to match; regenerate with `pnpm --filter @grip/core generate:db` (needs the Supabase CLI).

## 2026-10-21

### Added

- Arch Board (web): Free board, the first entry in the scenario picker. No checklist, step rail, Evaluate or design score; you write what you are designing, link any story, and the talk track and AI grading work against that brief. Share links, story links and Quest treat it as unscored. Mobile opens free boards, hides Evaluate and grades against the brief written on web. The talk track intro on a free board says only the reasoning is graded, against the brief.
- Arch Board (web and mobile): free Box and Text tools in the palette. A box looks like a component, takes a typed name and connects to any node; text is a free note that takes no arrows. Neither is graded, and arrows touching a box are left out of grading too (en, sv, pt).
- Arch Board (web): Text is now its own tool, whiteboard style. Press T or the T button on the canvas, click where the text goes and type in place; Enter adds a line, Escape or clicking away finishes. Double clicking bare board also starts a text, double clicking a text edits it, and a text left empty is removed. Mobile still adds text from the palette for now.
- Arch Board (web): free shapes and drawing tools in the canvas tool bar: rectangle (R), diamond (D), ellipse (O), sticky note (N), arrow (A), line (L) and text (T). Shapes resize by dragging their corner, top and bottom handles, or with Alt + arrow keys; they take a name, a fill tint and text style, and connect to components like a box. Arrows and lines are drawn by dragging, keep loose ends, and take color, dashed and arrowheads (end, both, none). None of it is graded.
- Arch Board (web): built-in components resize like shapes: corner, top and bottom handles on the selected card, or Alt + arrow keys, down to a minimum that keeps the icon and label readable. Arrows follow the new size; the grade does not change.
- Arch Board (web): a selected component gets the style panel too: fill tint, label colour, size, alignment and bold. Its border keeps the type colour; style never changes the grade.
- Arch Board (web): a trash bin at the end of the style panel deletes the selected component, shape, text, arrow or line (same as Delete). The panel is now announced as Style, since it serves more than text.
- Arch Board (web and mobile): component cards drop the icon inside, so the label sits centred on its own; the type colour on the border tells components apart.
- Arch Board (web): four connect circles per component and shape (top, right, bottom, left). Resizing moves to the four corners, and the corner ✕ hides while a node is selected (the style panel's trash bin covers it). Only left and right circles are Tab stops.
- Arch Board (web and mobile): arrows pick the sides that face each other. Nodes side by side connect left to right as before; one above the other connects bottom to top with a vertical curve. Shared geometry in core, so existing boards redraw the same way on both apps.
- Arch Board (web): typing a shape's name starts where the label will sit: in the middle by default, top left on a sticky note. The editor grows with its text instead of filling the shape, and shows only the cursor, no "Name this box" placeholder (still announced to screen readers).
- Arch Board (web and mobile): component and shape labels are centred by default. Sticky notes and free text stay left aligned; the style panel still changes any of them.
- Talk track grading: a board without scenario figures (free boards, custom scenarios) no longer sends zeros as the correct answers. It sends no figures, and grip-ai-api now checks the candidate's own arithmetic in that case instead of marking every estimate wrong.
- Arch Board (web): a box can stay empty. It no longer opens for typing when added and shows no placeholder; double click or F2 names it. Screen readers still call it Box.
- Arch Board (web): text style panel for free text and boxes: size S to XL on the type scale, five token colors, alignment and bold. It shows while a text or box is selected. Shortcuts: Ctrl/⌘ Shift > and < for size, Ctrl/⌘ B for bold, Alt Shift L, C and R to align. A box grows with its size and arrows follow it.

### Changed

- Mobile board: the action row is one line of icon buttons (Show, undo, redo, then talk track with its count, saved boards, save, clear and Evaluate), each named for screen readers. The scenario title sits beside the Practise under time link.
- Mobile board (parity phase 3): undo and redo (icon buttons beside the Show arrow), using core's board history shared with web; a drag or resize counts as one step, and loading a board starts a fresh history. Saved boards can be shared: Share turns on the link and opens the iOS share sheet with web's read only page, Unshare turns it off. Not in demo mode. Web's history helpers moved to `@grip/core/boardHistory`. New optional `EXPO_PUBLIC_WEB_URL` (defaults to the production site).
- Mobile board (parity phase 2): editing matches web. A tool row on the canvas holds the Components sheet, the four shapes, arrow, line and text tools; a style bar shows for the selected item (size, colour, fill, alignment, bold, dashes, heads, trash bin); selected nodes resize from their corners; four connect circles per node; free boards take an editable brief. Fit and the + and − buttons now glide instead of snapping, and fast taps stack correctly.
- Mobile board: the round timer follows web's rule. It is hidden until a round starts; before that a Practise under time link with a clock icon shows on the first step only.
- Mobile board: Zen moved from the Show row to the zoom controls, beside Fit, so it no longer reads as a pair with Show. Fit and Zen show icons only (full screen corners for Zen); screen readers still read their names. Show and Hide are an arrow icon too (down to show, up to hide).
- Mobile board (parity phase 1): web boards now look the same on mobile. Shapes draw with their outline (rectangle, diamond, ellipse, sticky note), fill and saved size; resized components keep their size and arrows meet their real edges; text, shape and component styles (size, colour, alignment, bold) show; free arrows and lines draw with colour, dashes and heads. A new box no longer opens the label sheet, an empty box shows nothing, and small text moves from weight 800 to 700 (the readiness and mock scores keep 800). Editing all of this on mobile is phase 2.
- Core: `nodeSize`, `FILL_ALPHA` and `headPoints` moved from the web app into core so both apps share them.
- Core cleanup: dropped what only the removed scale panel used (`ESTIMATE_TARGETS`, `bandFor`, `gradeEstimate`, `formatCompact` and the `@grip/core/estimation` package export), the unused `SHAPES` list, the web icon entries for box and text, and the mobile cost icon. `TextStylePanel` is now `StylePanel`, and the card label sizes are `TEXT_FONT_TOKEN.card`.
- Arch Board (web): drag from a node's side handle to draw an arrow, no Shift needed. The drop snaps to the nearest node, as on mobile. Clicking a node no longer starts a connection; Enter on a node, then Enter on another, still connects from the keyboard.
- Arch Board (web): the built-in components moved into a Components dropdown in a tool bar on the canvas (with Box and Text), so the palette grid no longer takes room above the board. New nodes land below the tool bar.
- Arch Board (web): plain canvas, the dot grid is gone. Typography follows DESIGN.md: free text at weight 400 and line height 1.45, node labels at `small` with line height 1.3.
- Web rails: panel titles (WorkspaceTitle, so every screen's rails), Saved boards and the brief label drop from weight 800 to 700. At 11 to 13px Inter's 800 closes up the letters; DESIGN.md keeps 800 for hero numbers.
- Web: the rest of the small text at 800 moves to 700 too: the Arch Board step rail, its main rail button and action button, Next Up (label, title, button; every screen) the Combobox group headers and the shared board page heading. The design timer's large clock keeps 800.
- Arch Board (web and mobile): cost, upkeep and budget are gone: no palette prices, no cost or maintenance lines in the score panel, results or toolbar, no budget field on custom scenarios, and no Over budget warning. Mock loop no longer shows a budget.
- Arch Board (web and mobile): removed the scale brief panel (the given numbers, the estimate inputs, Check my math and the hand off to the talk track). Scenario numbers still drive board and talk track grading.
- Arch Board (web): the board uses the full window width, and the canvas grows to the screen height minus a strip left free for scrolling (before, it stopped at 420px).

### Fixed

- Mobile board: a dragged node no longer flickers. Each frame's re-render wrote React's older position back onto the node mid drag; the sync now waits until the finger lifts.
- Mobile board: Fit no longer pulls the canvas edge into the middle of the screen. Nodes near the edge could not be dragged left past it, and the next pan snapped the view; Fit now keeps to the same limits as panning.
- Arch Board (web): on a selected storage node the inspect button no longer covers the bottom right resize corner; it steps inside the card.
- Mobile board: the empty board hint now says to drag from a handle to connect, not tap then tap (en, pt, sv).
- Arch Board (web): full screen showed an empty page. Its layout still had a row for the old palette, so the canvas collapsed to 2px; it now takes the whole screen with its tools.
- Mobile board: dragging a connection no longer snaps to an invisible free arrow drawn on web, which made the connection silently fail.

### Database

- `0025_arch_boards_brief.sql`: nullable `arch_boards.brief` for a free board's own brief.
- `0024_custom_scenarios_budget_optional.sql`: `custom_scenarios.budget` is now nullable, since the app no longer writes it. Apply by hand before deploying the web app, or creating a custom scenario fails.

## 2026-10-09

### Changed

- Web celebration overlay: screen readers now announce it, it respects reduced motion, and its styles were pulled into named constants.

### Fixed

- GitHub tech import no longer fails the whole scan when one repo's language fetch throws; that repo is skipped.

## 2026-10-08

### Added

- Web Profile: Favorite techs section. Every Prep tech shows as a toggle chip, sorted alphabetically, and picks save to the profile (en, sv, pt).
- Mobile: Favorite techs card on Profile and the From My Favorites category on Prep, matching web.
- Interview Prep: From My Favorites category on top of the practice map, built from the profile's favorite techs (en, sv, pt).
- Lint rule `grip/style-properties-per-line`: JSX style objects put one property per line; web and mobile files reformatted to match.

### Changed

- Interview Prep: catalog categories and favorites list their techs alphabetically; From your profile keeps its strongest-first order.
- Core cleanup: `cvTechs.js` is now `techMatch.js` (it matches techs in any text, not only CVs), and the GitHub plus CV merge and the profile category builder moved into `drillSession.js`. `githubTechs.js` keeps only GitHub logic, and its language table drops mappings to techs outside the catalog.
- Web: Vite 6.4 to 8.3.3 (Rolldown bundler, pinned exact) and `@vitejs/plugin-react` 4 to 6; dropped the deprecated `optimizeDeps.esbuildOptions` block.
- `@grip/core/api` is now TypeScript, typed against Supabase types generated from the schema (`src/database.types.ts`, regenerate with `pnpm --filter @grip/core generate:db` after a migration). Web and mobile create typed Supabase clients, and `pnpm typecheck` now checks core too. No behavior change.
- Delete calls for boards, contacts and stories now require an id, and quiz `options` and scenario `checks` carry their real types instead of `object` or `any`.
- Faster Supabase reads: every query names the columns it uses instead of `*`, Prep scores, accuracy and the review queue come from two summary functions instead of paging every answer event three times, and Quest and story links load boards without talk tracks or share links. Saving a profile no longer calls the auth server.

### Fixed

- The GitHub-only profile category name is translated (was English in sv and pt).
- Dependabot alerts: pdfjs-dist bumped to 6.4, and pnpm overrides lift shell-quote, @xmldom/xmldom, brace-expansion, nanoid, postcss, source-map-js, js-yaml, compression, browserslist and decode-uri-component to patched releases. braces and node-forge have no patched release yet, and image-size is only fixed in a new major.

### Database

- `0021_record_answer_nullable_difficulty.sql`: `record_answer`'s `p_difficulty` defaults to null, so clients can omit it instead of casting null. Body and grants unchanged.
- `0023_profile_favorite_techs.sql`: `profiles.favorite_techs text[] not null default '{}'`.
- `0022_query_performance.sql`: access rules call `auth.uid()` once per query instead of once per row (same rules), new indexes for contacts, stories, retros, status events and answer events, and the `answer_tech_stats` and `answer_daily_totals` functions.

## 2026-10-06

### Added

- Mobile Quest list import: native file selection or pasted text, editable application review and final confirmation, with posting-link tech detection and safe retries (en, sv, pt).
- Posting techs can be added or removed by hand, from the Prep catalog, in each row of the import review and in the contact form (en, sv, pt).
- Ledger import reads each posting link (on by default, can be turned off in the review) and fills the row's techs from the posting, through a guarded grip-ai-api endpoint that only opens public https pages and stores nothing. Rows edited by hand keep their techs. Pages built with JavaScript (such as Ashby) are read through their schema.org JobPosting data (en, sv, pt).

### Changed

- Quest agenda restyled to match the pipeline rail: tone dot and count per section, inset rows with a colored edge and hover, the follow-up date on the left of each item and a link to the posting (en, sv, pt).
- Arch Board: keyboard shortcuts and the unsaved work guard, the choice of the main action, and the Next Up card moved out of `ArchBoard.tsx` into their own files. No behavior change.
- Mobile board: the toolbar, zen overlay and saved boards tray moved out of the screen into `components/board`. The Next Up step text now comes from `@grip/core/workflowState` on web and mobile alike. No behavior change.

- Duplicate check for new entries: the same posting link, or the same company and role, counts as already in Quest, ignoring case, brackets, markdown and suffixes like AB or Inc. In import such rows stay unchecked; the same company with another role stays checked with a note. The contact form warns (without blocking) when a new or edited contact matches one already in Quest (en, sv, pt).

- Tech detection (CV, pasted postings, posting links) knows common short names (TS, RN, Postgres, k8s, GraphQL and more, matched case sensitively) and breaks ties by first mention instead of alphabetically, so a posting's lead stack ranks first.

### Fixed

- Reading an imported list shows a processing spinner and only the bottom Cancel action (web and mobile).

- Import review and confirmation: responsive fields and persistent actions, distinct review/save labels, warnings that update after edits, validation for selected rows, and unrecognized lines included in the final summary. Posting links finish reading before review so confirmed details cannot change in the background (web and mobile; en, sv, pt).
- Imported contacts get a prep plan: ledger import now saves up to 5 must-have techs per application (named in the list, matched to the Prep catalog) as posting techs, shown as chips in the review list. Before, imported Interviewing contacts had no plan until edited (en, sv, pt).

## 2026-10-05

### Added

- Quest Activity panel: a 26-week heatmap of pipeline updates per day in the right rail, with a legend, localized weekday and month labels, and a "Show daily counts" list for keyboard and screen reader users (en, sv, pt).
- Quest Agenda panel at the top of the left rail: today's follow-ups, overdue items with days late, interview prep (posting techs and the last retro's note) and the week ahead. Each line opens its contact (en, sv, pt).
- Quest ledger import: "Import list" reads a messy .docx or .md list (or pasted text) through grip-ai-api, shows each application for review with plain warnings and duplicates unchecked, and saves the confirmed ones in one request. Links, emails, phones and salaries are removed before the AI reads the list. Applied and Contacted rows are dated by their application date, so older applications land on their own day in the Activity heatmap (en, sv, pt).

### Database

- `0020_import_stage_date.sql`: adds the nullable `contacts.stage_reached_on` and dates a new contact's first status event by it (noon UTC), falling back to now. Prepares ledger import so old applications keep their real dates in the heatmap and velocity. Apply by hand.

## 2026-09-26

### Added

- Live Demo link at the top of the README.

## 2026-09-25

### Added

- Arch Board scenario "Live + VOD streaming platform" (Content & Media): live and VOD delivery, entitlement and device limits, a kickoff concurrency spike and QoE telemetry.
- Arch Board streaming nodes: Encoder / Transcoder, Packager / Origin, DRM License Server and Ad Insertion (SSAI), each with its own follow-up probes. The palette now has 20 node types.
- Arch Board scenarios "Playback backend-for-frontend", "Player quality telemetry" and "Ad-supported live channel", plus an Ad Server node for client-side ads. 104 scenarios, 21 node types.
- Streaming category in Prep with a "Streaming & Playback" tech: 100 questions on HLS, DASH, ABR, MSE/EME, DRM, ads, live latency and playback quality.
- Kotlin (with coroutines, Compose and Media3) and Swift (with concurrency, SwiftUI, UIKit and AVFoundation) in Languages, 100 questions each. The bank now has 5,440 questions across 54 technologies.
- Arch Board palette tooltips: every node explains what it does, with its cost and maintenance, in a styled hover and focus tooltip (en, sv, pt).
- Mobile Arch Board: long press a palette chip to see what the node does and its cost.

### Changed

- The live-ingest and streaming-platform scenarios accept the new streaming nodes, and the streaming-platform scenario also checks for DRM licensing.
- Arch Board: board edits (add, remove, connect) now share one set of rules across web and mobile; the web board is split into smaller hooks and components.
- Prep: drill loading, answering, advancing, the profile category and readiness now share one module across web and mobile.
- Styling: every mobile font size and every web stylesheet colour, font size and shadow now comes from the shared tokens (new size, shadow and colour tokens so nothing moves); web errors use one ErrorText and ErrorBanner.
- Arch Board: the remove and inspect circles on a node are smaller (24px).

### Fixed

- Mobile Arch Board no longer lets a node connect to itself.
- Mobile Prep: the mock loop no longer awards a speed bonus (it is untimed, as on web), and drill errors are translated.

## 2026-09-24

### Fixed

- Question bank README: updated category counts, validation scope, seed command and the non-transactional reseed warning.

## 2026-09-23

### Added

- Prep (web and mobile): with Auto-next on, the Next button fills left to right after a correct answer, timed to the move, so you can see how long you have to read before the drill goes on. Reduced motion hides the fill.
- Prep (mobile): the Mock loop from web. Next Up offers "or run a mock loop": a 10-question drill on your weakest techs, then a random Arch Board scenario whose evaluation score you report, then a behavioral prompt you rate 1 to 5 after answering out loud. The summary gives one overall score with Quiz, Design and Story beside it and the time taken; a skipped round drops out of the average instead of counting as zero.
- Prep (mobile): readiness, mastery, search and Auto-next, as on web. A readiness card gives one number for the prep plan's techs, else your stack, else what you've practiced, with untested techs counting as 0. Each category pill shows its mastery. A search field above the categories finds a tech by name or one-liner across all of them, and puts the results first while it has text. Prep settings gain Auto-next: after a correct answer a drill moves on by itself after 5 seconds, saved on the device. Web and mobile share the Auto-next timing from `@grip/core/quizPrefs`.
- Profile (mobile): works like web's. Fields save on their own when you leave them, with Saved ✓ or the error beside the field, and the Save button is gone. A Next Up card names the next thing to fill in (the first empty field, then the CV import, then GitHub) and its button does it; a completion bar sits under the rank. Reset progress moved into a Preferences card with the language, and the GitHub, reset and header strings are translated. The languages show their names, since the flag emoji rendered as empty boxes, and a demo profile no longer reads Loading... where the email would be.
- Arch Board (mobile): the talk track can be graded by AI, as on web. Grade my reasoning sits at the foot of the talk track sheet; each section shows its verdict, the quoted evidence and what an interviewer would still ask, followed by the self-rating gap and the hardest follow-up. Grading waits for a saved board and some written text, and a spent free quota names the time it returns. With a grade in hand the board reaches step 5, and its verdict names the thinnest section. Set `EXPO_PUBLIC_AI_URL` to turn it on. Web and mobile share the grading rules from `@grip/core/gradeState`.
- Arch Board (mobile): the five-step journey from web sits above the board in full view: numbered dots with finished steps checked, the current step named and what to do now. From Explain on, its action opens the talk track; the first three steps rely on the toolbar's Evaluate. Closing the evaluation keeps its result until the design changes, as on web, so the steps move past Describe. The Add, Connect and Describe hints read for touch. Web and mobile share the step logic from `@grip/core/workflowState`.
- Stories and Arch Board (mobile): stories link to scenarios and boards as on web. The story form picks the system scenario from the searchable scenario sheet (creating one stays on web). An expanded story shows its scenario, New board for this story until it has one, and its board with the design score and talk track grade; Open takes you to it. On the board, a story row under the scenario picks the story it is designed for from those linked to the scenario, with its STAR on top and stories another board holds shown as taken; the story is saved with the board, and the saved boards tray names it.
- Prep (mobile): scoring matches web. Thunderstorm drills and card quizzes show the 20s clock (amber in the last 10s), and a correct answer inside it earns ×1.5 XP, shown in the feedback and the run's total. Drills and card quizzes deal questions you haven't seen at that level before repeating any; the seen list lives on the device and clears when the signed-in user changes.
- Arch Board (mobile): your own scenarios, made on web, now load and can be picked, so a board built on one opens instead of reporting an unknown scenario. The row of 100 scenario pills is replaced by the current scenario's name; tapping it opens a sheet with a search field over the scenarios grouped by category, where typing a category ("fintech") shows the whole group. The Hide, Show and Zen buttons are translated. Web and mobile now share the scenario list and its search filter from `@grip/core/scenarioCatalog`.
- Docs: `docs/mobile-parity.md` records what the web app has that mobile lacks or does differently, with a suggested order, for when mobile work resumes.
- Arch Board and Story Bank (web): the scenario pickers search. Opening one puts a search field above the 100 scenarios; typing filters by name or by category ("fintech" shows the group), the arrow keys and Enter pick from what's left, and only a real scenario can be chosen. Escape leaves the choice as it was.
- Story Bank (web): a story can link to the Arch Board scenario of the system behind it. The story form picks one of the built-in scenarios or your own, or drafts a new scenario from the story (its title as the name, situation and task as the brief). The story view names the scenario and opens the Arch Board on it. The link is optional, since many behavioral stories have no system behind them, and a story whose custom scenario was deleted says so.
- Arch Board (web): a saved board can belong to the story it was designed for. A story's New board for this story opens a board already tied to it; the rail offers the stories linked to the scenario (or none) and shows the chosen one's STAR, so the situation you will actually talk about sits next to the design and the talk track. The story is part of the board's saved state, and the saved boards list names it.
- Story Bank (web): a story lists the boards designed for it, with each one's design score and talk track grade, and opens any of them on the Arch Board.

### Changed

- Prep (mobile): study cards work like web's. One face shows the tech, its one-liner and the prep notes as quiet reference text, and tapping the card starts the quiz; the flip to a notes-only back face, one tap before the quiz, is gone.
- Demo banner (mobile): one slim line like web's, "Grip is a free demo." with a Continue with GitHub link, instead of a two-row card with a filled button that took about a fifth of a phone screen.
- Prep (web): the quiz hint names the A to D keys only on desktops with a precise pointer and hover. Phones and tablets, where there is no keyboard to press them on, read "Pick the best answer".
- Mobile: cards look like web's. Prep's tech cards, story cards, the XP and accuracy cards, Quest contacts, Profile sections and the rest had a light edge, several tinted with their tech or competency colour; they now use web's dark soft edge (`borderSoft`) and the same lifted card shadow. Next Up keeps its tone edge, as on web, and a contact with a due follow-up keeps its red one. Bottom sheets take the dark edge too.
- Tab bar (mobile): the icons match the web header's (stacked layers for Prep, a page for Stories, the grid for Arch Board, a flag for Quest, a person for Profile), labels are lighter, and on iOS 26 the bar is left to the system's Liquid Glass, a floating capsule with the teal pill on the active tab, instead of being painted over with our own dark background. Older iOS and Android keep the dark blurred bar.
- Arch Board (web): the design checklist reads as a to-do list. A summary line and bar give checks and points earned; what is still missing comes first, biggest points first, with a points pill each, and nothing is red, because a missing check is credit not yet earned. Earned checks fold under Done until everything passes, and design warnings sit in their own amber block.
- Fly Me (web): the page and the guided tour describe the app as it is now: readiness, the Thunderstorm clock, unseen questions first, Auto-next, Mock loop, story links to scenarios and boards, the five-step board with AI grading, scenario search, full screen and share links, Quest's Next Up, velocity and Drill these in Prep, and CV import. Counts are corrected (10 categories, about 50 technologies), the Synced and Offline-ready claims are gone while mobile is on hold, and Free demo joins What stays handled.
- Story Bank and Arch Board (web): a story has one board, the design you tell for it, improved in place rather than redrawn. The story shows that board with its scores and offers New board for this story only until it exists; the board's story picker shows stories another board already holds as taken, and a save that would give a story a second board says so in words.
- Arch Board (web): the scenario brief reads as the brief. It was an untitled card of its own below the scenario picker, dimmed, which made the one paragraph every check, figure and talk track section is judged against look like a caption. It now sits inside the scenario card it belongs to, labelled and marked with an icon, on the deep background behind a soft edge, in full-strength text, with the scenario actions below it rather than above. The left rail carries three cards instead of four.
- Arch Board (web): the Edit arrow row has room above and below it. It wraps under the toolbar buttons at practically every width, where it sat flush against them and against the palette.
- Arch Board (web): Check my math waits until something has been estimated. With both fields empty it graded nothing and nothing appeared, which reads as a broken button rather than an empty answer. It uses the same test as Use in your talk track, so the two buttons agree on what counts as an estimate.
- Arch Board (web): every section heading carries a mnemonic icon. Design checks, design warnings, the interviewer follow-ups and the estimates you work out had none, so in a column of small caps labels there was nothing to find a section by except reading it.
- Arch Board (web): once a board is graded, the Next Up card becomes the verdict for that scenario: how many of the six sections earned credit, which one is thinnest, and the question an interviewer would ask about it. Its action puts the cursor straight in that section. Coverage is stated in words rather than as a second big number, so the design score stays the screen's one headline and the gap between a strong diagram and a thin explanation stays visible instead of being averaged away. A board loaded from storage keeps its score but not its breakdown, and the card says the general thing there.
- Arch Board (web): the journey is a rail of five steps across the top, and a finished step stays on screen marked done rather than disappearing. Add, Connect and Describe came from the drawing already; Explain and Grade are new to the rail, and they were the two nobody reached, because the talk track opened only from a toolbar toggle. Past step three the one main action becomes writing the talk track instead of evaluating the design again.
- Copy (web): removed every em and en dash from the three locale files, 96 strings in all. Clauses joined by a dash are now two sentences, a colon where the dash introduced a definition, and a plain hyphen in ranges.
- Sign-in (web): the subtitle says what Grip does rather than "Follow the Raven", and a line under the form names the AI grading: it reads your talk track section by section and names the question an interviewer would still ask. Nothing a signed-out visitor could see mentioned the one AI feature in the product.
- Footer (web): the promise names the AI grading too, so what makes Grip different is stated on every page rather than only inside the Arch Board.

### Fixed

- Prep (mobile): opening the app no longer celebrates a rank you already had. The rank check started from the empty score shown before yours loaded, so any account past the first rank saw an unlock every launch.
- Question bank: completed the remaining 500-question monitoring review, rewriting distractors and correcting sampling, query semantics, alerting, telemetry privacy, and feature-flag behavior. Together with the earlier category work, all 5,140 questions are preserved and pass the structural, padding, and answer-length checks. These automated checks do not certify factual accuracy. The live database has not been reseeded.
- Prep (mobile): a card quiz can be left before its last question. It had no Exit, so a 30-question run could only be abandoned by switching tabs; it now carries the drill's header, the tier and Exit. The drill's Exit label is translated too.
- Arch Board (mobile): the scenario sheet rides above the keyboard. Typing a search hid the results behind it on a phone.
- Stories and Quest (mobile): after saving an edit, a card could stay invisible and leave a gap in the list. The cards' staggered entrance animation restarted when the list remounted and was cut off by the refetch; the lists now render without it.
- Prep (mobile): the XP bar no longer runs past its new value and pulls back after a correct answer. It animated with a loose spring, which overshoots; it now eases in and stops on the value.
- Arch Board (web): full screen opens framed. It kept the small canvas's zoom and pan, so the board sat off to one side or tiny; entering and leaving full screen now fit the board to the new size.
- Arch Board (web): leaving the New scenario form no longer leaves a second copy of the Next Up action under the steps. The card's visibility watcher stayed on the card that was unmounted, so the board thought Next Up had scrolled away for the rest of the visit.
- Quest (web): the stage-velocity panel is hidden when `VITE_PIPELINE_URL` is unset, instead of showing a red error. The client used to throw "pipeline: not configured" on every load, which surfaced as a failure even though nothing had been asked of the service — an unconfigured optional service now behaves like `VITE_AI_URL` does and simply offers nothing.
- Quest (web): an empty velocity panel says which kind of empty it is. With no contact yet moved between stages it still says to move one; with transitions recorded but no averages returned it points at the pipeline service, because that is no longer something more data would fix.
- Arch Board (web): the next action twinkles continuously rather than pulsing twice and falling silent, and it no longer drags a horizontal scrollbar under the right rail. The pulse scaled the button 4%, which made it wider than the rail it scrolls inside; a box-shadow ring costs no layout. The twinkle is the Drill button's halo, a ring in the accent colour that expands out of the edge and fades. The rail scrolls its overflow and this button is usually its last child, so it is inset by the ring's own width on every side; flush with the rail its halo was cut off at the sides and along the bottom. Its colour comes from the button rather than the board wrapper, which the right rail sits outside of: one unresolvable variable had been voiding the whole box-shadow, and the twinkle never ran at all. Rule 34 in SCREEN-GUIDELINES.md now describes the pair, twinkle and sweep, and says it is never a transform.
- Arch Board (web): the Write the talk track action sits in the right rail, above the sections it opens and where the round used to be, so pressing it reads as the panel arriving rather than something happening in another column. From the Explain step on it appears there and nowhere else: the Next Up card keeps the suggestion and its alternatives but hands over the button, and the sticky rail repeats it only while that place is off screen, which on a sticky desktop rail is rarely and on a phone is as soon as you scroll.
- Arch Board (web): the step's action travels with the sticky rail once the Next Up card scrolls away, so knowing which step you are on is no longer separated from the button for it. Both render the same action, and it appears in one place at a time. It fades in when it arrives, gives two glow pulses like the Drill button does when a category is picked, then carries the ten-second sweep rule 34 allows on the single active main button. All of it is dropped under reduced motion.
- Arch Board (web): pressing Write the talk track again puts the cursor in the next section still to write, rather than re-opening a panel that is already open and leaving a lit button asking to be pressed. The shine stops once the panel is open.
- Arch Board (web): the practice round is opt in and off by default. A clock and a five-phase strip standing in the rail all session did not just take space, it implied you ought to be timing yourself, when most sessions are not timed. It is now one quiet line at the first step, where a 40-minute round still has 40 minutes of work ahead of it, and becomes the full panel only once someone takes it up. While it runs and its panel is scrolled away, the clock joins the step rail, so the session has one progress surface rather than two telling the same story in different words.
- Arch Board (web): the round timer's Start is an outline button. Filled, it read as a second main action competing with the step's own, on a screen that allows one.
- Arch Board (web): the step rail sticks under the header. Evaluating scrolls the results into view, which used to carry the rail off screen at the exact moment the step advanced, so the one piece of feedback saying you had progressed was the piece you could not see. Scroll targets account for the rail's real height, and the canvas zoom control passes beneath it.
- Arch Board (web): the Edit arrow control is the app's own Combobox instead of a native select. A native dropdown is drawn by the operating system and ignores the palette, so this one control opened as a light menu on a dark board. Combobox gained a disabled state to match what the select could already do.
- Arch Board (web): full screen. The control sits beside zoom and takes the whole editor, palette included, because a board you cannot add to is a picture rather than a workspace. Escape leaves, and the button is hidden where the browser has no Fullscreen API.
- Arch Board (web): the Connect step names Shift-drag. Both ways of wiring two nodes were only described on the empty canvas, which disappears as soon as there is anything to connect, so the gesture was invisible exactly when it became useful.
- Copy (web and mobile): removed the remaining em and en dashes from shipped strings, 134 in the shared data plus a handful in the apps. Scenario briefs, design warnings, pushback questions, quiz options and CV errors now use a colon where the dash introduced a definition, a period where it joined two sentences, and a question mark where the first half was itself a question. The dash survives only in code comments and as the typographic placeholder for a value that does not exist yet, such as an unscored board.
- Web: abbreviations explain themselves on hover. DAU, QPS, req/s, GB, TTL, CDN and the rest are underlined where they appear, and hovering, focusing or tapping one spells it out. The term itself is the trigger, so a sentence does not fill with info icons, and a glossary in @grip/core drives it so a term added once is explained everywhere it is rendered through AbbrText. Applied so far to the talk track section hints and the scale brief.
- Arch Board (web): the scale brief hands its numbers to the talk track. "Use in your talk track" drops the givens and your own estimates into the Back-of-envelope section, opens the panel and puts the cursor there. The arithmetic done in the brief is exactly what that section is graded on, so it no longer has to be typed twice. It carries your figure, right or wrong, never the derived answer: writing the correct arithmetic in would buy a grade nobody earned and feed a readiness score that is not true. Pressing it twice does not duplicate the line, and existing writing in the section is kept.
- Arch Board (web): the scale brief reads as one brief again. Five givens wrapped into ragged groups in a narrow rail; they are now aligned rows, and a heading marks where the numbers you are given end and the two you work out begin.
- Arch Board (web): the grade button spins while grading. It takes a few seconds against a free tier model and a label change alone left it looking inert. The spinner is dropped entirely under reduced motion.
- Footer (web): the page menu is hidden when signed out. Every page rendered as a disabled button, so the sign-in screen showed a full menu that did nothing.

### Database

- `0017_story_scenario.sql`: applied; adds the optional `stories.scenario_id` behind the story to scenario link.
- `0018_board_story.sql`: applied; adds the optional `arch_boards.story_id`. Deleting a story keeps its boards and unlinks them.
- `0019_one_board_per_story.sql`: applied; a unique index on `arch_boards.story_id`. Existing duplicates keep their most recently updated board linked; the others are unlinked, not deleted.

## 2026-09-22

### Added

- Arch Board (web): "Grade my reasoning" in the talk-track card sends the six sections, the scenario's derived figures and the design checks to `grip-ai-api`, then shows a per-section verdict (Covered / Thin / Missing), the question an interviewer would still ask, the hardest follow-up, and how far the self-rating sits above the grade. The score lands in `talkGrade`, so Save persists it. Editing any section clears the grade and its verdicts, because a grade belongs to the text that earned it.
- Web: `VITE_AI_URL` points at `grip-ai-api`. Leaving it empty hides the grading action entirely.
  The action needs a saved board and one written section — the service's own floor, not the 40-character bar the coverage meter uses.
- Arch Board (web): a graded section shows the verbatim quote the grade was given for, so credit is visible rather than taken on trust.
- Arch Board (web): the Grade action is disabled while the AI provider is rate limited, naming the time it returns, instead of letting you click into a refusal. The board asks `grip-ai-api` on load; the service answers from its memory of the last 429, so the check costs no provider quota. Google publishes no remaining-quota figure, so this only knows once a request has been refused.

### Changed

- Arch Board (web): only earned verdicts carry colour. `missing` is the absence of credit, not an error, so it no longer renders as a red badge plus a red error icon on every ungraded section; the interviewer's follow-up question is now the prominent line instead of the faintest one. A section holding text but graded `missing` reads "Too thin" rather than contradicting itself.

## 2026-09-20

### Fixed

- Question bank: corrected misleading React Actions, Kubernetes resource/rollout, mobile OTA and reproducible-build answers, and made their distractors less obvious by length.

## 2026-09-19

### Added

- Web: an ⓘ info button (`InfoTip`, a native popover under the icon) holds explanations that used to be printed on screen: readiness scoring, the scale brief's how-to and formulas, the locked email field. It works with tap, click and keyboard, unlike `title` tooltips.
- Prep (web): an Auto-next practice setting (off by default). After a correct answer the next question opens by itself after 5s (Next skips the wait); wrong answers wait for Next. Saved per browser, and shown on the folded Practice settings row.
- Prep (web): Thunderstorm questions have a 20s clock, shown as a teal pill that turns amber and pulses in the last 10s. A correct answer in time earns ×1.5 XP (+60 instead of +40), shown on the answer's +XP pill and in the session total. When time runs out it says "Time's up" and the question stays open at normal XP. Mock loop stays untimed. The rules live in `@grip/core/difficulty` for mobile to reuse.
- Question bank: every subject has 100 questions (25 per level), up from 20. React and TypeScript stay at 120. Total 1,200 → 5,140. The database only gets them after reseeding (`scripts/seed-questions.mjs`, run by hand with the service-role key).
- New subject: Engineering Principles (category Engineering 🛠️), with prep notes, a link and 100 questions in `data/questions/engineering.json`.

### Changed

- Prep (web): questions are drawn as a deck. Drills and card quizzes show questions you haven't seen at that level before repeating any, then start a new round. Seen questions are kept per browser (`grip.seenQuestions`) and cleared when a different user signs in. The picking rule is `drawFromDeck` in `@grip/core/quiz`.
- README: rewritten to a third of its length, with fresh screenshots. `scripts/capture-web-screenshots.mjs` now serves `scripts/screenshot-fixtures.mjs` for auth, PostgREST and pipeline calls, so every captured screen shows sample data instead of empty states, and the Arch Board shot loads a scored board. Still no real account and no writes.
- Question validation: prompts must be unique per tech across all levels, ignoring case and punctuation, and a question's four options must all differ.

- Web: the demo bar is one slim line (31px, was 85px on phones) shown to everyone, since the whole app is a free demo: "Grip is a free demo." Anonymous visitors also get a small "Continue with GitHub" link. The "progress is kept for 7 days" line is gone. Mobile's banner is unchanged.
- Sign-in (web): the subtitle is "Follow the Raven" (translated in pt and sv); the product promise stays in `brand.promise` for other uses.
- Footer (web): the promise line uses the quieter card text color.
- Web: far fewer instruction lines, especially on phones. Removed hints that repeat what the layout or a nearby number already says (Practice map, Prep steps, Signal, Difficulty, pool hint, Stories and Quest subtitles, Quest's "Click a stage", Profile's private-account note and Account subtitle). Visible hint sentences at 375px: Prep 13 → 2, Profile 6 → 2, Stories 3 → 2. Difficulty blurbs are hidden on phones, and the Auto-next hint is one short line.
- Web: descriptions inside cards use one quieter text color (`quietText`, textDim at 80%): Prep notes, Next Up lines and the Fly Me texts.
- Fly Me (web): on phones each feature card folds its bullets behind "What's inside", so the page is five short cards instead of 26 bullets.
- Profile (web): the autosave note is a small ✓ "Autosaves" badge, and the email field shows a 🔒 with its explanation behind ⓘ.
- Web: one switch design across the app. Profile's `Switch` moved to `components/Switch.tsx` and now also drives Auto-next, replacing the separate checkbox switch.
- Cleanup: removed the unused `MiniButton` and `FormInput` components and a committed Vite cache (`.vite/`, now ignored); DESIGN.md points at the style helpers actually used.
- Web: every button, select and disclosure is at least 24px tall (a global floor in `index.html`), so small outline buttons like Edit, Delete and Drill are easier to tap. The Auto-next switch is 40×24 and the quiz-size slider has a 24px hit area.
- `SCREEN-GUIDELINES.md`: rule 34 allows the Thunderstorm clock pulse, new rule 45 sets the 24px tap minimum, and the done-checklist adds phone, landscape and tablet checks with touch.
- Web: tablets (821–1180px) get two columns instead of one: the left rail (navigation and filters) stays beside the content, and the right rail (progress, insights, settings) sits under it. Phones (820px and below) keep one column.
- Web: on screens wider than 1920px the page centers at 1920px (new `layout.webPageMax` token). Header, banner and footer backgrounds still run edge to edge; the logo, rails and footer share one left edge, and Poe follows it.
- Prep (web): Practice settings is one card. Difficulty, questions per card and Auto-next open as sections inside it, split by dividers under small caps headings, instead of three separate cards. Auto-next is a switch.
- Prep (web): study cards no longer flip. One face shows the tech, its prep notes (smaller and dimmer, as quiet reference text) and the quiz button, which appears on hover or keyboard focus and is always shown on touch screens. Copy that said "flip a card" now says to read the notes.
- Tokens: removed `layout.prepCardMinHeight`; cards size to their notes.
- Web: focused views (Prep sessions, Stories and Quest detail/forms, the Arch Board scenario creator) are centered in the main column on wide screens instead of sitting at its left edge. They share one `workspaceFocusStyle`.

### Fixed

- `scripts/seed-questions.mjs` uses only `SUPABASE_SERVICE_ROLE_KEY`. It used to prefer `VITE_SUPABASE_ANON_KEY` when that was set, and RLS then blocks the deletes, so a re-seed would duplicate questions.
- Web: signing in always opens Prep (email, password, demo and GitHub). Before, it reopened the page you signed out from or the last stored page. Reloading while signed in keeps the current page, and returning from linking GitHub still opens Profile.
- Web: on tall screens (iPad Pro, Zenbook Fold, any page shorter than the screen) the footer sits at the bottom of the screen instead of starting below the fold. Pages no longer add their own full-screen minimum height on top of the header and demo bar; the page area between header and footer fills the space instead.
- Web: the "or" before secondary links outside Next Up (e.g. the Fly Me hero) rendered as large bright text; it now matches the small faint Next Up style.
- Web: smooth scrolling (Prep sessions, Stories, Quest, Arch Board results) jumps instead when reduced motion is on (rule 35).
- Web: on touch screens a tapped card no longer stays stuck in its hover lift; the lift is kept for real hover and keyboard focus.
- Arch Board (web): on touch screens the empty-canvas hint says to tap handles and pinch, instead of Shift-drag and Ctrl/⌘ + scroll.
- Footer (web): on phones the promise text wraps under the logo instead of squeezing into a narrow column beside it.
- Web: the header fits one row down to ~710px wide (tagline hidden and tabs tightened below 940px, which also covers the longer Swedish labels), so tablets and phones in landscape no longer get a 123px two-row header. On screens 500px tall or less it scrolls away instead of staying pinned; its styles that need media queries moved to `App.module.css`.
- Arch Board (web): in phone landscape the canvas no longer fills the whole screen. It is capped below the visible height, so there is always page outside it to swipe (the canvas itself captures swipes to pan).
- Web: on touch screens (e.g. iPad Pro in landscape) the side rails scroll with the page instead of sticking with their own hidden scroll area, which swallowed swipes and kept tall rails (Practice settings open) and the footer out of reach. Mouse users keep sticky rails.
- Prep (web): on phones, tablets, touch screens and short landscape screens Poe no longer sits on top of content (rule 7). He stays out of view while idle and appears only while reacting to an answer.
- Prep (web): the chosen difficulty survives a page refresh (it was reset to Tailwind).
- Web: on phones, the header nav no longer hides its first tabs (Prep, Stories, Arch Board) off the left edge where they couldn't be scrolled to.
- Web: switching pages (header, footer, cross-page links) starts the new page at its top instead of the previous page's scroll offset. Back/Forward still returns to where you were.
- Web: scrolled-to content (Arch Board results, Prep drill sessions) clears the sticky header at every width, including when the header wraps to two rows.
- Stories (web): on narrow screens a story's title takes its own line instead of being squeezed into a sliver that overlapped the Open/Edit/Delete buttons.
- Prep (web): the quiz/drill header no longer breaks on narrow screens. The difficulty pill sits at the right edge, and on narrow cards the XP, clock and Exit get their own row, spread across the card. The "1 / 10" counter is gone; the progress bar under the header shows (and announces) the question position.
- Web: full-height layouts use `svh`, so they fit the visible area on mobile browsers with a collapsing URL bar.

## 2026-09-18

### Added

- Tokens: `borderSoft`, `shadow.card` / `shadow.cardHover`, `accentDeep` and `font.size.hero`.
- `SCREEN-GUIDELINES.md`: the playbook and checklist for bringing other screens up to Prep's standard.
- Prep (web): selecting a category pulses its Drill button, then a shine sweeps across it every 10s.
- Prep (web): a readiness score for your prep plan, stack or practiced techs heads the right rail. It counts up on open over a deep-teal gradient bar, then blinks when it lands.
- Prep (web): the XP bar matches the readiness bar. The accuracy chart draws in, and Signal percentages count up.
- Prep (web): changing difficulty re-deals the cards, and difficulty or quiz-size changes show a short confirmation.
- Prep (web): correct answers pop a +XP pill off the chosen option, and sessions show a running XP total.

### Changed

- Quest (web): Next Up, stage filters and an applications-per-week headline. Contacts, edits and retros open in a focused view, so cards no longer expand.
- Profile (web): sections in the left rail, fields that save as you leave them, and a completion headline. Reset moved to Preferences.
- Arch Board (web): three columns (scenario, canvas, status). The canvas is visible without scrolling, Next Up coaches each step with Evaluate as the one action, the design score heads the right rail, and inspectors open beside the canvas.
- Arch Board (web): on an empty canvas, Next Up offers to continue your latest saved board (such as the demo sample).
- Web: Tutorial is now "Fly Me" with a wing icon, placed before Profile.
- Stories (web): Next Up points to the first uncovered competency, stories open in a focused view, and a coverage headline heads the right rail.
- Fly Me (web): the "Start with Prep" button became a Next Up link, and the page follows the card and type standards.
- Web: every font size uses `font.size` tokens. The active nav pill is more translucent, with 8px corners.
- Web: Sign-in, Arch Board panels, Quest insights and story matching are translated (pt/sv). Core funnel insights now carry stable ids.
- Prep (web): both rails lock during a session through the shared rail lock.
- Web: a raven silhouette of Poe, with his collar and medallion, is the favicon and the logo in the header, footer, sign-in and shared boards. The logo shines and blinks every 9s, and sign-in has a darker background.
- CI: lint fails on any warning.
- Footer (web): one benefit-led line instead of tech details, and the link group is titled "Explore".
- Sign-in (web): the Cloudflare check runs invisibly and only shows when it needs a click, in the app language.
- Web: form fields follow one standard (40px, 8px corners, focus ring), and the hover lift is gentler.
- Prep (web): a card's quiz opens as a focused session, so cards no longer grow.
- Prep (web): Next Up is the one place to start sessions, and Mock loop moved into it. Rail drill buttons are removed, and category Drill buttons show on the active row or on hover.
- Web: every screen uses dark soft borders and lifted cards. Light edges are kept only for informative containers, and cards with actions lift on hover.
- Web + mobile: ranks are now a raven ladder (Hatchling → Nevermore) and difficulty tiers are weather (Clear Skies → Thunderstorm).
- Web: the header swaps its diagonal-line texture for a teal glow and bottom line. The menu uses the card border and shadow, and the active tab slides between items.
- Prep (web): all font sizes come from the `font.size` tokens.
- Prep (web): category percentages show mastery (average accuracy, untested techs count as 0) instead of techs touched.
- Prep (web): the right rail shows progress first and signal next, with practice settings folded at the bottom. The duplicate Review due panel is removed.

### Fixed

- Profile (web): guests saw "Loading…" under their name forever.
- Profile (web): every field is labelled and typed for autofill, placeholders are real examples at AA contrast, and Enter saves without losing focus.
- Web (Vercel): refreshing any page other than `/` returned 404. The app now serves `index.html` for every path.
- Web: Inter weight 800 now loads (heavy weights were rendering at 700).
- Icons (web + mobile): 12 icons that drew filled boxes instead of strokes (×, ✦ logo, arrows, check, `</>` and more).
- Prep: 6 of 9 categories showed the fallback icon because of a name mismatch.
- Web + mobile: the Quest tab showed the fallback ✦; it now has a flag icon.
- Prep (web): the category Drill pill no longer animates during a quiz or drill.
- Prep (web): Poe no longer covers the last category; the left rail ends above it.
- Prep (web): a running session can no longer be replaced by a stray click. The left rail locks until you finish or exit.
- Prep (web): loading and errors show on the button you clicked, not in a distant panel.

## 2026-09-17

Commits `9144050`…`5474c93` · 171 files changed (+2891 / −908)

### Added

- **Demo mode:** **Try the demo** on both sign-in screens, backed by Supabase anonymous sign-in, with a banner offering **Sign in with GitHub to keep it** (links GitHub to the same account, so progress survives).
- **Demo sample data:** migration `0016_demo_accounts.sql` seeds each guest with 2 contacts plus status history, a retro, 2 stories, an architecture board and answer history, so no screen looks empty. Public board sharing is blocked for guests, in the database and the UI.
- **CAPTCHA:** Cloudflare Turnstile on the anonymous, password and sign-up flows — a script widget on web, the same widget in a WebView on mobile (`react-native-webview`). An empty site key disables it.
- **Next up card** on Prep (both apps): one suggested action chosen by `pickNextUp` in core (due reviews → prep plan → weakest techs, or a warm-up for new users), with the other options as links beneath.
- **Answer feedback:** a hint before answering, feedback naming the right answer, a per-question progress bar, press/pop/shake motion, a floating "+XP" chip, and haptics on mobile (`expo-haptics`).
- **Keyboard shortcuts in every quiz** (web): letter keys answer wherever you are, scoped to the focused quiz, and focus moves to Next so Enter continues.
- **Card run summaries:** a card quiz ends with its score and XP before flipping back; a perfect card triggers the celebration overlay; card fronts show an accuracy bar.
- **Drill results:** the score counts up, **Drill again** repeats the same techs and tier, and encouraging copy appears below 50%. The XP bar flashes when XP lands.
- **Arch Board zoom and pan:** trackpad pinch and Ctrl/⌘+wheel zoom at the cursor, wheel and empty-space drag pan, two-finger pinch, **− / % / + / Fit** controls and keyboard control on web; fitted boards, screen-sized zoom and **− / % / +** on mobile.
- **Remove** in the mobile board node inspector, since a node's own ✕ is tiny when zoomed out.

### Changed

- Renamed the shared package `@tech-refresh/core` → `@grip/core` (imports, `package.json` files, root test script, mobile Jest mapping, lockfile) and cleared the remaining "tech-refresh" mentions from docs and brand assets.
- Prep layout: the plan and review banners folded into the Next up card; web's header hint became "Pick a card → read the notes → take the quiz" and its right panel lost the duplicate review button; mobile's stats bar is progress-only, difficulty and quiz size collapse into one row, and the accuracy chart moved below the cards.
- Web: the two copies of the answer list (cards and drills) became one `QuizQuestion` component; the Arch Board viewport maths moved into a separate tested module.
- Mobile: the board toolbar wraps so Saved, Save, Clear and Evaluate stay reachable; the design timer gained a labelled Start / Pause / Resume button.

### Fixed

- **Mobile crash:** pausing the design timer crashed the screen (an icon set `transform` to `undefined` when swapping in place).
- **Board nodes on iOS:** remove and connect buttons sat outside the node's bounds and ignored taps, and were invisible to VoiceOver because the node was a single accessibility element.
- **Quest crash:** opening Arch Board then Quest crashed for anyone with a saved board — both tabs shared one cache entry for different shapes of board data.
- **Silent evaluation:** "Evaluate design" appeared to do nothing on web because results render below the canvas; the page now scrolls to them.
- **Dead "Drill again":** it did nothing after a category drill, which never recorded what to repeat.
- **EAS builds:** the project ID had been replaced with a placeholder ("Invalid UUID appId"); also set `appVersionSource` and pointed app icons at files that exist.
- Labelled focus mode's close button and dropped keyboard hints from accessibility labels (web keeps them in tooltips).

### Database

- `0014_atomic_scores.sql` — applied; it was missing, so every answer silently failed to record.
- `0015_board_talk_grade.sql` — applied; it was missing, so every board save failed.
- `0016_demo_accounts.sql` — new (demo seeding, sharing block).
- Supabase settings: anonymous sign-ins, manual identity linking and CAPTCHA enabled; cleanup cron job scheduled for stale guest accounts.

### Known gaps

- Pinch-to-zoom was only exercised synthetically; it needs a check on real hardware.
- Turnstile still uses Cloudflare's always-pass test keys, so it does not stop bots yet. Swap in a real widget once a production domain exists (and set `EXPO_PUBLIC_TURNSTILE_BASE_URL` on mobile).
- Exported Grip app icons do not exist yet; `app.json` points at the Expo placeholders.
- The mobile icon set draws diagonal strokes as rotated squares, so small ✕ and ✓ marks look diamond-shaped (web renders them the same way).
