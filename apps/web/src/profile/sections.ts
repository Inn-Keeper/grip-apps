import type { t } from "@grip/core/i18n";

// Profile menu entries, in left-rail order. Nested preparation routes keep "preparation" active.
export type ProfileSection = "account" | "preparation" | "preferences";

export const SECTIONS: { key: ProfileSection; labelKey: Parameters<typeof t>[0]; icon: string }[] = [
  { key: "account", labelKey: "profile.account", icon: "profile" },
  { key: "preparation", labelKey: "profile.preparation.menu", icon: "story" },
  { key: "preferences", labelKey: "profile.preferences", icon: "layers" },
];
