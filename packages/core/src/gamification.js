// XP rules and rank ladder. Shared by web and mobile.
// Names are stable i18n keys; players see the raven ladder (Hatchling → Nevermore) from `enum.rank.*`.

export const CORRECT_XP = 10;
export const PERFECT_QUIZ_BONUS = 30;

export const RANKS = [
  { name: "Intern", min: 0 },
  { name: "Junior", min: 100 },
  { name: "Mid-level", min: 250 },
  { name: "Senior", min: 500 },
  { name: "Staff", min: 900 },
  { name: "Principal", min: 1500 },
];

/**
 * Highest rank reached for a given XP total.
 * @param {number} xp
 */
export function rankForXp(xp) {
  return [...RANKS].reverse().find((rank) => xp >= rank.min) ?? RANKS[0];
}
