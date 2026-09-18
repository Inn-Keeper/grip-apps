// Quiz difficulty tiers — single source of truth for both apps.
// Player-facing names are the weather the raven flies in (ranks are how grown it is);
// each tier carries its own XP reward so harder
// questions are worth more. Colors reuse existing design tokens (no new ones).
//
// XP note: tiered questions award `tier.xp`; the flat CORRECT_XP in
// gamification.js still applies to the per-tech flip cards, which have no tier.
import { colors } from "./tokens.js";

/**
 * @typedef {object} Difficulty
 * @property {"easy"|"mid"|"high"|"ultra"} key
 * @property {string} label   Player-facing name
 * @property {string} emoji
 * @property {string} color   Token color for the tier
 * @property {string} blurbKey i18n key for the one-line vibe shown under the label
 * @property {number} xp      XP awarded per correct answer at this tier
 */

/** @type {Difficulty[]} Ordered easy → hardest. */
export const DIFFICULTIES = [
  { key: "easy", label: "Clear Skies", emoji: "☀️", color: colors.success, blurbKey: "enum.difficulty.easyBlurb", xp: 5 },
  { key: "mid", label: "Tailwind", emoji: "🍃", color: colors.accent, blurbKey: "enum.difficulty.midBlurb", xp: 10 },
  { key: "high", label: "Headwind", emoji: "🌬️", color: colors.warning, blurbKey: "enum.difficulty.highBlurb", xp: 20 },
  { key: "ultra", label: "Thunderstorm", emoji: "⛈️", color: colors.deco6, blurbKey: "enum.difficulty.ultraBlurb", xp: 40 },
];

/** @type {("easy"|"mid"|"high"|"ultra")[]} */
export const DIFFICULTY_KEYS = DIFFICULTIES.map((d) => d.key);

/**
 * Look up a tier by key. Returns undefined for unknown keys — callers that need
 * a fallback should handle it explicitly rather than guessing a tier.
 * @param {string} key
 * @returns {Difficulty | undefined}
 */
export const difficultyByKey = (key) => DIFFICULTIES.find((d) => d.key === key);
