// Quiz mechanics shared by web and mobile.

// Fisher-Yates: a uniform shuffle. (A `sort(() => Math.random() - 0.5)`
// comparator is non-uniform and engine-dependent, which would bias where the
// correct answer lands across many questions.)
export const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Draws `n` questions without repeats until the whole pool has been seen: unseen ones
 * first (in random order); once they run out, a new round starts from the rest of the
 * pool. `seen` is a flat list of question ids that may cover other pools too (only this
 * pool's ids are touched), so one list per difficulty serves both single-tech cards
 * and multi-tech drills.
 * @template {{ id: string }} Q
 * @param {Q[]} pool
 * @param {string[]} seen
 * @param {number} n
 * @returns {{ picked: Q[], seen: string[] }}
 */
export function drawFromDeck(pool, seen, n) {
  const inPool = new Set(pool.map((q) => q.id));
  const seenHere = new Set(seen.filter((id) => inPool.has(id)));
  let picked = shuffle(pool.filter((q) => !seenHere.has(q.id))).slice(0, n);
  let round = new Set([...seenHere, ...picked.map((q) => q.id)]);
  if (picked.length < n) {
    // Round over: top up from the rest of the pool; those open the next round.
    const taken = new Set(picked.map((q) => q.id));
    const refill = shuffle(pool.filter((q) => !taken.has(q.id))).slice(0, n - picked.length);
    picked = [...picked, ...refill];
    round = new Set(refill.map((q) => q.id));
  }
  return { picked, seen: [...seen.filter((id) => !inPool.has(id)), ...round] };
}

export function shuffleOptions(question) {
  const indexed = question.options.map((opt, i) => ({ opt, isCorrect: i === question.correct }));
  const shuffled = shuffle(indexed);
  return {
    ...question,
    options: shuffled.map((x) => x.opt),
    correct: shuffled.findIndex((x) => x.isCorrect),
  };
}

// Picks the techs a drill should focus on: weakest attempted first (lowest
// accuracy), padded with never-attempted techs when there isn't enough data.
// `boost` techs (e.g. flagged as struggles in an interview retro) jump the
// accuracy ordering entirely — real-interview signal beats quiz accuracy.
// Pure and synchronous — shared by the static flip-card drill and the
// difficulty-tiered DB drill, which differ only in where they source questions.
/**
 * @param {{ items: { tech: string }[] }[]} categories
 * @param {Record<string, { correct: number, wrong: number }>} answers
 * @param {{ techCount?: number, boost?: string[] }} [opts]
 */
export function selectDrillTechs(categories, answers, { techCount = 5, boost = [] } = {}) {
  const boosted = new Set(boost);
  const byBoostThenAcc = (a, b) =>
    (boosted.has(b.tech) ? 1 : 0) - (boosted.has(a.tech) ? 1 : 0) || a.acc - b.acc;
  const allTechs = categories.flatMap((c) => c.items.map((item) => item.tech));
  const attempted = Object.entries(answers)
    .map(([tech, s]) => {
      const total = s.correct + s.wrong;
      return { tech, acc: total > 0 ? s.correct / total : 0 };
    })
    .sort(byBoostThenAcc)
    .map((s) => s.tech);
  const unattempted = shuffle(allTechs.filter((t) => !answers[t])).sort(
    (a, b) => (boosted.has(b) ? 1 : 0) - (boosted.has(a) ? 1 : 0)
  );
  return [...attempted, ...unattempted].slice(0, techCount);
}

// Builds a static drill session from the per-tech flip-card quizzes.
export function buildDrill(categories, answers, { techCount = 5, size = 10 } = {}) {
  const allItems = categories.flatMap((c) =>
    c.items.map((item) => ({ ...item, color: c.color }))
  );
  const targetTechs = selectDrillTechs(categories, answers, { techCount });
  const pool = allItems
    .filter((i) => targetTechs.includes(i.tech))
    .flatMap((i) => i.quiz.map((q) => ({ tech: i.tech, color: i.color, q: shuffleOptions(q) })));
  return shuffle(pool).slice(0, size);
}

// Returns the techs for a single-category drill, weakest first.
// Same logic as selectDrillTechs but scoped to one category's items.
export function selectCategoryDrillTechs(categoryItems, answers, { techCount = 5 } = {}) {
  const techs = categoryItems.map((item) => item.tech);
  const attempted = Object.entries(answers)
    .filter(([tech]) => techs.includes(tech))
    .map(([tech, s]) => {
      const total = s.correct + s.wrong;
      return { tech, acc: total > 0 ? s.correct / total : 0 };
    })
    .sort((a, b) => a.acc - b.acc)
    .map((s) => s.tech);
  const unattempted = shuffle(techs.filter((t) => !answers[t]));
  return [...attempted, ...unattempted].slice(0, techCount);
}

// Builds a tiered drill from questions already fetched from the DB. Maps each
// row to the drill-entry shape (tech, color, shuffled question) the UI expects.
// `colorByTech` resolves a tech's category color; falls back to `fallbackColor`.
/**
 * @param {{ tech: string, prompt: string, options: string[], correct: number }[]} questions
 * @param {{ colorByTech?: Record<string, string>, fallbackColor?: string, size?: number }} [opts]
 */
export function buildDrillFromQuestions(questions, { colorByTech = {}, fallbackColor, size = 10 } = {}) {
  const pool = questions.map((row) => ({
    tech: row.tech,
    color: colorByTech[row.tech] ?? fallbackColor,
    q: shuffleOptions({ question: row.prompt, options: row.options, correct: row.correct }),
  }));
  return shuffle(pool).slice(0, size);
}
