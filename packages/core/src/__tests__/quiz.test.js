import { buildDrill, buildDrillFromQuestions, drawFromDeck, selectCategoryDrillTechs, selectDrillTechs, shuffleOptions } from "../quiz.js";

const question = {
  question: "Which one is right?",
  options: ["wrong A", "right", "wrong B", "wrong C"],
  correct: 1,
};

describe("shuffleOptions", () => {
  it("keeps the correct index pointing at the correct answer after shuffling", () => {
    for (let run = 0; run < 50; run++) {
      const shuffled = shuffleOptions(question);
      expect(shuffled.options[shuffled.correct]).toBe("right");
    }
  });

  it("preserves the full option set", () => {
    const shuffled = shuffleOptions(question);
    expect([...shuffled.options].sort()).toEqual([...question.options].sort());
  });

  it("does not mutate the source question", () => {
    shuffleOptions(question);
    expect(question.correct).toBe(1);
    expect(question.options[1]).toBe("right");
  });
});

describe("buildDrill", () => {
  const makeQuiz = (tech) =>
    [1, 2, 3].map((n) => ({
      question: `${tech} q${n}`,
      options: ["a", "b", "c", "d"],
      correct: 0,
    }));

  const categories = [
    {
      color: "#111111",
      items: ["t1", "t2", "t3"].map((tech) => ({ tech, quiz: makeQuiz(tech) })),
    },
    {
      color: "#222222",
      items: ["t4", "t5", "t6"].map((tech) => ({ tech, quiz: makeQuiz(tech) })),
    },
  ];

  it("caps the session at the requested size", () => {
    const drill = buildDrill(categories, {}, { techCount: 5, size: 10 });
    expect(drill).toHaveLength(10);
  });

  it("always includes the weakest attempted tech", () => {
    const answers = {
      t1: { correct: 0, wrong: 3 }, // 0% — weakest
      t2: { correct: 3, wrong: 0 }, // 100%
    };
    const drill = buildDrill(categories, answers, { techCount: 2, size: 6 });
    const techs = new Set(drill.map((entry) => entry.tech));
    expect(techs.has("t1")).toBe(true);
    // techCount 2 with two attempted techs leaves no room for unattempted ones.
    expect([...techs].every((tech) => tech === "t1" || tech === "t2")).toBe(true);
  });

  it("pads with never-attempted techs when there is not enough data", () => {
    const answers = { t1: { correct: 0, wrong: 1 } };
    const drill = buildDrill(categories, answers, { techCount: 5, size: 15 });
    const techs = new Set(drill.map((entry) => entry.tech));
    expect(techs.size).toBe(5);
    expect(techs.has("t1")).toBe(true);
  });

  it("attaches the category color and a shuffled question to every entry", () => {
    const drill = buildDrill(categories, {}, { techCount: 6, size: 18 });
    for (const entry of drill) {
      expect(entry.color).toMatch(/^#/);
      expect(entry.q.options[entry.q.correct]).toBe("a");
    }
  });
});

describe("selectDrillTechs", () => {
  const categories = [
    { items: ["t1", "t2", "t3"].map((tech) => ({ tech })) },
    { items: ["t4", "t5", "t6"].map((tech) => ({ tech })) },
  ];

  it("orders attempted techs weakest-accuracy first", () => {
    const answers = {
      t2: { correct: 1, wrong: 1 }, // 50%
      t1: { correct: 0, wrong: 3 }, // 0% — weakest
      t3: { correct: 3, wrong: 0 }, // 100%
    };
    expect(selectDrillTechs(categories, answers, { techCount: 3 })).toEqual(["t1", "t2", "t3"]);
  });

  it("pads with never-attempted techs and respects techCount", () => {
    const techs = selectDrillTechs(categories, { t1: { correct: 0, wrong: 1 } }, { techCount: 4 });
    expect(techs).toHaveLength(4);
    expect(techs[0]).toBe("t1");
    expect(new Set(techs).size).toBe(4); // no repeats
  });

  it("puts boosted techs ahead of the accuracy ordering", () => {
    const answers = {
      t1: { correct: 0, wrong: 3 }, // 0% — normally first
      t3: { correct: 3, wrong: 0 }, // 100% — but flagged as an interview struggle
    };
    const techs = selectDrillTechs(categories, answers, { techCount: 3, boost: ["t3", "t5"] });
    expect(techs[0]).toBe("t3");
    expect(techs[1]).toBe("t1");
    expect(techs[2]).toBe("t5"); // boosted unattempted leads the padding
  });
});

describe("buildDrillFromQuestions", () => {
  const rows = [1, 2, 3].map((n) => ({
    tech: "TypeScript",
    prompt: `q${n}`,
    options: ["right", "a", "b", "c"],
    correct: 0,
  }));

  it("maps DB rows to shuffled drill entries with resolved colors", () => {
    const drill = buildDrillFromQuestions(rows, { colorByTech: { TypeScript: "#abcdef" }, fallbackColor: "#000000", size: 10 });
    expect(drill).toHaveLength(3);
    for (const entry of drill) {
      expect(entry.tech).toBe("TypeScript");
      expect(entry.color).toBe("#abcdef");
      expect(entry.q.options[entry.q.correct]).toBe("right");
    }
  });

  it("falls back to the fallback color for an unmapped tech and caps at size", () => {
    const drill = buildDrillFromQuestions(rows, { fallbackColor: "#123456", size: 2 });
    expect(drill).toHaveLength(2);
    expect(drill[0].color).toBe("#123456");
  });
});

describe("selectCategoryDrillTechs", () => {
  const items = ["t1", "t2", "t3", "t4"].map((tech) => ({ tech }));

  it("orders attempted techs within the category weakest-first", () => {
    const answers = {
      t1: { correct: 0, wrong: 4 }, // 0%
      t3: { correct: 2, wrong: 2 }, // 50%
      t2: { correct: 4, wrong: 0 }, // 100%
    };
    const techs = selectCategoryDrillTechs(items, answers, { techCount: 3 });
    expect(techs).toEqual(["t1", "t3", "t2"]);
  });

  it("ignores techs outside the category even if they are in answers", () => {
    const answers = {
      outside: { correct: 0, wrong: 10 },
      t1: { correct: 1, wrong: 0 },
    };
    const techs = selectCategoryDrillTechs(items, answers, { techCount: 4 });
    expect(techs.every((t) => ["t1", "t2", "t3", "t4"].includes(t))).toBe(true);
  });

  it("pads with unattempted techs and respects techCount", () => {
    const answers = { t1: { correct: 0, wrong: 1 } };
    const techs = selectCategoryDrillTechs(items, answers, { techCount: 3 });
    expect(techs).toHaveLength(3);
    expect(techs[0]).toBe("t1");
    expect(new Set(techs).size).toBe(3);
  });

  it("returns all items when techCount exceeds category size", () => {
    const techs = selectCategoryDrillTechs(items, {}, { techCount: 100 });
    expect(techs).toHaveLength(items.length);
  });
});

describe("drawFromDeck", () => {
  const pool = ["a", "b", "c", "d", "e"].map((id) => ({ id }));
  const ids = (qs) => qs.map((q) => q.id).sort();

  it("never repeats a question until the whole pool has been drawn", () => {
    let seen = [];
    const drawn = [];
    for (let i = 0; i < 5; i++) {
      const next = drawFromDeck(pool, seen, 1);
      drawn.push(next.picked[0].id);
      seen = next.seen;
    }
    expect(drawn.sort()).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("starts a new round with the rest of the pool when unseen ones run out", () => {
    const { picked, seen } = drawFromDeck(pool, ["a", "b", "c", "d"], 3);
    expect(picked).toHaveLength(3);
    expect(picked[0].id).toBe("e"); // the last unseen one comes first
    expect(new Set(ids(picked)).size).toBe(3); // no duplicates within a draw
    expect(seen.sort()).toEqual(ids(picked.slice(1))); // the new round holds only the refill
  });

  it("leaves ids from other pools alone", () => {
    const { seen } = drawFromDeck(pool, ["x", "y"], 2);
    expect(seen.slice(0, 2)).toEqual(["x", "y"]);
    expect(seen).toHaveLength(4);
  });

  it("handles a draw larger than the pool", () => {
    const { picked } = drawFromDeck(pool, [], 10);
    expect(ids(picked)).toEqual(["a", "b", "c", "d", "e"]);
  });
});
