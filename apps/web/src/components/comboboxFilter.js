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
