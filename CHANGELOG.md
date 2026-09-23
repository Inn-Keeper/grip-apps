# Changelog

Notable changes to Grip (web, mobile and the Supabase schema), newest first.
Dates are the day the work landed on `main`. Database migrations are listed
because they have to be applied by hand.

## 2026-09-23

### Changed

- Arch Board (web): once a board is graded, the Next Up card becomes the verdict for that scenario: how many of the six sections earned credit, which one is thinnest, and the question an interviewer would ask about it. Its action puts the cursor straight in that section. Coverage is stated in words rather than as a second big number, so the design score stays the screen's one headline and the gap between a strong diagram and a thin explanation stays visible instead of being averaged away. A board loaded from storage keeps its score but not its breakdown, and the card says the general thing there.
- Arch Board (web): the journey is a rail of five steps across the top, and a finished step stays on screen marked done rather than disappearing. Add, Connect and Describe came from the drawing already; Explain and Grade are new to the rail, and they were the two nobody reached, because the talk track opened only from a toolbar toggle. Past step three the one main action becomes writing the talk track instead of evaluating the design again.
- Copy (web): removed every em and en dash from the three locale files, 96 strings in all. Clauses joined by a dash are now two sentences, a colon where the dash introduced a definition, and a plain hyphen in ranges.
- Sign-in (web): the subtitle says what Grip does rather than "Follow the Raven", and a line under the form names the AI grading: it reads your talk track section by section and names the question an interviewer would still ask. Nothing a signed-out visitor could see mentioned the one AI feature in the product.
- Footer (web): the promise names the AI grading too, so what makes Grip different is stated on every page rather than only inside the Arch Board.

### Fixed

- Quest (web): the stage-velocity panel is hidden when `VITE_PIPELINE_URL` is unset, instead of showing a red error. The client used to throw "pipeline: not configured" on every load, which surfaced as a failure even though nothing had been asked of the service — an unconfigured optional service now behaves like `VITE_AI_URL` does and simply offers nothing.
- Quest (web): an empty velocity panel says which kind of empty it is. With no contact yet moved between stages it still says to move one; with transitions recorded but no averages returned it points at the pipeline service, because that is no longer something more data would fix.
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

## 2026-09-22

### Added

- Arch Board (web): "Grade my reasoning" in the talk-track card sends the six sections, the scenario's derived figures and the design checks to `grip-ai-api`, then shows a per-section verdict (Covered / Thin / Missing), the question an interviewer would still ask, the hardest follow-up, and how far the self-rating sits above the grade. The score lands in `talkGrade`, so Save persists it. Editing any section clears the grade and its verdicts, because a grade belongs to the text that earned it.
- Web: `VITE_AI_URL` points at `grip-ai-api`. Leaving it empty hides the grading action entirely.
  The action needs a saved board and one written section — the service's own floor, not the 40-character bar the coverage meter uses.
- Arch Board (web): a graded section shows the verbatim quote the grade was given for, so credit is visible rather than taken on trust.
- Arch Board (web): the Grade action is disabled while the AI provider is rate limited, naming the time it returns, instead of letting you click into a refusal. The board asks `grip-ai-api` on load; the service answers from its memory of the last 429, so the check costs no provider quota. Google publishes no remaining-quota figure, so this only knows once a request has been refused.

### Changed

- Arch Board (web): only earned verdicts carry colour. `missing` is the absence of credit, not an error, so it no longer renders as a red badge plus a red error icon on every ungraded section; the interviewer's follow-up question is now the prominent line instead of the faintest one. A section holding text but graded `missing` reads "Too thin" rather than contradicting itself.

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
