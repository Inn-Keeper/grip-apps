# Light mode plan

Planned on 2026-11-08 by reading the code, not by running the app. Grip ships dark only today. This adds a light
theme on web and mobile without changing the default.

## Decisions

| Question | Decision |
| --- | --- |
| Default theme | Dark. Nothing changes for anyone who never opens the setting. |
| Setting | Profile offers Dark, Light and System, on web and mobile. System follows the OS. |
| Where the choice lives | On the device: `localStorage` on web, AsyncStorage on mobile. No account sync, no migration. |
| Order | Web first (phases 1 to 3), then mobile (phases 4 and 5). |

## Starting point

- `packages/core/src/tokens.js` holds one palette (`colors`), all 6-digit hex. Web reads it in about 930 places, mobile in about 720.
- Web already mirrors tokens as CSS variables (`apps/web/src/lib/tokenVars.ts`, `--c-*`), and 84 of 98 web files import `colors` through `apps/web/src/lib/tokens`, not core.
- Translucent colors are built by appending alpha to hex (`${colors.x}60`): 63 sites on web, 39 on mobile. This breaks as soon as a color is a CSS variable.
- Mobile re-exports the hex palette (`apps/mobile/src/theme.ts`), `app.json` pins `userInterfaceStyle: "dark"`, and 11 files build styles at module load.

## Approach

### Core

- Add `palettes = { dark, light }` with identical keys, plus per-scheme `tints` and `shadow`.
- Token tests: both palettes share keys, and both pass the caption contrast check across the elevation ladder.
- Add `alpha(color, opacity)`: appends hex alpha to a hex color, returns `color-mix(in srgb, <color> N%, transparent)` for a CSS variable. Both apps use it.
- Token names stay. `*Bright` means "readable on the plane", so in light those values go darker. DESIGN.md says so. Renaming would touch about 1,600 references for no visual gain.

### Web: switch in CSS, no React re-render

- `apps/web/src/lib/tokens` exports `colors` as `var(--c-<name>)` strings. Inline styles keep working as they are.
- `tokenVars` writes both palettes once, under `:root[data-theme="dark"]` and `:root[data-theme="light"]`. Switching sets the attribute.
- A small script in `index.html` sets `data-theme` before first paint (stored choice, else dark; System resolves through `matchMedia`) so there is no flash. It also replaces the hardcoded body background and `theme-color`.
- System mode listens for `prefers-color-scheme` changes.
- Sweep what variables can't reach: 14 direct core imports, 63 alpha concatenations, 16 SVG `fill`/`stroke`/`stopColor` attributes (move into `style`), about 45 raw hex and rgba values in CSS and TSX.

### Mobile: a hook, since React Native has no CSS variables

- `ThemeProvider` combines the stored choice with `useColorScheme()` and exposes `useColors()`. Default is dark.
- The 60 files that use `colors` call `useColors()`. The 11 module-level style objects move inside components.
- `app.json` becomes `"automatic"` so System can work; the provider still forces dark by default.
- Status bar, native tab bar, navigation theme and `expo-system-ui` root background follow the theme.

### Lint

- New rule in `eslint-rules/` that bans `${colors.x}NN` so alpha concatenation can't come back.

## Phases

| Phase | Scope | Visible change |
| --- | --- | --- |
| 1. Palette | `palettes.light`, `alpha()`, tests, DESIGN.md, SCREEN-GUIDELINES.md, BRAND.md | None |
| 2. Web plumbing | Variable-backed `colors`, alpha sweep, SVG attributes, raw colors, lint rule | None. Check with before and after screenshots. |
| 3. Web switch | Pre-paint script, Profile setting, screen-by-screen light review with tuning | Light available on web |
| 4. Mobile plumbing | `ThemeProvider`, `useColors()`, migrate 60 files, module-level styles | None |
| 5. Mobile switch | `"automatic"`, native chrome, Profile setting, visual review | Light available on mobile |

Plan each phase before starting it.

## Phase notes

