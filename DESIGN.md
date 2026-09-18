# Design Guidelines - Grip

The single source of truth for the product's visual identity. Token values live in
[`packages/core/src/tokens.js`](packages/core/src/tokens.js) and are consumed by both apps
(mobile via `@/theme`, web via `@grip/core/tokens`). This document explains the
rules behind them.

## Identity

Focused, calm, dark-first. The product is a training room for the job hunt: it should feel
like a place to do deep work, with bursts of celebration when progress lands. **Teal is the
brand** — it means focus, progress, and "your move". The grade is dark but never murky:
every layer of the UI sits one visible luminance step above the layer below it.

Tone: serious tool, playful register. Gamified naming (Quest, XP, ranks, drills), emoji as
iconography, spring physics everywhere — but information density and contrast come first.

## Color

### Elevation ladder

Five greys, each a visible step up. Pick by *structural role*, not by taste:

| Token | Hex | Role |
| --- | --- | --- |
| `bgDeep` | `#10131A` | Sunken planes: web header, board canvas |
| `bg` | `#14171F` | Page background |
| `well` | `#191D27` | Inset elements **on a surface**: inputs, progress tracks, nested sub-cards |
| `surface` | `#1E222D` | Cards, sheets, pills at rest |
| `surfaceHi` | `#272C3A` | Raised interactive elements: quiz options, pressed/hover states |
| `border` | `#353C4D` | Mobile hairlines (web moved to `borderSoft`) |
| `borderSoft` | `#262A36` | Every web edge: cards, panels, inputs, buttons. Sits close to the page so things read as planes, not boxes |

Nesting rule: a panel inside a card is a `well` (it reads as carved in); an interactive
element that invites a tap is `surfaceHi` (it reads as raised). Borders define edges.
Cards and panels get the neutral `shadow.card` lift (a top-edge highlight plus a soft drop shadow).
Cards that hold actions add `HoverCard.module.css`: they rise 2px to `shadow.cardHover` on hover or
keyboard focus. Light, colored edges are only for containers that inform or point somewhere (Next Up,
due follow-ups, errors, the prep plan, the active workflow step); everything else uses `borderSoft`.
Colored glows stay reserved for board nodes (glow = node identity).

### Text

| Token | Hex | Role |
| --- | --- | --- |
| `textBright` | `#F4F7FC` | Headings, emphasized values |
| `text` | `#E8ECF4` | Body |
| `textDim` | `#9AA5BC` | Secondary |
| `textFaint` | `#6B7690` | Captions, placeholders, hints |

### Brand

| Token | Hex | Role |
| --- | --- | --- |
| `accent` | `#14B8A6` | Focus teal: primary actions, fills, active states, the XP bar |
| `accentBright` | `#2DD4BF` | Links, glow, active accents on dark planes |
| `accentDeep` | `#0F766E` | Deep end of teal gradients (progress fills) |
| `onAccent` | `#0F141C` | Text/icons **on** accent or category-color fills. Never use white on teal — it fails contrast (~2.5:1); `onAccent` clears 7:1. |

Canonical product constants live in `brand` / `brandColors`: Grip, Poe, "Get a grip. Buckle up.", and the job-hunt confidence promise from [BRAND.md](BRAND.md).

### Status

`success #22C55E` · `danger #EF4444` · `warning #F59E0B`, each with a `*Bright` variant
(`#86EFAC` / `#FCA5A5` / `#FBBF24`) for text on dark planes. Danger-red is reserved for
errors and destructive actions — never for data-viz meaning.

### Alpha & tints

Every `colors` value is a **6-digit hex** — this is load-bearing: UI code derives
translucency by string-appending a 2-digit alpha (`` `${colors.accent}60` ``).
Standard suffixes: `20` chips · `30`/`40` colored borders · `50`/`60` strong borders ·
`80` emphasis borders · `a8`–`f2` overlays. Pre-baked soft backgrounds live in `tints`
(`accentSoft`, `successSoft`, `dangerSoft`, `warningSoft`) — 8-digit, never concatenate
onto them. Modal scrims are the one allowed raw value: `#00000090`.
`packages/core/src/__tests__/tokens.test.js` enforces the formats.

## Data-viz ramps

Domain palettes (quiz categories, board node types, story competencies, pipeline statuses)
are data, not identity — they live in their domain modules (`prepData.js`, `arch.js`,
`stories.js`, `contacts.js`). Rules:

- **Tailwind-400 weights** — consistent brightness against the dark grade.
- **No teal band (~160–190° hue)** — teal belongs to the brand accent alone.
- **No pure danger-red** — red means "error", nothing else.
- 6-digit hexes (the alpha-concat invariant applies — `STATUS_STYLES.bg` is `color + "20"`).

Decorative ramps (confetti) are local constants, teal-led:
`#2DD4BF #4ADE80 #FBBF24 #F472B6 #38BDF8 #A78BFA`.

## Typography

System font on mobile (SF Pro — native feel under the native tab bar), Inter on web.
Sizes come from `font.size`:

