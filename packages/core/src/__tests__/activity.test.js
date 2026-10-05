import { activityByDay, activityLevel } from "../activity.js";

// Wednesday 2026-10-07, mid-afternoon local time.
const now = new Date(2026, 9, 7, 15, 0);
const at = (y, m, d, h = 12, min = 0) => ({ contactId: "c", status: "Applied", createdAt: new Date(y, m, d, h, min).toISOString() });
const days = (grid) => grid.flat().filter(Boolean);
const find = (grid, date) => days(grid).find((day) => day.date === date);

describe("activityByDay", () => {
  test("no events gives a 26 x 7 grid of zero days", () => {
    const grid = activityByDay([], now);
    expect(grid).toHaveLength(26);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(days(grid).every((day) => day.count === 0)).toBe(true);
  });

  test("weeks start on Monday and end with the week containing now", () => {
    const grid = activityByDay([], now);
    expect(grid[25][0].date).toBe("2026-10-05");
    expect(grid[25][2].date).toBe("2026-10-07");
    expect(grid[0][0].date).toBe("2026-04-13");
  });

  test("events on the same day are summed", () => {
    const grid = activityByDay([at(2026, 9, 6, 9), at(2026, 9, 6, 10), at(2026, 9, 6, 18)], now);
    expect(find(grid, "2026-10-06").count).toBe(3);
  });

  test("events before the window and invalid dates are ignored", () => {
    const old = at(2026, 0, 1);
    const grid = activityByDay([old, { contactId: "c", status: "Applied", createdAt: "nope" }], now);
    expect(days(grid).reduce((sum, day) => sum + day.count, 0)).toBe(0);
  });

  test("a late evening event lands on its local day", () => {
    const grid = activityByDay([at(2026, 9, 5, 23, 30)], now);
    expect(find(grid, "2026-10-05").count).toBe(1);
    expect(find(grid, "2026-10-06").count).toBe(0);
  });

  test("a 52 week window reaches back a year", () => {
    const grid = activityByDay([at(2025, 10, 3)], now, 52);
    expect(grid).toHaveLength(52);
    expect(grid[0][0].date).toBe("2025-10-13");
    expect(find(activityByDay([at(2025, 10, 20)], now, 52), "2025-11-20").count).toBe(1);
  });

  test("days after now in the current week are null", () => {
    const week = activityByDay([], now)[25];
    expect(week.slice(3)).toEqual([null, null, null, null]);
  });
});

describe("activityLevel", () => {
  test("zero is level 0 and the max is level 4", () => {
    expect(activityLevel(0, 8)).toBe(0);
    expect(activityLevel(8, 8)).toBe(4);
  });

  test("values in between spread across levels 1 to 3", () => {
    expect(activityLevel(1, 8)).toBe(1);
    expect(activityLevel(3, 8)).toBe(2);
    expect(activityLevel(5, 8)).toBe(3);
  });
});
