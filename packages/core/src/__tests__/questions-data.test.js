import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateQuestionSet } from "../questions.js";
import { DIFFICULTY_KEYS } from "../difficulty.js";

// babel-jest transpiles to CJS, so __dirname is available here.
const DATA_DIR = join(__dirname, "../../data/questions");

const loadAll = () =>
  readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("._"))
    .flatMap((f) => JSON.parse(readFileSync(join(DATA_DIR, f), "utf8")));

// Content trust gate: the question bank is hand-authored data shipped to a tool
// people interview against, so a wrong/duplicate/malformed entry must fail CI.
describe("question bank content", () => {
  const questions = loadAll();

  it("has at least one seeded question", () => {
    expect(questions.length).toBeGreaterThan(0);
  });

  it("passes structural validation with no duplicates", () => {
    const errors = validateQuestionSet(questions);
    if (errors.length) throw new Error(`Invalid question bank:\n  ${errors.join("\n  ")}`);
  });

  it("only uses known difficulty tiers", () => {
    for (const q of questions) expect(DIFFICULTY_KEYS).toContain(q.difficulty);
  });
});

describe("validateQuestionSet duplicate rules", () => {
  const q = (over) => ({ tech: "Java", category: "Languages", difficulty: "easy", prompt: "What is the JVM?", options: ["a", "b", "c", "d"], correct: 0, ...over });

  it("flags the same prompt at another level, ignoring case and punctuation", () => {
    const errors = validateQuestionSet([q({}), q({ difficulty: "ultra", prompt: "what is the JVM" })]);
    expect(errors.join()).toMatch(/duplicate prompt in Java \(easy and ultra\)/);
  });

  it("allows the same prompt in different techs", () => {
    expect(validateQuestionSet([q({}), q({ tech: "Kotlin" })])).toEqual([]);
  });

  it("flags repeated options inside one question", () => {
    expect(validateQuestionSet([q({ options: ["a", "a ", "c", "d"] })]).join()).toMatch(/options must all be different/);
  });
});
