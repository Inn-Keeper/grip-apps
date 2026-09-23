// Abbreviations the UI shows, and the locale key that spells each one out.
// Shared so web and mobile expand them identically.

/** Term as it appears on screen, mapped to its i18n key. */
export const ABBREVIATIONS = {
  DAU: "abbr.dau",
  QPS: "abbr.qps",
  "req/s": "abbr.reqs",
  GB: "abbr.gb",
  KB: "abbr.kb",
  TTL: "abbr.ttl",
  CDN: "abbr.cdn",
  SLA: "abbr.sla",
  SLO: "abbr.slo",
  JWT: "abbr.jwt",
  STAR: "abbr.star",
  XP: "abbr.xp",
};

// Longest first, so "req/s" is matched before a bare "s" ever could be, and
// escaped because terms carry slashes.
const PATTERN = new RegExp(
  `(${Object.keys(ABBREVIATIONS)
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"))
    .join("|")})`,
  "g"
);

const isWordChar = (char) => char !== undefined && /[A-Za-z0-9]/.test(char);

/**
 * Splits text into plain segments and known abbreviations.
 *
 * Only whole terms match: "APIs" and "SCUBA" keep their letters rather than
 * sprouting a tooltip mid-word. Returns one plain segment when nothing matches,
 * so a caller can always render the result the same way.
 */
export const splitAbbreviations = (text = "") => {
  const out = [];
  let last = 0;
  for (const match of text.matchAll(PATTERN)) {
    const start = match.index;
    const end = start + match[0].length;
    // A term touching a letter or digit on either side is part of a longer word.
    if (isWordChar(text[start - 1]) || isWordChar(text[end])) continue;
    if (start > last) out.push({ text: text.slice(last, start) });
    out.push({ text: match[0], term: match[0] });
    last = end;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
};
