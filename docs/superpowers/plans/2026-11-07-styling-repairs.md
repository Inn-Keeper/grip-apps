# Styling repairs implementation plan

Goal: repair the seven findings from the full styling audit approved for implementation in this conversation.

Approach: keep CSS Modules and inline styles. Gate motion by preference, brighten the existing shared caption token, let forms reflow intrinsically, and map web font sizes to rem without changing native numeric tokens. No production dependencies, commits, platform-policy changes or unrelated cleanup.

- [x] Motion: repair tour cascade and Driver options; give Switch a preference-gated module; make BrandMark still. Check the real seven-step tour and switch with reduced motion and normal motion.
- [x] Contrast: add a failing contrast regression for informational text on the elevation ladder, then brighten textFaint to clear 4.5:1 on surfaceHi. Update DESIGN.md and fallback scrollbar color.
- [x] Layout: let contact/story rows reflow at readable field widths; allow Profile's 260px minimum to shrink. Check 320/375px and live resizing with form values intact.
- [x] Typography: introduce a web token adapter preserving token keys and rem sizes, route web imports through it, and emit rem CSS variables. Keep core/native numeric font sizes. Check default sizing and 200% root text size across screens, especially forms and overlays.
- [x] Delivery: update today's changelog, run pnpm run ci, repeat focused browser checks and inspect screenshots. Record limits and final results here.

Acceptance: no running tour/switch animations under reduced motion; no repeating brand animation; readable caption contrast; complete phone dates/labels; contained Profile fields; web fonts double with a doubled root size. Preserve keyboard control, focus rings, wider layouts and native token types.

Manual follow-up: native iOS/Android rendering and Safari remain environment-limited; no claims of native-device acceptance. Firefox authenticated coverage requires separate automation. Full browser-version policy is unchanged.


## Final verification

- `pnpm run ci` passed on the final source: lint, 446 core tests, 23 mobile tests, 37 web tests, the ESLint-rule test, all three typechecks and production build. The first sandbox attempt could not access Watchman; the successful run used local socket access. Watchman's existing recrawl warning and Vite's large-JavaScript-chunk warning remain.
- `git diff --check` passed. No commit or dependency changes.
- Chrome 157 fixture-backed checks: all six primary screens at 320×700, 375×812, 740×375, 1024×768, 1280×900 and 1680×1000, at both 16px and 32px root text sizes (72 measurements). Document width was checked against the requested width, so mobile viewport expansion could not mask overflow. All matched.
- Reduced motion: all seven real tour steps had no running animations; switch/thumb transition durations were 0s. Normal-motion switch transitions remain enabled. Header/footer brand marks have no animation in either preference.
- At 375px, contact fields measure 285px wide. At doubled text size, a date uses about 139px plus 24px padding and fits. A name draft survived live portrait/landscape resizing. Story competency now has its own row. At 320px Profile fields remain inside their card (input right 275px, card right 296px).
- Profile inputs and import-dialog text both change from 13px to 26px when the root size doubles. Default native font tokens remain unchanged. Caption contrast clears 4.5:1 across the elevation ladder, guarded by a regression test observed failing before the token change and passing afterward.
- Fresh read-only review caught and resolved the import dialog's old px suffix on rem tokens; final follow-up review found no concrete regressions.
- Screenshots inspected: repaired contact/story forms, Profile at 320px and 200% root size. Temporary browser evidence/scripts live under `/tmp/grip-style-audit/`; the numerical results above do not depend on keeping them.

Files changed: shared core color token and its contrast test; web font-token adapter and its component consumers; token CSS-variable emission; Switch/BrandMark/tour styles and components; contact/story form rows and Profile grid; compact row wrapping in Prep/Quest/Arch Board/metrics/cards; import dialog font values; DESIGN.md, styling guide and today's CHANGELOG.md entry.

Additional reflow needed by the font change: metric headings, Quest heading/actions, Arch Board arrow picker and compact Prep/story rows now wrap or shrink rather than force a wider page. These changes preserve the existing controls and data flow.

Limits: Safari automation remains disabled; authenticated Firefox, native device/simulator rendering, OS text scaling and real browser/text zoom were not run. The 200% probe changes root font size, not browser zoom. Native color changes still need visual inspection on a device. No live model calls or backend writes were used.
