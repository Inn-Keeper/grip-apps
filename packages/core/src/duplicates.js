// Is a new or imported contact already in Quest? Same posting link, or same company
// and role, is a duplicate; same company with another role is only possible.

const SUFFIX = /\s+(ab|inc|ltd|llc|gmbh|as|oy|aps)$/;

/** Company name without case, markdown, bracketed asides or legal suffix. @param {string} name */
const companyKey = (name) =>
  (name ?? "")
    .toLowerCase()
    .replace(/[*_`]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(SUFFIX, "");

const roleKey = (role) => (role ?? "").toLowerCase().replace(/\s+/g, " ").trim();

/** Host and path, without www or tracking params; Indeed's jk names the job. @param {string} link */
function linkKey(link) {
  try {
    const url = new URL(link);
    const jk = url.searchParams.get("jk");
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}${jk ? `?jk=${jk}` : ""}`;
  } catch {
    return "";
  }
}

/**
 * @template {{ id?: string, name: string, role?: string, link?: string }} C
 * @param {{ id?: string, name: string, role?: string, link?: string }} entry
 * @param {C[]} contacts
 * @returns {{ kind: "duplicate" | "possible", contact: C } | null}
 */
export function findDuplicate(entry, contacts) {
  const others = contacts.filter((c) => !entry.id || c.id !== entry.id);
  const link = linkKey(entry.link);
  const byLink = link && others.find((c) => linkKey(c.link) === link);
  if (byLink) return { kind: "duplicate", contact: byLink };

  const name = companyKey(entry.name);
  const sameCompany = name ? others.filter((c) => companyKey(c.name) === name) : [];
  const role = roleKey(entry.role);
  const same = sameCompany.find((c) => !role || !roleKey(c.role) || roleKey(c.role) === role);
  if (same) return { kind: "duplicate", contact: same };
  return sameCompany.length ? { kind: "possible", contact: sameCompany[0] } : null;
}

/**
 * Import rows already in Quest or earlier in the same import.
 * @param {{ id: string, name: string, role?: string, link?: string }[]} rows
 * @param {{ name: string, role?: string, link?: string }[]} contacts
 * @returns {Map<string, "duplicate" | "possible">}
 */
export function markDuplicates(rows, contacts) {
  const marks = new Map();
  const seen = [...contacts];
  for (const row of rows) {
    const { id, ...entry } = row;
    const found = findDuplicate(entry, seen);
    if (found) marks.set(id, found.kind);
    seen.push(row);
  }
  return marks;
}
