export function toggleFavoriteTech(favoriteTechs = [], tech) {
  return favoriteTechs.includes(tech)
    ? favoriteTechs.filter((favorite) => favorite !== tech)
    : [...favoriteTechs, tech];
}
