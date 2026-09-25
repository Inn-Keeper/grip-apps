// Drill sessions shared by web and mobile Prep: loading questions, answering,
// advancing and the profile-driven category. Pure where possible; apps own the state.

import { categories } from "./prepData.js";
import { buildDrillFromQuestions } from "./quiz.js";
import { difficultyByKey, speedBonusXp } from "./difficulty.js";
import { buildGithubTechCategory } from "./githubTechs.js";
import { mergeTechSignals } from "./cvTechs.js";
import { computeReadiness } from "./readiness.js";
import { t } from "./i18n.js";

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
  questions, index: 0, answered: null, correctCount: 0, done: false, difficulty, shownAt: now, lastBonus: 0, bonusXp: 0,
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
    if (questions.length === 0) return { error: t("prep.noQuestionsYet", { tier: difficultyByKey(difficulty)?.label ?? difficulty }) };
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
    drill: { ...drill, answered: optionIndex, correctCount: drill.correctCount + (isCorrect ? 1 : 0), lastBonus: bonus, bonusXp: drill.bonusXp + bonus },
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
 * The category list with the "from your profile" category (GitHub and CV techs) on top.
 * @param {{ githubTechs: any[], cvTechs: string[], color: string | undefined }} input
 */
export function profileCategories({ githubTechs, cvTechs, color }) {
  const allItems = categories.flatMap((c) => c.items.map((item) => ({ ...item, category: c.name, color: c.color, emoji: c.emoji })));
  const signals = mergeTechSignals(githubTechs, cvTechs);
  const name = cvTechs.length && githubTechs.length ? t("prep.profileTechsCategory") : cvTechs.length ? t("prep.cvTechsCategory") : undefined;
  const profileCategory = buildGithubTechCategory(allItems, signals, { color, name });
  return { allItems, signals, profileCategory, displayCategories: profileCategory ? [profileCategory, ...categories] : categories };
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
