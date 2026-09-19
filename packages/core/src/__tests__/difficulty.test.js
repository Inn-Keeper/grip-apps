import { DIFFICULTIES, DIFFICULTY_KEYS, SPEED_LIMIT_MS, difficultyByKey, isTimedTier, speedBonusXp } from "../difficulty.js";

describe("difficulty tiers", () => {
  it("ships the four tiers in easy → hardest order", () => {
    expect(DIFFICULTY_KEYS).toEqual(["easy", "mid", "high", "ultra"]);
  });

  it("rewards more XP as tiers get harder", () => {
    const xp = DIFFICULTIES.map((d) => d.xp);
    const ascending = [...xp].sort((a, b) => a - b);
    expect(xp).toEqual(ascending);
    expect(new Set(xp).size).toBe(xp.length); // all distinct
  });

  it("gives every tier a label, emoji, color, and blurbKey", () => {
    for (const d of DIFFICULTIES) {
      expect(d.label.trim()).not.toBe("");
      expect(d.emoji.trim()).not.toBe("");
      expect(d.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(d.blurbKey.trim()).not.toBe("");
    }
  });

  it("looks tiers up by key and returns undefined for unknown keys", () => {
    expect(difficultyByKey("ultra")).toBe(DIFFICULTIES[3]);
    expect(difficultyByKey("nope")).toBeUndefined();
    expect(difficultyByKey(null)).toBeUndefined();
  });
});

describe("Thunderstorm speed bonus", () => {
  it("times only the hardest tier", () => {
    expect(DIFFICULTY_KEYS.filter(isTimedTier)).toEqual(["ultra"]);
  });

  it("adds half the tier XP inside the limit, nothing at or after it", () => {
    expect(speedBonusXp("ultra", 0)).toBe(20);
    expect(speedBonusXp("ultra", SPEED_LIMIT_MS - 1)).toBe(20);
    expect(speedBonusXp("ultra", SPEED_LIMIT_MS)).toBe(0);
  });

  it("never pays on untimed tiers or unknown keys", () => {
    expect(speedBonusXp("high", 0)).toBe(0);
    expect(speedBonusXp("nope", 0)).toBe(0);
  });
});
