// Accuracy analytics from per-day answer totals (answer_daily_totals RPC).

/**
 * Builds a cumulative daily accuracy line from per-day totals.
 * @param {Array<{ day: string, correct: number, total: number }>} days local days, any order
 * @returns {{ date: string, accuracy: number, correct: number, total: number }[]}
 */
export function buildAccuracyTimeline(days = []) {
  let correct = 0;
  let total = 0;
  return [...days]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => {
      correct += d.correct;
      total += d.total;
      return { date: d.day, accuracy: total ? correct / total : 0, correct, total };
    });
}
