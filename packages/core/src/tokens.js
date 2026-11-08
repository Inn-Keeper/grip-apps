// Design tokens — single source of truth for both apps. Rules live in /DESIGN.md.
//
// INVARIANT: every value in `colors` is a 6-digit hex. Derive translucency with
// `alpha()`. Pre-baked translucent tints live in `tints` (8-digit).
// Two themes share the same keys (`themes.dark`, `themes.light`); dark is the default.

const darkColors = {
  // Elevation ladder — each step a visible luminance lift.
  bgVoid: "#07090D", // darkest edge of the sign-in backdrop
  bgDeep: "#10131A", // sunken: web header, board canvas
  bg: "#14171F", // page background
  well: "#191D27", // inset: inputs, tracks, nested sub-cards
  surface: "#1E222D", // cards, sheets, pills at rest
  surfaceHi: "#272C3A", // raised interactive: quiz options, pressed states
  border: "#353C4D", // hairlines on controls: inputs, buttons, options
  borderSoft: "#262A36", // card and panel edges: one step above surface, close to the page
  borderStrong: "#4A5268", // hover edges: one step above border
  borderDeep: "#141926", // deep end of border gradients (progress outlines)

  // Text
  textBright: "#F4F7FC", // headings, emphasized values
  text: "#E8ECF4", // body
  textDim: "#9AA5BC", // secondary
  textFaint: "#8B96AC", // readable captions and hints, including on surfaceHi

  textHighlight: "#0de6c9", // teal highlight for links, selected text, etc.
  textHighlightDim: "#7cb1ab", // dimmer teal for hover, active, etc.

  // Brand
  accent: "#14B8A6", // focus teal: fills, lines, active states
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
  deco7: "#818CF8", // indigo
};

// Light: the ladder inverts (white cards on a pale page), and `*Bright` means
// "readable on the plane", so those go darker here.
/** @type {Record<keyof typeof darkColors, string>} */
const lightColors = {
  bgVoid: "#E4E8EF",
  bgDeep: "#EEF1F5",
  bg: "#F5F7FA",
  well: "#EDF0F5",
  surface: "#FFFFFF",
  surfaceHi: "#F1F4F8",
  border: "#CDD3DE",
  borderSoft: "#E2E6ED",
  borderStrong: "#A9B2C2",
  borderDeep: "#D5DBE4",

  textBright: "#0B0F17",
  text: "#1C2230",
  textDim: "#4B5568",
  textFaint: "#5D6779",

  textHighlight: "#0F766E",
  textHighlightDim: "#115E59",

  accent: "#14B8A6",
  accentBright: "#0F766E",
  accentDeep: "#0D9488",
  onAccent: "#0F141C",

  success: "#16A34A",
  successBright: "#15803D",
  danger: "#DC2626",
  dangerBright: "#B91C1C",
  warning: "#D97706",
  warningBright: "#B45309",

  deco1: "#0D9488",
  deco2: "#16A34A",
  deco3: "#D97706",
  deco4: "#DB2777",
  deco5: "#0284C7",
  deco6: "#7C3AED",
  deco7: "#4F46E5",
};

/** Pre-baked translucent tints (8-digit hex). */
const darkTints = {
  accentSoft: "#14B8A622",
  successSoft: "#22C55E26",
  dangerSoft: "#EF44441F",
  warningSoft: "#F59E0B1A",
  modalScrim: "#00000090",
};

/** @type {Record<keyof typeof darkTints, string>} */
const lightTints = {
  accentSoft: "#14B8A61F",
  successSoft: "#16A34A1F",
  dangerSoft: "#DC26261A",
  warningSoft: "#D977061A",
  modalScrim: "#0F172A66",
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
  size: {
    nano: 8,
    tierSub: 8.5, // difficulty picker sub-line
    micro: 9,
    tier: 9.5, // difficulty tier badges
    caption: 10,
    captionLg: 10.5,
    label: 11,
    labelLg: 11.5,
    small: 12,
    smallLg: 12.5,
    body: 13,
    bodyMd: 14,
    bodyLg: 15,
    lead: 16,
    title: 17,
    titleLg: 18,
    heading: 20,
    headingLg: 22,
    stat: 26, // big numbers in cards
    display: 28,
    statLg: 30,
    hero: 40,
    heroLg: 44,
  },
};

/**
 * Spacing scale — use these values for gap, padding, margin.
 * Examples: gap: space.sm, padding: `${space.md}px ${space.lg}px`
 * No loose @type here: the inferred shape keeps `space.sm` a plain number.
 */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

// Card lift: a faint top-edge highlight plus a soft drop shadow (hover goes one step deeper).
const darkShadow = {
  card: "inset 0 1px 0 #FFFFFF0A, 0 8px 20px -12px #000000B3",
  cardHover: "inset 0 1px 0 #FFFFFF0D, 0 10px 24px -12px #000000C2",
  // Floating layers: tooltips and popovers, then controls resting over the canvas.
  popover: "0 14px 28px rgba(0, 0, 0, 0.34)",
  floating: "0 8px 24px rgba(0, 0, 0, 0.25)",
  header: "0 14px 38px rgba(0, 0, 0, 0.18)",
};

// Light: no top-edge highlight (it vanishes on white), softer slate drops.
/** @type {Record<keyof typeof darkShadow, string>} */
const lightShadow = {
  card: "0 1px 2px #0F172A0F, 0 8px 20px -12px #0F172A33",
  cardHover: "0 1px 2px #0F172A14, 0 10px 24px -12px #0F172A47",
  popover: "0 14px 28px rgba(15, 23, 42, 0.16)",
  floating: "0 8px 24px rgba(15, 23, 42, 0.12)",
  header: "0 14px 38px rgba(15, 23, 42, 0.08)",
};

export const themes = {
  dark: { colors: darkColors, tints: darkTints, shadow: darkShadow },
  light: { colors: lightColors, tints: lightTints, shadow: lightShadow },
};

// ponytail: dark aliases keep current imports working; each app moves to themes in its plumbing phase.
export const colors = darkColors;
export const tints = darkTints;
export const shadow = darkShadow;

/**
 * Translucent version of a token color. Hex in, 8-digit hex out; a CSS variable
 * in, `color-mix()` out. Example: alpha(colors.accent, 0.38)
 * @param {string} color 6-digit hex or `var(--...)`
 * @param {number} opacity 0 to 1
 */
export function alpha(color, opacity) {
  if (color.startsWith("#")) return color + Math.round(opacity * 255).toString(16).padStart(2, "0").toUpperCase();
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}

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
