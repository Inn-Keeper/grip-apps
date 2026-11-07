// Readiness evidence for a target role, kept as separate signals: prep accuracy on the
// role's stack, story competencies covered, and assessed Arch Board design. No composite:
// story count is not a quality score. Parts that can't be computed are null, not zero.

import { scoreBoard } from "./boardScore.js";
import { COMPETENCIES } from "./stories.js";
import { t } from "./i18n.js";
import { SCENARIOS, evaluate } from "./arch.js";

const avg = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * @param {object} args
 * @param {string[]} [args.postingTechs] the role's stack (posting-detected techs)
 * @param {Record<string, { correct: number, wrong: number }>} [args.answers]
 * @param {{ competency: string }[]} [args.stories]
 * @param {{ topology: number, talkGrade?: number | null }[]} [args.boards] saved boards
 * @returns {{
 *   prep: number | null,
 *   storyCovered: number,
 *   storyTotal: number,
 *   arch: number | null,
 *   archTopology: number | null,
 *   archTalk: number | null,
 * }}
 */
export function computeReadiness({ postingTechs = [], answers = {}, stories = [], boards = [] }) {
  // Unattempted techs count as 0% — an untested claim is a risk, not a pass.
  const prep = postingTechs.length
    ? Math.round(
        avg(
          postingTechs.map((tech) => {
            const s = answers[tech];
            const attempts = s ? s.correct + s.wrong : 0;
            return attempts > 0 ? (s.correct / attempts) * 100 : 0;
          })
        )
      )
    : null;

  const covered = new Set(stories.map((s) => s.competency).filter((c) => COMPETENCIES.includes(c)));

  const scored = boards.map(scoreBoard);
  const assessed = scored.filter((b) => b.overall !== null);
  const arch = assessed.length ? Math.round(avg(assessed.map((b) => b.overall))) : null;
  const archTopology = scored.length ? Math.round(avg(scored.map((b) => b.topology))) : null;
  const talkGrades = scored.map((b) => b.talk).filter((v) => v !== null);
  const archTalk = talkGrades.length ? Math.round(avg(talkGrades)) : null;

  return { prep, storyCovered: covered.size, storyTotal: COMPETENCIES.length, arch, archTopology, archTalk };
}

/**
 * The readiness evidence as labelled display values, shared by web and mobile.
 * A null input means its query is loading or failed: shown as unavailable, never as 0.
 * @param {{ postingTechs?: string[], answers: Record<string, { correct: number, wrong: number }> | null,
 *   stories: { competency: string }[] | null, boards: { topology: number, talkGrade?: number | null }[] | null }} args
 * @returns {{ id: "prep" | "stories" | "design", label: string, value: string, hint: string, missing: boolean }[]}
 */
export function readinessSignals({ postingTechs = [], answers, stories, boards }) {
  const r = computeReadiness({ postingTechs, answers: answers ?? {}, stories: stories ?? [], boards: boards ?? [] });
  const unavailable = t("plan.unavailable");
  const prep = !postingTechs.length ? t("plan.addRoleTechs") : answers ? `${r.prep}%` : unavailable;
  const story = stories ? t("plan.storyCount", { covered: r.storyCovered, total: r.storyTotal }) : unavailable;
  const design = !boards ? unavailable : r.arch === null ? t("plan.notAssessed") : `${r.arch}%`;
  return [
    { id: "prep", label: t("plan.readinessPrep"), value: prep, hint: t("plan.readinessPrepHint"), missing: !postingTechs.length || !answers },
    { id: "stories", label: t("plan.readinessStories"), value: story, hint: t("plan.readinessStoriesHint"), missing: !stories },
    { id: "design", label: t("plan.readinessBoards"), value: design, hint: t("plan.readinessBoardsHint"), missing: !boards || r.arch === null },
  ];
}

// Saved boards re-scored against their built-in scenarios. Topology stays visible for every
// board; design readiness counts only boards that also carry a talk grade.
// ponytail: default scenarios only, custom-scenario boards are skipped.
/** @param {{ scenarioId: string, nodes: any[], edges: any[], talkGrade?: number | null }[]} boards */
export function toScoredBoards(boards) {
  return boards.flatMap((board) => {
    const scenario = SCENARIOS.find((s) => s.id === board.scenarioId);
    return scenario ? [{ topology: evaluate(scenario, board.nodes, board.edges).score, talkGrade: board.talkGrade ?? null }] : [];
  });
}
