// Finds catalog techs in free text: CVs, job postings, notes.
// Matches whole words, plus case-sensitive aliases ("TS", "k8s").

// Tech names contain regex-special chars (C++, Next.js, Node.js) and spaces
// (Material UI), so \b boundaries don't work. We escape each name and require a
// non-alphanumeric (or string edge) on each side, which treats "+", "." and " "
// as ordinary characters inside the match while still rejecting "reactive" for
// "React".
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const BOUNDARY = "(?:^|[^a-zA-Z0-9])";

// Names postings and CVs use for a catalog tech. Matched case sensitively, so "rest" or "ts" in prose do not count.
const ALIASES = {
  TypeScript: ["TS"],
  JavaScript: ["JS"],
  "React Native": ["RN"],
  "Node.js": ["Node", "NodeJS"],
  "Next.js": ["NextJS"],
  "Material UI": ["MUI"],
  "GraphQL (Relay)": ["GraphQL", "Relay"],
  "REST / OpenAPI": ["REST", "OpenAPI"],
  "CI/CD Pipelines": ["CI/CD"],
  Kubernetes: ["k8s"],
  "Playwright (E2E)": ["Playwright"],
  "React Testing Library": ["RTL"],
  PostgreSQL: ["Postgres"],
  MongoDB: ["Mongo"],
};

/**
 * @param {string} text raw CV text
 * @param {string[]} knownTechs the prep tech vocabulary to match against
 * @param {number} [limit] max techs returned, highest count first
 * @returns {{ tech: string, score: number }[]}
 */
export function extractTechsFromText(text, knownTechs, limit = 12) {
  if (!text || !knownTechs?.length) return [];

  const found = new Map();
  for (const tech of knownTechs) {
    const name = new RegExp(`${BOUNDARY}(${escapeRegExp(tech)})(?![a-zA-Z0-9])`, "gi");
    const aliases = (ALIASES[tech] ?? []).map(
      (alias) => new RegExp(`${BOUNDARY}(${escapeRegExp(alias)})(?![a-zA-Z0-9])`, "g"),
    );
    const hits = [name, ...aliases].flatMap((pattern) => [...text.matchAll(pattern)].map((m) => m.index));
    if (hits.length) found.set(tech, { score: hits.length, first: Math.min(...hits) });
  }

  // Ties go to the earlier mention: postings and CVs lead with what matters.
  return [...found.entries()]
    .sort((a, b) => b[1].score - a[1].score || a[1].first - b[1].first)
    .slice(0, limit)
    .map(([tech, { score }]) => ({ tech, score }));
}
