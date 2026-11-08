import assert from "node:assert/strict";
import test from "node:test";
import { signalGroups } from "./signalGroups.js";

test("strengths and practice gaps stay disjoint, including sparse histories", () => {
  const ranked = [
    { tech: "React", acc: 100, n: 1 },
    { tech: "Docker", acc: 100, n: 2 },
    { tech: "TypeScript", acc: 70, n: 10 },
    { tech: "Node.js", acc: 50, n: 2 },
    { tech: "Python", acc: 0, n: 1 },
  ];
  const { strongest, weakest } = signalGroups(ranked, 70);
  assert.deepEqual(strongest, ranked.slice(0, 3));
  assert.deepEqual(weakest, [ranked[4], ranked[3]]);
  assert.deepEqual(signalGroups([ranked[0]], 70), { strongest: [ranked[0]], weakest: [] });
  assert.deepEqual(signalGroups([ranked[4]], 70), { strongest: [], weakest: [ranked[4]] });
  assert.deepEqual(signalGroups([], 70), { strongest: [], weakest: [] });
});

test("each group is capped at four without changing the ranking or sample counts", () => {
  const ranked = Array.from({ length: 10 }, (_, i) => ({ tech: `Tech ${i}`, acc: 100 - i * 10, n: i + 1 }));
  const before = structuredClone(ranked);
  const groups = signalGroups(ranked, 70);
  assert.deepEqual(groups.strongest, ranked.slice(0, 4));
  assert.deepEqual(groups.weakest, ranked.slice(6).reverse());
  assert.deepEqual(ranked, before);
});
