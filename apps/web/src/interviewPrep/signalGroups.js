/**
 * Use the same accuracy boundary as the quiz feedback; sparse histories must
 * not put a topic in both lists or describe a perfect score as needing reps.
 * @param {{ tech: string, acc: number, n: number }[]} ranked Highest accuracy first.
 * @param {number} goodPct
 */
export function signalGroups(ranked, goodPct) {
  return {
    strongest: ranked.filter((item) => item.acc >= goodPct).slice(0, 4),
    weakest: ranked.filter((item) => item.acc < goodPct).reverse().slice(0, 4),
  };
}
