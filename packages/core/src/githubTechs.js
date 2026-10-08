// How many recent repos to list, and how many of those to scan for languages.
// The languages endpoint is one request per repo, so the scan cap bounds the
// unauthenticated-rate-limit cost of a single prep load.
const REPO_PAGE_SIZE = 30;
const REPO_SCAN_LIMIT = 12;

// GitHub language -> catalog tech, only where the names differ; same-named languages match directly.
const LANGUAGE_TO_TECH = { Dockerfile: "Docker" };

// The username from a github.com profile URL, or "" for anything else.
export function githubUsernameFromUrl(value) {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const match = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#]+)\/?/i.exec(raw);
  if (!match) return "";
  const username = match[1].trim();
  return username && !["features", "marketplace", "pricing", "topics"].includes(username.toLowerCase()) ? username : "";
}

// Sums language bytes per catalog tech and returns the top ones, strongest first.
export function githubLanguagesToPrepTechs(languages, knownTechs, limit = 8) {
  const known = new Set(knownTechs);
  const totals = new Map();

  for (const [language, bytes] of Object.entries(languages ?? {})) {
    const tech = LANGUAGE_TO_TECH[language] ?? (known.has(language) ? language : null);
    if (!tech || !known.has(tech)) continue;
    totals.set(tech, (totals.get(tech) ?? 0) + Number(bytes || 0));
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tech, score]) => ({ tech, score }));
}

/**
 * Reads a public GitHub profile's recent repo languages and maps them to known
 * prep techs. Network-bound; shared by web and mobile so the fetch orchestration
 * lives in one place. Throws if the repo list can't be loaded; individual
 * language fetches that fail are skipped.
 * @param {string} username
 * @param {string[]} knownTechs
 * @returns {Promise<{ tech: string, score: number }[]>}
 */
export async function fetchGithubTechSignals(username, knownTechs) {
  const reposResponse = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${REPO_PAGE_SIZE}&sort=pushed`,
  );
  if (!reposResponse.ok) throw new Error("Couldn't load GitHub repositories.");

  const repos = await reposResponse.json();
  const languageTotals = {};
  const candidates = repos.filter((repo) => !repo.fork && repo.languages_url).slice(0, REPO_SCAN_LIMIT);

  await Promise.all(
    candidates.map(async (repo) => {
      const response = await fetch(repo.languages_url);
      if (!response.ok) return;
      const languages = await response.json();
      for (const [language, bytes] of Object.entries(languages)) {
        languageTotals[language] = (languageTotals[language] ?? 0) + Number(bytes || 0);
      }
    }),
  );

  return githubLanguagesToPrepTechs(languageTotals, knownTechs);
}
