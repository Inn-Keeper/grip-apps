import { extractTechsFromText, mergeTechSignals } from "../cvTechs.js";

const KNOWN = ["React", "TypeScript", "Node.js", "C++", "Java", "Material UI", "Go"];

describe("extractTechsFromText", () => {
  it("matches known techs present in the text, ranked by occurrence count", () => {
    const text = "Built apps with React and TypeScript. React was the primary framework.";
    expect(extractTechsFromText(text, KNOWN)).toEqual([
      { tech: "React", score: 2 },
      { tech: "TypeScript", score: 1 },
    ]);
  });

  it("is case-insensitive", () => {
    expect(extractTechsFromText("reactjs is wrong but REACT and react count", KNOWN)).toEqual([
      { tech: "React", score: 2 },
    ]);
  });

  it("respects word boundaries — does not match substrings", () => {
    // "reactive" and "Javascript" must not match "React"/"Java".
    expect(extractTechsFromText("reactive programming in Javascript", KNOWN)).toEqual([]);
  });

  it("matches techs containing special chars and spaces", () => {
    const text = "Experience: C++, Node.js, and Material UI design systems.";
    expect(extractTechsFromText(text, KNOWN).map((t) => t.tech).sort()).toEqual([
      "C++",
      "Material UI",
      "Node.js",
    ]);
  });

  it("returns empty for missing techs, empty text, or empty vocabulary", () => {
    expect(extractTechsFromText("I write COBOL", KNOWN)).toEqual([]);
    expect(extractTechsFromText("", KNOWN)).toEqual([]);
    expect(extractTechsFromText("React everywhere", [])).toEqual([]);
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

describe("extractTechsFromText aliases", () => {
  const known = ["TypeScript", "PostgreSQL", "React Native", "GraphQL (Relay)", "Node.js", "Kubernetes"];

  test("short and common names count toward the catalog tech", () => {
    const text = "TS everywhere, Postgres, RN app, GraphQL API, Node backend on k8s. Typescript again.";
    expect(extractTechsFromText(text, known)).toEqual([
      { tech: "TypeScript", score: 2 },
      { tech: "PostgreSQL", score: 1 },
      { tech: "React Native", score: 1 },
      { tech: "GraphQL (Relay)", score: 1 },
      { tech: "Node.js", score: 1 },
      { tech: "Kubernetes", score: 1 },
    ]);
  });

  test("aliases still need word boundaries", () => {
    expect(extractTechsFromText("tsunami nodes postgresql", ["TypeScript", "Node.js"])).toEqual([]);
  });

  test("aliases are case sensitive, so plain words do not count", () => {
    expect(extractTechsFromText("the rest of the team, ts and rn", ["REST / OpenAPI", "TypeScript", "React Native"])).toEqual([]);
  });

  test("ties rank by first mention", () => {
    expect(extractTechsFromText("Stack: TypeScript, React. Also Java.", ["Java", "React", "TypeScript"]).map((d) => d.tech)).toEqual([
      "TypeScript",
      "React",
      "Java",
    ]);
  });
});
