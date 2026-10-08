import { buildAccuracyTimeline } from "../accuracy.js";

describe("buildAccuracyTimeline", () => {
  it("builds cumulative daily accuracy from per-day totals", () => {
    const timeline = buildAccuracyTimeline([
      { day: "2026-01-02", correct: 1, total: 1 },
      { day: "2026-01-01", correct: 1, total: 2 },
      { day: "2026-01-03", correct: 1, total: 1 },
    ]);

    expect(timeline).toEqual([
      { date: "2026-01-01", accuracy: 0.5, correct: 1, total: 2 },
      { date: "2026-01-02", accuracy: 2 / 3, correct: 2, total: 3 },
      { date: "2026-01-03", accuracy: 0.75, correct: 3, total: 4 },
    ]);
  });

  it("returns an empty line for no answers", () => {
    expect(buildAccuracyTimeline([])).toEqual([]);
  });
});
