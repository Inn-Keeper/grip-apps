import { pickNextUp } from "../nextUp.js";

describe("pickNextUp", () => {
  it("suggests a warm-up to someone who has never answered", () => {
    expect(pickNextUp({ reviewDueCount: 0, hasPlan: false, attempts: 0 })).toEqual({ primary: "warmup", alternatives: [] });
  });

  it("suggests the weakest drill once there is history", () => {
    expect(pickNextUp({ reviewDueCount: 0, hasPlan: false, attempts: 4 }).primary).toBe("weakest");
  });

  it("puts due reviews first and keeps the rest as alternatives", () => {
    expect(pickNextUp({ reviewDueCount: 2, hasPlan: true, attempts: 4 })).toEqual({
      primary: "review",
      alternatives: ["plan", "weakest"],
    });
  });

  it("puts an active plan ahead of the weakest drill", () => {
    expect(pickNextUp({ reviewDueCount: 0, hasPlan: true, attempts: 0 })).toEqual({
      primary: "plan",
      alternatives: ["warmup"],
    });
  });
});
