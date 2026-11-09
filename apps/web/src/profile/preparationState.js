// Pure helpers for "Your preparation": detached drafts, canonical snapshots and playbook freshness.

const sorted = (list) => [...new Set(list ?? [])].sort();
const sameSet = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

/** An editable copy: arrays are new, so edits never touch cached server data. */
export function createPreparationDraft(profile, preparation) {
  return {
    role: profile?.targetRole ?? "",
    goal: preparation?.goal ?? "explore",
    brief: preparation?.brief ?? "",
    techs: [...(profile?.goalTechs ?? [])],
    favoriteTechs: [...(profile?.favoriteTechs ?? [])],
    cvTechs: [...(profile?.cvTechs ?? [])],
  };
}

export function isDraftDirty(draft, profile, preparation) {
  const saved = createPreparationDraft(profile, preparation);
  return (
    draft.role.trim() !== saved.role.trim() ||
    draft.goal !== saved.goal ||
    draft.brief.trim() !== saved.brief.trim() ||
    !sameSet(draft.techs, saved.techs) ||
    !sameSet(draft.favoriteTechs, saved.favoriteTechs) ||
    !sameSet(draft.cvTechs, saved.cvTechs)
  );
}

/** Input for the transactional save. */
export function preparationPatch(draft) {
  return {
    profilePatch: {
      targetRole: draft.role.trim(),
      goalTechs: [...new Set(draft.techs)],
      favoriteTechs: [...new Set(draft.favoriteTechs)],
      cvTechs: [...new Set(draft.cvTechs)],
    },
    goal: draft.goal,
    brief: draft.brief.trim(),
  };
}

/** Adds a typed technology, case-insensitively unique. Unsupported names are kept as-is. */
export function addTech(list, raw) {
  const tech = raw.trim().slice(0, 60);
  if (!tech || list.some((t) => t.toLowerCase() === tech.toLowerCase())) return list;
  return [...list, tech];
}

export const toggleTech = (list, tech) => (list.includes(tech) ? list.filter((t) => t !== tech) : [...list, tech]);

/**
 * What a playbook is built from. Sets are sorted, so reordering alone never marks it stale.
 * @returns {import("@grip/core/api").PreparationSnapshot}
 */
export function snapshotFor(profile, preparation, locale) {
  return {
    version: /** @type {1} */ (1),
    role: (profile?.targetRole ?? "").trim(),
    goal: preparation?.goal ?? /** @type {const} */ ("explore"),
    brief: (preparation?.brief ?? "").trim(),
    techs: sorted(profile?.goalTechs),
    favoriteTechs: sorted(profile?.favoriteTechs),
    locale,
  };
}

/**
 * none | legacy | current | changed | generating | failed | interrupted.
 * A manifest without a snapshot, or wizard output from before tracking, is legacy: never "current".
 */
export function playbookStatus({ active, snapshot, phase = "idle", hasLegacy = false }) {
  if (phase === "generating" || phase === "failed" || phase === "interrupted") return phase;
  if (!active) return hasLegacy ? "legacy" : "none";
  if (!active.snapshot) return "legacy";
  return JSON.stringify(active.snapshot) === JSON.stringify(snapshot) ? "current" : "changed";
}
