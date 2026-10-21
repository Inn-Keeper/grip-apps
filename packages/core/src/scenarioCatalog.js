// The Arch Board scenario list both apps pick from: the 100 built-ins plus the
// user's own, grouped by category, and the search filter for it.

import { FREE_SCENARIO, SCENARIOS, SCENARIO_CATEGORIES } from "./arch.js";

export const CUSTOM_CATEGORY = "My scenarios";

/**
 * @template {{ id: string, name: string }} C
 * @param {C[]} [customScenarios] rows from listCustomScenarios()
 */
export function buildScenarioCatalog(customScenarios = []) {
  // The free board leads the list, in a group of its own with no heading.
  const allScenarios = [
    FREE_SCENARIO,
    ...SCENARIOS,
    ...customScenarios.map((s) => ({ ...s, category: CUSTOM_CATEGORY, custom: true })),
  ];
  const groups = [
    { label: null, options: [{ value: FREE_SCENARIO.id, label: FREE_SCENARIO.name }] },
    ...[...SCENARIO_CATEGORIES, CUSTOM_CATEGORY]
      .map((category) => ({
        label: category,
        options: allScenarios.filter((s) => s.category === category).map((s) => ({ value: s.id, label: s.name })),
      }))
      .filter((group) => group.options.length > 0),
  ];
  return { allScenarios, groups };
}

/**
 * Filters option groups by a lowercase query. A group whose label matches keeps all
 * its options (typing a category shows the category); empty groups drop out.
 * @template {{ label: string | null, options: { label: string }[] }} G
 * @param {G[]} groups
 * @param {string} query
 * @returns {G[]}
 */
export function filterGroups(groups, query) {
  if (!query) return groups;
  return groups
    .map((group) => group.label?.toLowerCase().includes(query)
      ? group
      : { ...group, options: group.options.filter((option) => option.label.toLowerCase().includes(query)) })
    .filter((group) => group.options.length > 0);
}
