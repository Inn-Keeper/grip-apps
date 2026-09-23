import { ABBREVIATIONS, splitAbbreviations } from "../abbreviations.js";

describe("splitAbbreviations", () => {
  it("returns one plain segment when nothing matches", () => {
    expect(splitAbbreviations("no jargon here")).toEqual([{ text: "no jargon here" }]);
  });

  it("marks a known term and keeps the text around it", () => {
    expect(splitAbbreviations("DAU, peak QPS")).toEqual([
      { text: "DAU", term: "DAU" },
      { text: ", peak " },
      { text: "QPS", term: "QPS" },
    ]);
  });

  it("leaves terms embedded in longer words alone", () => {
    expect(splitAbbreviations("SCUBA gear")).toEqual([{ text: "SCUBA gear" }]);
    expect(splitAbbreviations("APIs are fine")).toEqual([{ text: "APIs are fine" }]);
  });

  it("matches a term carrying a slash", () => {
    expect(splitAbbreviations("in req/s")).toEqual([
      { text: "in " },
      { text: "req/s", term: "req/s" },
    ]);
  });

  it("handles empty and missing input", () => {
    expect(splitAbbreviations("")).toEqual([]);
    expect(splitAbbreviations()).toEqual([]);
  });

  it("every term maps to a locale key", () => {
    for (const key of Object.values(ABBREVIATIONS)) expect(key).toMatch(/^abbr\./);
  });
});
