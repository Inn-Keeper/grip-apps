import { sprintStats } from "../sprintLog.js";

describe("sprintStats", () => {
  it("is empty before the first sprint", () => {
    expect(sprintStats([])).toEqual({ count: 0, bestSeconds: null, finishedPct: null, topMissed: [] });
  });

  it("takes the best time from finished runs and ranks what is missed most", () => {
    const stats = sprintStats([
      { seconds: 600, ranOut: true, missed: ["cache", "cdn"] },
      { seconds: 420, ranOut: false, missed: ["cache"] },
      { seconds: 380, ranOut: false, missed: [] },
    ]);
    expect(stats).toMatchObject({ count: 3, bestSeconds: 380, finishedPct: 67 });
    expect(stats.topMissed[0]).toEqual({ label: "cache", count: 2 });
  });
});
