// Adds a tech to a capped, duplicate free list (posting techs on a contact).

/** @param {string[]} techs @param {string} tech @param {number} limit */
export function addTech(techs, tech, limit) {
  if (!tech || techs.includes(tech) || techs.length >= limit) return techs;
  return [...techs, tech];
}
