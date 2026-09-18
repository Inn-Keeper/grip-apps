import type { t } from "@grip/core/i18n";

// Profile sections, in left-rail order.
export type ProfileSection = "account" | "cv" | "connections" | "preferences";

export const SECTIONS: { key: ProfileSection; labelKey: Parameters<typeof t>[0]; icon: string }[] = [
  { key: "account", labelKey: "profile.account", icon: "profile" },
  { key: "cv", labelKey: "profile.sectionCv", icon: "story" },
  { key: "connections", labelKey: "profile.connections", icon: "globe" },
  { key: "preferences", labelKey: "profile.preferences", icon: "layers" },
];
