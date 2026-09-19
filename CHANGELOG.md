# Changelog

Notable changes to Grip (web, mobile and the Supabase schema), newest first.
Dates are the day the work landed on `main`. Database migrations are listed
because they have to be applied by hand.

## 2026-09-19

### Added

- Web: an ⓘ info button (`InfoTip`, a native popover under the icon) holds explanations that used to be printed on screen: readiness scoring, the scale brief's how-to and formulas, the locked email field. It works with tap, click and keyboard, unlike `title` tooltips.
- Prep (web): an Auto-next practice setting (off by default). After a correct answer the next question opens by itself after 5s (Next skips the wait); wrong answers wait for Next. Saved per browser, and shown on the folded Practice settings row.
- Prep (web): Thunderstorm questions have a 20s clock, shown as a teal pill that turns amber and pulses in the last 10s. A correct answer in time earns ×1.5 XP (+60 instead of +40), shown on the answer's +XP pill and in the session total. When time runs out it says "Time's up" and the question stays open at normal XP. Mock loop stays untimed. The rules live in `@grip/core/difficulty` for mobile to reuse.

### Changed

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
