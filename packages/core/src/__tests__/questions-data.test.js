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

// These checks catch malformed data and wording cues, not factual mistakes.
// Answers and distractors still need a human content review.
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

  it("does not contain generic padding in answer options", () => {
    for (const q of questions) {
      for (const option of q.options) {
        expect(option).not.toMatch(
          /\b(?:syntax|behavior|configuration) in this context\b|\bin this context(?: in \w+)?$|\bas the relevant .+ concept$|\bfor mobile release management$|\bfor every application context$|\bfor application telemetry analysis$|\bin a Kusto Query Language pipeline$|\bin Grafana dashboard analysis$|\bfor Datadog observability analysis$|\bin feature-flag delivery$|\bunder the provider configuration$|\bas the recommended (?:cloud|CI\/CD) approach$|\bas the primary pipeline reason$/i,
        );
      }
    }
  });

  it.each([...new Set(questions.map((q) => q.tech))])(
    "%s does not reveal answers through systematically longer or shorter wording",
    (tech) => {
      const bank = questions.filter((q) => q.tech === tech);
      const uniquelyLongestCorrect = bank.filter((q) => {
        const correctLength = q.options[q.correct].trim().length;
        return q.options.every((option, index) => index === q.correct || correctLength > option.trim().length);
      });
      const uniquelyShortestCorrect = bank.filter((q) => {
        const correctLength = q.options[q.correct].trim().length;
        return q.options.every((option, index) => index === q.correct || correctLength < option.trim().length);
      });
      const extremeLengthGaps = bank.filter((q) => {
        const lengths = q.options.map((option) => option.trim().length);
        return Math.min(...lengths) < Math.ceil(Math.max(...lengths) * 0.2);
      });

      expect(uniquelyLongestCorrect.length).toBeLessThanOrEqual(Math.floor(bank.length * 0.6));
      expect(uniquelyShortestCorrect.length).toBeLessThanOrEqual(Math.floor(bank.length * 0.6));
      expect(extremeLengthGaps.map((q) => q.prompt)).toEqual([]);
    },
  );
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
