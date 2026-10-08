import { buildReviewQueue, reviewIntervalDays, REVIEW_INTERVALS_DAYS } from "../review.js";

const DAY_MS = 86_400_000;
const NOW = new Date("2026-07-10T12:00:00Z");
const daysAgo = (n) => new Date(NOW.getTime() - n * DAY_MS).toISOString();

describe("reviewIntervalDays", () => {
  it("doubles with the streak and caps at the last interval", () => {
    expect(reviewIntervalDays(0)).toBe(1);
    expect(reviewIntervalDays(1)).toBe(2);
    expect(reviewIntervalDays(2)).toBe(4);
    expect(reviewIntervalDays(99)).toBe(REVIEW_INTERVALS_DAYS.at(-1));
  });
});

describe("buildReviewQueue", () => {
  it("marks a tech due once its streak interval has passed", () => {
    // Streak 1 -> 2-day interval, answered 3 days ago -> due.
    const queue = buildReviewQueue([{ tech: "React", streak: 1, last_at: daysAgo(3) }], NOW);
    expect(queue).toEqual([
      expect.objectContaining({ tech: "React", streak: 1, intervalDays: 2, due: true }),
    ]);
  });

  it("keeps a freshly answered tech out of the due set", () => {
    const queue = buildReviewQueue([{ tech: "React", streak: 1, last_at: daysAgo(0) }], NOW);
    expect(queue[0].due).toBe(false);
  });

  it("brings a tech back the next day after a wrong answer", () => {
    const queue = buildReviewQueue([{ tech: "Docker", streak: 0, last_at: daysAgo(2) }], NOW);
    expect(queue[0]).toMatchObject({ tech: "Docker", streak: 0, intervalDays: 1, due: true });
  });

  it("is exactly due when the interval has just passed", () => {
    // Streak 2 -> 4-day interval, answered 4 days ago.
    expect(buildReviewQueue([{ tech: "Go", streak: 2, last_at: daysAgo(4) }], NOW)[0]).toMatchObject({ intervalDays: 4, due: true });
  });

  it("orders most-overdue first and drops unparseable timestamps", () => {
    const stats = [
      { tech: "Vue", streak: 1, last_at: daysAgo(3) },
      { tech: "React", streak: 1, last_at: daysAgo(30) },
      { tech: "Broken", streak: 1, last_at: "not-a-date" },
    ];
    expect(buildReviewQueue(stats, NOW).map((q) => q.tech)).toEqual(["React", "Vue"]);
  });

  it("returns an empty queue for no stats", () => {
    expect(buildReviewQueue([], NOW)).toEqual([]);
  });
});
