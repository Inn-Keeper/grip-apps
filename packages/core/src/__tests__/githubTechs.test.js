import { githubLanguagesToPrepTechs, githubUsernameFromUrl } from "../githubTechs.js";

describe("GitHub tech helpers", () => {
  it("extracts a GitHub username from profile URLs", () => {
    expect(githubUsernameFromUrl("https://github.com/ada")).toBe("ada");
    expect(githubUsernameFromUrl("github.com/grace?tab=repositories")).toBe("grace");
    expect(githubUsernameFromUrl("https://example.com/ada")).toBe("");
  });

  it("maps GitHub language totals to known prep technologies", () => {
    expect(
      githubLanguagesToPrepTechs({ TypeScript: 1000, JavaScript: 700, Dockerfile: 400, Ruby: 999 }, [
        "TypeScript",
        "JavaScript",
        "Docker",
      ]),
    ).toEqual([
      { tech: "TypeScript", score: 1000 },
      { tech: "JavaScript", score: 700 },
      { tech: "Docker", score: 400 },
    ]);
  });
});
