// Drill sessions shared by web and mobile Prep: loading questions, answering,
// advancing and the profile-driven category. Pure where possible; apps own the state.

import { categories } from "./prepData.js";
import { buildDrillFromQuestions } from "./quiz.js";
import { difficultyByKey, speedBonusXp } from "./difficulty.js";
import { computeReadiness } from "./readiness.js";
import { t } from "./i18n.js";
import { colors } from "./tokens.js";

export const DRILL_SIZE = 10;

/** Every tech mapped to its category colour, so a fetched question can be themed. */
export const colorByTech = Object.fromEntries(categories.flatMap((c) => c.items.map((item) => [item.tech, c.color])));
export const allTechs = Object.keys(colorByTech);

/** Techs Prep can actually drill. @param {string[]} techs */
export const practicable = (techs) => techs.filter((tech) => colorByTech[tech]);

/**
 * A fresh drill over the given entries.
 * @template E
 * @param {E[]} questions @param {string} difficulty @param {number} now
 */
export const startDrillState = (questions, difficulty, now) => ({
  questions,
  index: 0,
  answered: null,
  correctCount: 0,
  done: false,
  difficulty,
  shownAt: now,
  lastBonus: 0,
  bonusXp: 0,
});

/**
 * Fetches questions for techs at a tier and builds the drill entries.
 * `fallbackToAll` widens an empty pool to every tech: right for the generic
 * weakest drill, wrong for targeted ones (review queue, prep plan).
 * @param {(difficulty: string, techs: string[]) => Promise<any[]>} fetchTier
 * @param {string} difficulty @param {string[]} techs
 * @param {{ fallbackToAll?: boolean, fallbackColor?: string }} [options]
 * @returns {Promise<{ entries: any[] } | { error: string }>}
 */
export async function loadDrill(fetchTier, difficulty, techs, { fallbackToAll = false, fallbackColor } = {}) {
  try {
    let questions = await fetchTier(difficulty, techs);
    if (questions.length === 0 && fallbackToAll) questions = await fetchTier(difficulty, allTechs);
    if (questions.length === 0)
      return { error: t("prep.noQuestionsYet", { tier: difficultyByKey(difficulty)?.label ?? difficulty }) };
    return { entries: buildDrillFromQuestions(questions, { colorByTech, fallbackColor, size: DRILL_SIZE }) };
  } catch {
    return { error: t("prep.drillLoadError") };
  }
}

/**
 * Answers the current question. Untimed sessions (mock loop) earn no speed bonus.
 * Returns null when the question was already answered.
 */
export function answerDrill(drill, optionIndex, { now, timed = true }) {
  const current = drill?.questions[drill.index];
  if (!current || drill.answered !== null) return null;
  const isCorrect = optionIndex === current.q.correct;
  const bonus = isCorrect && timed ? speedBonusXp(drill.difficulty, now - drill.shownAt) : 0;
  return {
    drill: {
      ...drill,
      answered: optionIndex,
      correctCount: drill.correctCount + (isCorrect ? 1 : 0),
      lastBonus: bonus,
      bonusXp: drill.bonusXp + bonus,
    },
    tech: current.tech,
    isCorrect,
    bonus,
  };
}

/** Moves to the next question, or finishes; `perfect` means every answer was right. */
export function advanceDrill(drill, now) {
  const nextIndex = drill.index + 1;
  if (nextIndex < drill.questions.length) {
    return { drill: { ...drill, index: nextIndex, answered: null, shownAt: now, lastBonus: 0 }, perfect: false };
  }
  return { drill: { ...drill, done: true }, perfect: drill.correctCount === drill.questions.length };
}

/**
 * Merges GitHub signals with CV techs into one deduped list for the profile category.
 * CV techs have no score, so their order becomes one (earlier = stronger); the higher score wins.
 * @param {{ tech: string, score: number }[]} githubTechs
 * @param {string[]} cvTechs
 * @returns {{ tech: string, score: number }[]}
 */
export function mergeTechSignals(githubTechs, cvTechs) {
  const byTech = new Map();
  for (const { tech, score } of githubTechs ?? []) byTech.set(tech, score);
  const cv = cvTechs ?? [];
  cv.forEach((tech, i) => {
    byTech.set(tech, Math.max(byTech.get(tech) ?? 0, cv.length - i));
  });
  return [...byTech.entries()].map(([tech, score]) => ({ tech, score }));
}

// The catalog items for the given tech signals, kept in signal order (strongest first).
function buildProfileTechCategory(items, techSignals, { name, color }) {
  const byTech = new Map(items.map((item) => [item.tech, item]));
  const matched = techSignals.flatMap(({ tech }) => (byTech.has(tech) ? [{ ...byTech.get(tech), color }] : []));
  return matched.length ? { name, emoji: "⌁", color, items: matched } : null;
}

// Alphabetical, like the Profile picker.
const byTech = (a, b) => a.tech.localeCompare(b.tech, undefined, { sensitivity: "base" });
const sortedCatalog = categories.map((c) => ({ ...c, items: [...c.items].sort(byTech) }));

/**
 * The category list with "From My Favorites" on top, then "from your profile" (GitHub and CV techs).
 * @param {{ githubTechs: any[], cvTechs: string[], favoriteTechs?: string[], color: string | undefined }} input
 */
export function profileCategories({ githubTechs, favoriteTechs = [], cvTechs, color }) {
  const allItems = categories.flatMap((c) =>
    c.items.map((item) => ({ ...item, category: c.name, color: c.color, emoji: c.emoji })),
  );
  const signals = mergeTechSignals(githubTechs, cvTechs);

  const name =
    cvTechs.length && githubTechs.length
      ? t("prep.profileTechsCategory")
      : cvTechs.length
        ? t("prep.cvTechsCategory")
        : t("prep.githubTechsCategory");
  const categoryColor = color ?? colors.accentBright ?? "";
  const profileCategory = buildProfileTechCategory(allItems, signals, { name, color: categoryColor });
  const favoriteItems = allItems
    .filter((item) => favoriteTechs.includes(item.tech))
    .map((item) => ({ ...item, color: categoryColor }))
    .sort(byTech);
  const favoritesCategory = favoriteItems.length
    ? { name: t("prep.favoritesCategory"), emoji: "★", color: categoryColor, items: favoriteItems }
    : null;
  return {
    allItems,
    signals,
    profileCategory,
    favoritesCategory,
    displayCategories: [
      ...(favoritesCategory ? [favoritesCategory] : []),
      ...(profileCategory ? [profileCategory] : []),
      ...sortedCatalog,
    ],
  };
}

/**
 * Readiness scope: the prep plan's techs, else the profile stack, else what's been practiced.
 * Only drillable techs count, so the number can always be moved.
 */
export function readinessFor({ plan, stackTechs, answers }) {
  const planTechs = practicable(plan?.techs ?? []);
  const stack = practicable(stackTechs);
  const [techs, label] = planTechs.length
    ? [planTechs, t("prep.readinessPlan", { name: plan?.name ?? "" })]
    : stack.length
      ? [stack, t("prep.readinessStack")]
      : [practicable(Object.keys(answers)), t("prep.readinessPracticed")];
  const pct = computeReadiness({ postingTechs: techs, answers }).prep;
  return pct === null ? null : { pct, label, count: techs.length };
}