| Token | px | Use |
| --- | --- | --- |
| `caption` | 10 | Badges, field section labels |
| `label` | 11 | Field labels, mini buttons, hints |
| `small` | 12 | Meta text, secondary info |
| `body` | 13 | Default UI text, buttons, inputs |
| `bodyLg` | 15 | Card titles, primary buttons |
| `title` | 17 | Screen sub-headings |
| `heading` | 20 | Screen headings |
| `display` | 28 | Large numbers (scores, celebrations) |
| `hero` | 40 | Headline metrics (readiness, mock score) |

Weights stay as string literals in code (`"600"` etc. — RN's `fontWeight` type only accepts
literals): `400` body · `600` buttons/labels · `700` headings · `800` hero numbers.
Body line-height ≈ 1.45×. Uppercase micro-labels take `letterSpacing 0.4–0.8`.

## Spacing & radius

`space`: 4 / 8 / 12 / 16 / 20 / 28 (`xs`–`xxl`). `radius`: `sm 8` (buttons, inputs,
chips) · `md 12` (cards) · `lg 16` (sheets, large containers) · `pill 999` (pills, badges).
Convention: **new or touched code uses tokens**; existing literal values migrate
opportunistically, not in bulk.

## Styling Strategy

We use a **hybrid approach**: CSS Modules for animation-heavy and state-driven styling, inline React `CSSProperties` for simple layout and dynamic values. This avoids over-engineering while keeping complex state maintainable.

### When to Use CSS Modules

Use `.module.css` files (colocated with components) for:

- **Complex animations** — @keyframes, staggered delays, transitions across multiple properties
- **Media queries** — responsive breakpoints where inline can't express condition logic
- **Pseudo-classes and pseudo-elements** — `:hover`, `:focus`, `:before`, `:after`
- **3D transforms** — `perspective`, `transform-style: preserve-3d`, `backface-visibility`
- **State-driven styling** — multiple class variants (e.g., `.isBack`, `.correct`, `.wrong`)

Example: `apps/web/src/interviewPrep/InterviewPrep.module.css` (flip card animations with perspective).

### When to Use Inline Styles

Use React `CSSProperties` for:

- **Simple layout properties** — flexbox alignment, basic spacing, one-off sizes
- **Dynamic values** — colors/sizes driven by component props
- **Single-element styles** — no cascade, no child selectors
- **Type safety** — TypeScript enforces property names; autocomplete reduces errors

Example: `apps/web/src/App.tsx` (header layout with flex, gap, colors).

### Shared Style Objects

Extract repeated inline style objects to component wrappers or `shared.tsx`:

- `FormInput`, `FormTextarea` (components) — use instead of raw objects
- `MiniButton` (component) — use instead of raw objects  
- `Field` — flexbox label wrapper with gap

**Principle:** Do NOT duplicate inline objects across files; pull them into a shared export or component wrapper.

### Design Tokens: Always Use Them

**Never hardcode:**
- Colors — use `colors.*` from tokens (or `tints.*` for pre-baked transluencies)
- Font sizes — use `font.size.*` from tokens
- Font weights — use string literals ("600", "700", "800")
- Spacing (gap, padding, margin) — use `space.*` from tokens
- Border radius — use `radius.*` from tokens

All values from `@grip/core/tokens`.

## Motion

Animations are a first-class feature (see PLAN.md's showcase). Principles:

- **Springs over tweens**: `withSpring`, `FadeInDown.springify().damping(16–18)`.
- **Staggered entrances** on lists: per-index delay, capped (`Math.min(i * 50, 250)`).
- **Celebrate sparingly**: confetti and rank-glow only for perfect drills and rank-ups.
- Web approximates with ~150ms ease transitions; no parallax, no idle animation — except the
  active category's Drill button on Prep, which gets a shine sweep every 10s to point at the next step.

## Components (mobile primitives in `ui.tsx`)

- `Pill` — selectable chip; active fill takes `onAccent` text.
- `Badge` — uppercase micro-label on a `color + "20"` tint.
- `MiniButton` — compact outlined action; border `color + "50"`.
- `Button` — primary (accent fill, `onAccent` text) or ghost (border, `textDim` text).
- `Field` / `Section` — labeled input wrapper / read-only text block.

Rule of thumb: anything sitting **on** a colored fill uses `onAccent`; anything colored
sitting on a dark plane uses the `*Bright` variant of its hue.

## Voice

Concise, direct, a bit wry ("The ladder noticed."). Emoji are iconography, not decoration —
one per concept, used consistently (🎯 drills, 💰 cost, 🔧 maintenance, ⏰ follow-ups).
Gamified register for product nouns: **Quest** (pipeline tab), XP, ranks, drills.

## Out of scope / follow-ups

- App icon, splash icon, Android adaptive set, favicon still carry temporary identity assets -
  regenerating them needs design tooling (binary assets). The Android adaptive background
  (`#E6F4FE`) intentionally stays until the foreground PNG is redone.
- Full spacing/typography migration beyond `ui.tsx` happens opportunistically.
