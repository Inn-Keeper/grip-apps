import { addTech } from "../techList.js";

describe("addTech", () => {
  test("appends a new tech", () => {
    expect(addTech(["React"], "TypeScript", 5)).toEqual(["React", "TypeScript"]);
  });
  test("ignores duplicates and blanks", () => {
    expect(addTech(["React"], "React", 5)).toEqual(["React"]);
    expect(addTech(["React"], "", 5)).toEqual(["React"]);
  });
  test("refuses past the limit", () => {
    expect(addTech(["A", "B"], "C", 2)).toEqual(["A", "B"]);
  });
});
