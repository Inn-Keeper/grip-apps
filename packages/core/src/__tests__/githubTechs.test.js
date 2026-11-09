import { fetchGithubTechSignals, githubLanguagesToPrepTechs, githubUsernameFromUrl } from "../githubTechs.js";

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

describe("fetchGithubTechSignals", () => {
  const repos = [
    { fork: false, languages_url: "l/a" },
    { fork: false, languages_url: "l/b" },
    { fork: true, languages_url: "l/fork" },
  ];
  const respond = (body, ok = true) => Promise.resolve({ ok, json: async () => body });
  afterEach(() => { delete global.fetch; });

  it("reports partial scans without claiming every repository", async () => {
    global.fetch = jest.fn((url) =>
      url.includes("/repos") ? respond(repos) : url === "l/a" ? respond({ Go: 10 }) : respond({}, false),
    );
    const result = await fetchGithubTechSignals("ada", ["Go"]);
    expect(result).toEqual({ techs: [{ tech: "Go", score: 10 }], scanned: 1, total: 2 });
  });

  it("an empty profile is a successful empty sync", async () => {
    global.fetch = jest.fn(() => respond([]));
    expect(await fetchGithubTechSignals("ada", ["Go"])).toEqual({ techs: [], scanned: 0, total: 0 });
  });

  it("fails when every language scan fails", async () => {
    global.fetch = jest.fn((url) => (url.includes("/repos") ? respond(repos) : Promise.reject(new Error("net"))));
    await expect(fetchGithubTechSignals("ada", ["Go"])).rejects.toThrow();
  });

  it("passes the abort signal to every request", async () => {
    const controller = new AbortController();
    global.fetch = jest.fn((url) => (url.includes("/repos") ? respond(repos) : respond({ Go: 1 })));
    await fetchGithubTechSignals("ada", ["Go"], { signal: controller.signal });
    for (const call of global.fetch.mock.calls) expect(call[1]).toEqual({ signal: controller.signal });
  });

  it("stops when aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    global.fetch = jest.fn(() => respond([]));
    await expect(fetchGithubTechSignals("ada", ["Go"], { signal: controller.signal })).rejects.toThrow();
  });
});