- Phase 1 done 2026-11-08.
- Phase 2 done 2026-11-08. Sign-in and the share page match the pre-phase-2 build pixel for pixel, except a 2/255 drift from rounding alpha suffixes to two-decimal opacities.
- Phase 3 done 2026-11-08. Light borders raised after review (`borderSoft #D5DBE4`, `border #C3CAD6`). Data colors use `dataShade` 0.5, the lowest value where every one clears 4.5:1 on light planes. Raw black shadows and white glints were left: shadows read fine on light planes and glints vanish harmlessly.
- Phase 4 done 2026-11-08. The React Compiler is on, so mobile can't use web's in-place data color rewrite (memoized components would keep stale colors). Data colors go through `useTheme().dataColor()` at the render site instead. `STATUS_STYLES` (contact statuses) was a missed data map; now covered on both apps and in the core contrast test.
- Phase 5 done 2026-11-08, not run on a device or simulator. `app.json` is `"automatic"` and the provider forces the chosen scheme with `Appearance.setColorScheme` (`"unspecified"` for System). A stored Light choice loads from AsyncStorage after the first frame, so light users may see one dark frame at launch. The root view background (expo-system-ui) was left out; every screen paints its own.
- Carried over from phase 2 (now resolved unless noted):
  - Resolved: core data colors are fixed dark hex and did not follow the theme: `TYPE_COLORS` (arch.js), difficulty tiers (`colors.deco*` in difficulty.js) and other prep data colors.
  - Left as is: raw black shadows and white top glints remain in about 20 places (tour.css, Switch, Combobox, PoeAssistant glows, Metric and ArchBoard shine). Tune them during the light review.
  - Only Chromium was available to test; WebKit and Firefox are unchecked.
  - Open: signed-in screens were not screenshotted in either theme (doing so would create an anonymous user in Supabase). Review them in light by hand.

## Proposed light palette

A starting point, tuned during phase 3.

| Token | Dark | Light |
| --- | --- | --- |
| `bgVoid` / `bgDeep` / `bg` | `#07090D` / `#10131A` / `#14171F` | `#E4E8EF` / `#EEF1F5` / `#F5F7FA` |
| `well` / `surface` / `surfaceHi` | `#191D27` / `#1E222D` / `#272C3A` | `#EDF0F5` / `#FFFFFF` / `#F1F4F8` |
| `borderSoft` / `border` / `borderStrong` / `borderDeep` | `#262A36` / `#353C4D` / `#4A5268` / `#141926` | `#D5DBE4` / `#C3CAD6` / `#A9B2C2` / `#E2E6ED` |
| `textBright` / `text` | `#F4F7FC` / `#E8ECF4` | `#0B0F17` / `#1C2230` |
| `textDim` / `textFaint` | `#9AA5BC` / `#8B96AC` | `#4B5568` / `#5D6779` |
| `textHighlight` / `textHighlightDim` | `#0de6c9` / `#7cb1ab` | `#0F766E` / `#115E59` |
| `accent` / `onAccent` | `#14B8A6` / `#0F141C` | Same. Brand teal fill with dark text. |
| `accentBright` / `accentDeep` | `#2DD4BF` / `#0F766E` | `#0F766E` / `#0D9488` |
| `successBright` / `dangerBright` / `warningBright` | `#86EFAC` / `#FCA5A5` / `#FBBF24` | `#15803D` / `#B91C1C` / `#B45309` |
| `success` / `danger` / `warning` | 500 weights | 600 weights: `#16A34A` / `#DC2626` / `#D97706` |
| `deco1` to `deco7` | 400 weights | 600 weights, starting with teal `#0D9488` |
| `tints.modalScrim` | `#00000090` | `#0F172A66` |
| `shadow.card` | Inset top highlight plus deep drop | Soft drop only, no inset highlight |

## Out of scope

- Splash, app icon and OG image stay dark. They are brand moments.
- Poe PNGs are checked on light planes, not redrawn unless they read badly.
- Account-synced theme preference.

## Risks

- Visuals tuned for dark: Poe's glow, the board canvas, the dark-to-bright teal progress gradient, hover states that step up the ladder. Expect tuning in phase 3.
- Phase 4 touches every mobile screen. Mechanical, but large.
