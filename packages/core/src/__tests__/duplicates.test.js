import { findDuplicate, markDuplicates } from "../duplicates.js";

const quest = [
  { id: "1", name: "Gazella", role: "Product Engineer", link: "" },
  { id: "2", name: "Spotify AB", role: "Frontend Engineer", link: "https://jobs.lever.co/spotify/abc/" },
  { id: "3", name: "Foorloop.ai", role: "", link: "https://se.indeed.com/viewjob?jk=b58&from=serp" },
];

describe("findDuplicate", () => {
  test("same link is a duplicate whatever the name", () => {
    expect(findDuplicate({ name: "Other", role: "", link: "https://www.jobs.lever.co/spotify/abc?utm_source=x" }, quest)).toEqual({ kind: "duplicate", contact: quest[1] });
    expect(findDuplicate({ name: "X", role: "", link: "https://se.indeed.com/viewjob?jk=b58" }, quest)?.contact).toBe(quest[2]);
  });

  test("indeed jobs differ by jk", () => {
    expect(findDuplicate({ name: "X", role: "", link: "https://se.indeed.com/viewjob?jk=other" }, quest)).toBeNull();
  });

  test("name ignores case, brackets, markdown and company suffixes", () => {
    expect(findDuplicate({ name: "Gazella *(via Bravura)*", role: "product engineer", link: "" }, quest)?.kind).toBe("duplicate");
    expect(findDuplicate({ name: "spotify", role: "Frontend Engineer", link: "" }, quest)?.kind).toBe("duplicate");
  });

  test("a missing role on either side still counts as the same application", () => {
    expect(findDuplicate({ name: "Gazella", role: "", link: "" }, quest)?.kind).toBe("duplicate");
    expect(findDuplicate({ name: "foorloop.ai", role: "Lead", link: "" }, quest)?.kind).toBe("duplicate");
  });

  test("same company, different role is only possible", () => {
    expect(findDuplicate({ name: "Spotify", role: "Full Stack Engineer", link: "" }, quest)).toEqual({ kind: "possible", contact: quest[1] });
  });

  test("a contact being edited is not its own duplicate", () => {
    expect(findDuplicate({ id: "1", name: "Gazella", role: "", link: "" }, quest)).toBeNull();
  });

  test("unrelated entries pass", () => {
    expect(findDuplicate({ name: "Initech", role: "", link: "not a url" }, quest)).toBeNull();
  });
});

describe("markDuplicates", () => {
  test("checks existing contacts and earlier rows", () => {
    const rows = [
      { id: "a", name: " gazella ", role: "", link: "" },
      { id: "b", name: "Globex", role: "", link: "" },
      { id: "c", name: "GLOBEX", role: "", link: "" },
      { id: "d", name: "Spotify", role: "Audiobooks", link: "" },
      { id: "e", name: "Initech", role: "", link: "" },
    ];
    expect(Object.fromEntries(markDuplicates(rows, quest))).toEqual({ a: "duplicate", c: "duplicate", d: "possible" });
  });
});
