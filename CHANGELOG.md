# Changelog

Notable changes to Grip (web, mobile and the Supabase schema), newest first.
Dates are the day the work landed on `main`. Database migrations are listed
because they have to be applied by hand.

## 2026-09-18

### Added

- Tokens: `borderSoft`, `shadow.card` / `shadow.cardHover`, `accentDeep` and `font.size.hero`.
- Prep (web): selecting a category pulses its Drill button, then a shine sweeps across it every 10s.
- Prep (web): a readiness score for your prep plan, stack or practiced techs heads the right rail. It counts up on open over a deep-teal gradient bar, then blinks when it lands.
- Prep (web): the XP bar matches the readiness bar. The accuracy chart draws in, and Signal percentages count up.
- Prep (web): changing difficulty re-deals the cards, and difficulty or quiz-size changes show a short confirmation.
- Prep (web): correct answers pop a +XP pill off the chosen option, and sessions show a running XP total.

### Changed

- Prep (web): a card's quiz opens as a focused session, so cards no longer grow.
- Prep (web): Next Up is the one place to start sessions, and Mock loop moved into it. Rail drill buttons are removed, and category Drill buttons show on the active row or on hover.
- Web: every screen uses dark soft borders and lifted cards. Light edges are kept only for informative containers, and cards with actions lift on hover.
- Web + mobile: ranks are now a raven ladder (Hatchling → Nevermore) and difficulty tiers are weather (Clear Skies → Thunderstorm).
- Web: the header swaps its diagonal-line texture for a teal glow and bottom line. The menu uses the card border and shadow, and the active tab slides between items.
- Prep (web): all font sizes come from the `font.size` tokens.
- Prep (web): category percentages show mastery (average accuracy, untested techs count as 0) instead of techs touched.
- Prep (web): the right rail shows progress first and signal next, with practice settings folded at the bottom. The duplicate Review due panel is removed.

### Fixed

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
