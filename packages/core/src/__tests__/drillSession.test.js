import {
  advanceDrill,
  allTechs,
  answerDrill,
  loadDrill,
  mergeTechSignals,
  profileCategories,
  startDrillState,
} from "../drillSession.js";

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
    const fetchTier = jest.fn(async (_d, techs) =>
      techs.length > 1 ? [{ tech: "React", prompt: "p", options: ["a", "b"], correct: 0 }] : [],
    );
    expect(await loadDrill(fetchTier, "mid", ["Nope"])).toHaveProperty("error");
    expect((await loadDrill(fetchTier, "mid", ["Nope"], { fallbackToAll: true })).entries).toHaveLength(1);
    expect(fetchTier).toHaveBeenLastCalledWith("mid", allTechs);
  });
});

describe("profileCategories favorites", () => {
  const techs = (category) => category.items.map((item) => item.tech);

  it("builds a separate From My Favorites category, sorted by name, without merging into the profile one", () => {
    const { favoritesCategory, profileCategory } = profileCategories({
      githubTechs: [{ tech: "Java", score: 5000 }],
      cvTechs: ["React"],
      favoriteTechs: ["TypeScript", "Python"],
      color: "#2DD4BF",
    });
    expect(techs(favoritesCategory)).toEqual(["Python", "TypeScript"]);
    expect(techs(profileCategory)).toEqual(["Java", "React"]);
  });

  it("lists favorites first, then the profile category, then the catalog", () => {
    const { favoritesCategory, profileCategory, displayCategories } = profileCategories({
      githubTechs: [],
      cvTechs: ["React"],
      favoriteTechs: ["Python"],
      color: "#2DD4BF",
    });
    expect(displayCategories.slice(0, 2)).toEqual([favoritesCategory, profileCategory]);
  });

  it("shows favorites even with no GitHub or CV techs", () => {
    const { favoritesCategory, profileCategory, displayCategories } = profileCategories({
      githubTechs: [],
      cvTechs: [],
      favoriteTechs: ["Python"],
      color: "#2DD4BF",
    });
    expect(techs(favoritesCategory)).toEqual(["Python"]);
    expect(profileCategory).toBeNull();
    expect(displayCategories[0]).toBe(favoritesCategory);
  });

  it("has no favorites category without favorites", () => {
    const { favoritesCategory } = profileCategories({
      githubTechs: [],
      cvTechs: ["React"],
      favoriteTechs: [],
      color: "#2DD4BF",
    });
    expect(favoritesCategory).toBeNull();
  });
});

describe("mergeTechSignals", () => {
  it("ranks CV techs by order (earlier = higher score)", () => {
    expect(mergeTechSignals([], ["React", "Go", "Java"])).toEqual([
      { tech: "React", score: 3 },
      { tech: "Go", score: 2 },
      { tech: "Java", score: 1 },
    ]);
  });

  it("dedupes across sources, keeping the higher score", () => {
    // GitHub gives React a large byte-score; CV order would only give it 2.
    const merged = mergeTechSignals([{ tech: "React", score: 5000 }], ["Go", "React"]);
    expect(merged).toContainEqual({ tech: "React", score: 5000 });
    expect(merged).toContainEqual({ tech: "Go", score: 2 });
    expect(merged.filter((s) => s.tech === "React")).toHaveLength(1);
  });

  it("passes GitHub signals through untouched when there's no CV", () => {
    const github = [{ tech: "TypeScript", score: 900 }];
    expect(mergeTechSignals(github, [])).toEqual(github);
  });

  it("handles nullish inputs", () => {
    expect(mergeTechSignals(null, null)).toEqual([]);
    expect(mergeTechSignals(undefined, ["Go"])).toEqual([{ tech: "Go", score: 1 }]);
  });
});
