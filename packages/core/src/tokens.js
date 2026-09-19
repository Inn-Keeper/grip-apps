// Design tokens — single source of truth for both apps. Rules live in /DESIGN.md.
//
// INVARIANT: every value in `colors` is a 6-digit hex. UI code derives tints by
// appending a 2-digit alpha (e.g. `${colors.accent}60`). Pre-baked translucent
// tints live in `tints` (8-digit) — never concatenate alpha onto those.

/** @type {Record<string, string>} */
export const colors = {
  // Elevation ladder — each step a visible luminance lift.
  bgDeep: "#10131A", // sunken: web header, board canvas
  bg: "#14171F", // page background
  well: "#191D27", // inset: inputs, tracks, nested sub-cards
  surface: "#1E222D", // cards, sheets, pills at rest
  surfaceHi: "#272C3A", // raised interactive: quiz options, pressed states
  border: "#353C4D", // hairlines on controls: inputs, buttons, options
  borderSoft: "#262A36", // card and panel edges: one step above surface, close to the page

  // Text
  textBright: "#F4F7FC", // headings, emphasized values
  text: "#E8ECF4", // body
  textDim: "#9AA5BC", // secondary
  textFaint: "#6B7690", // captions, placeholders

  // Brand
  accent: "#14B8A6", // focus teal — fills, lines, active states
  accentBright: "#2DD4BF", // glow, active accents, links
  accentDeep: "#0F766E", // deep end of teal gradients (progress fills)
  onAccent: "#0F141C", // text/icons on accent or category fills

  // Status
  success: "#22C55E",
  successBright: "#86EFAC",
  danger: "#EF4444",
  dangerBright: "#FCA5A5",
  warning: "#F59E0B",
  warningBright: "#FBBF24",

  // Decorative (confetti, data-viz accents)
  deco1: "#2DD4BF", // brand accent glow
  deco2: "#4ADE80", // green
  deco3: "#FBBF24", // amber
  deco4: "#F472B6", // pink
  deco5: "#38BDF8", // blue
  deco6: "#A78BFA", // purple
};

/** Pre-baked translucent tints (8-digit hex). @type {Record<string, string>} */
export const tints = {
  accentSoft: "#14B8A622",
  successSoft: "#22C55E26",
  dangerSoft: "#EF44441F",
  warningSoft: "#F59E0B1A",
  modalScrim: "#00000090",
};

/** Canonical Grip brand palette. @type {Record<string, string>} */
export const brandColors = {
  teal: "#14B8A6",
  tealBright: "#2DD4BF",
  gold: "#D4A574",
  ink: "#10131A",
  slate: "#272C3A",
};

export const brand = {
  productName: "Grip",
  mascotName: "Poe",
  tagline: "Get a grip. Code up.",
  promise: "Navigate the job hunt with confidence, one skill at a time.",
  companyLocation: "Stockholm, Sweden",
  colors: brandColors,
};

// Font weights stay as string literals in code ("600" etc.) — React Native's
// fontWeight type only accepts literals, so a string-typed token can't carry them.
/**
 * Font sizes — use these for fontSize in inline styles.
 * Example: fontSize: font.size.body
 * No loose @type here: the inferred shape keeps `font.size.body` a plain number.
 */
export const font = {
  size: { caption: 10, label: 11, small: 12, body: 13, bodyLg: 15, title: 17, heading: 20, display: 28, hero: 40 },
};

/**
 * Spacing scale — use these values for gap, padding, margin.
 * Examples: gap: space.sm, padding: `${space.md}px ${space.lg}px`
 * No loose @type here: the inferred shape keeps `space.sm` a plain number.
 */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

// Card lift: a faint top-edge highlight plus a soft drop shadow (hover goes one step deeper).
export const shadow = {
  card: "inset 0 1px 0 #FFFFFF0A, 0 8px 20px -12px #000000B3",
  cardHover: "inset 0 1px 0 #FFFFFF0D, 0 10px 24px -12px #000000C2",
};

export const layout = {
  webHeaderHeight: 72,
  // Wide screens: the page centers at this width; backgrounds still run edge to edge.
  webPageMax: 1920,
  workspaceTop: 96,
  workspaceBottomInset: 22,
  poeClearance: 224, // Poe perch (max 190) + its 22px offset + a gap; rails end above it
  workspaceRailMin: 230,
  workspaceLeftRailMax: 290,
  workspaceRightRailMin: 260,
  workspaceRightRailMax: 340,
  // Mobile: extra scroll padding so content clears the native tab bar.
  // Added on top of the safe-area bottom inset (home indicator).
  tabBarClearance: 56,
};
