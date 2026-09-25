import { advanceDrill, allTechs, answerDrill, loadDrill, startDrillState } from "../drillSession.js";

const entry = (tech, correct = 0) => ({ tech, q: { question: "q", options: ["a", "b"], correct } });

describe("drill session", () => {
  it("answers once, and gives no speed bonus when untimed", () => {
    const drill = startDrillState([entry("React")], "mid", 0);
    const timed = answerDrill(drill, 0, { now: 1000 });
    const untimed = answerDrill(drill, 0, { now: 1000, timed: false });
    expect(timed.isCorrect).toBe(true);
    expect(untimed.bonus).toBe(0);
    expect(answerDrill(timed.drill, 1, { now: 2000 })).toBeNull();
  });

  it("advances, then finishes and reports a perfect run", () => {
    let drill = startDrillState([entry("React"), entry("Java")], "easy", 0);
    drill = answerDrill(drill, 0, { now: 1 }).drill;
    const step = advanceDrill(drill, 5);
    expect(step.drill.index).toBe(1);
    const done = advanceDrill(answerDrill(step.drill, 0, { now: 6 }).drill, 7);
    expect(done.drill.done).toBe(true);
    expect(done.perfect).toBe(true);
  });

  it("falls back to every tech only when asked", async () => {
    const fetchTier = jest.fn(async (_d, techs) => (techs.length > 1 ? [{ tech: "React", prompt: "p", options: ["a", "b"], correct: 0 }] : []));
    expect(await loadDrill(fetchTier, "mid", ["Nope"])).toHaveProperty("error");
    expect((await loadDrill(fetchTier, "mid", ["Nope"], { fallbackToAll: true })).entries).toHaveLength(1);
    expect(fetchTier).toHaveBeenLastCalledWith("mid", allTechs);
  });
});
