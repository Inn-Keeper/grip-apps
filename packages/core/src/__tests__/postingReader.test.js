import { linksToRead, mergeTechs, techsFromPage } from "../postingReader.js";

describe("techsFromPage", () => {
  test("catalog techs by mention count, capped at 5", () => {
    const text = "React React React TypeScript TypeScript Node.js Docker Kubernetes PostgreSQL GraphQL";
    const techs = techsFromPage(text);
    expect(techs.slice(0, 2)).toEqual(["React", "TypeScript"]);
    expect(techs).toHaveLength(5);
    expect(techs).not.toContain("GraphQL");
  });
});

describe("mergeTechs", () => {
  const row = (over) => ({ id: "a", link: "https://x/1", postingTechs: ["React"], ...over });

  test("page techs first, then model techs, deduped and capped", () => {
    const [merged] = mergeTechs([row()], [{ url: "https://x/1", status: "ok", text: "TypeScript Docker React Kotlin Python Java" }]);
    // One mention each, so page techs keep page order; React is not repeated.
    expect(merged.postingTechs).toEqual(["TypeScript", "Docker", "React", "Kotlin", "Python"]);
    expect(merged.linkStatus).toBe("ok");
  });

  test("a failed link keeps model techs and records the status", () => {
    const [merged] = mergeTechs([row()], [{ url: "https://x/1", status: "blocked", text: null }]);
    expect(merged.postingTechs).toEqual(["React"]);
    expect(merged.linkStatus).toBe("blocked");
  });

  test("rows edited by hand are left alone", () => {
    const edited = row({ techsEdited: true, postingTechs: ["Swift"] });
    expect(mergeTechs([edited], [{ url: "https://x/1", status: "ok", text: "React" }])[0]).toBe(edited);
  });

  test("rows without a fetched link are untouched", () => {
    const other = row({ link: "" });
    expect(mergeTechs([other], [])[0]).toBe(other);
  });
});

describe("linksToRead", () => {
  test("included, unread links only, deduped and capped", () => {
    const rows = [
      { included: true, link: "https://a" },
      { included: true, link: "https://a" },
      { included: false, link: "https://b" },
      { included: true, link: "" },
      { included: true, link: "https://c", linkStatus: "ok" },
      { included: true, link: "https://d" },
    ];
    expect(linksToRead(rows, 10)).toEqual(["https://a", "https://d"]);
    expect(linksToRead(rows, 1)).toEqual(["https://a"]);
  });
});
