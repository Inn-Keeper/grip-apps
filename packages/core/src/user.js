export const PROFILE_FIELDS = [
  { key: "displayName", labelKey: "profile.field.displayName", placeholderKey: "profile.field.displayNamePlaceholder" },
  { key: "headline", labelKey: "profile.field.headline", placeholderKey: "profile.field.headlinePlaceholder" },
  { key: "targetRole", labelKey: "profile.field.targetRole", placeholderKey: "profile.field.targetRolePlaceholder" },
  { key: "location", labelKey: "profile.field.location", placeholderKey: "profile.field.locationPlaceholder" },
  { key: "timezone", labelKey: "profile.field.timezone", placeholderKey: "profile.field.timezonePlaceholder" },
  { key: "githubUrl", labelKey: "profile.field.github", placeholderKey: "profile.field.githubPlaceholder", keyboardType: "url" },
  { key: "linkedinUrl", labelKey: "profile.field.linkedin", placeholderKey: "profile.field.linkedinPlaceholder", keyboardType: "url" },
  { key: "portfolioUrl", labelKey: "profile.field.portfolio", placeholderKey: "profile.field.portfolioPlaceholder", keyboardType: "url" },
];

export const EMPTY_PROFILE_FORM = PROFILE_FIELDS.reduce((form, field) => ({ ...form, [field.key]: "" }), {});

export function profileToForm(profile) {
  return PROFILE_FIELDS.reduce(
    (form, field) => ({ ...form, [field.key]: profile?.[field.key] ?? "" }),
    {}
  );
}

export function profileFormToUpdate(form) {
  const update = { ...EMPTY_PROFILE_FORM, ...form, onboardingCompleted: true };
  if ("useGithubTechsForPrep" in form) update.useGithubTechsForPrep = form.useGithubTechsForPrep;
  return update;
}

// Adds the tech to the favorites, or removes it if it's already there.
export function toggleFavoriteTech(favoriteTechs = [], tech) {
  return favoriteTechs.includes(tech) ? favoriteTechs.filter((favorite) => favorite !== tech) : [...favoriteTechs, tech];
}
