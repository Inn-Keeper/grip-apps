import { TYPE_COLORS } from "@grip/core/arch";
import { DIFFICULTIES } from "@grip/core/difficulty";
import { STATUS_STYLES } from "@grip/core/contacts";
import { colorByTech } from "@grip/core/drillSession";
import { categories } from "@grip/core/prepData";
import { COMPETENCY_COLORS } from "@grip/core/stories";
import { alpha } from "./tokens";

const themed = (hex: string) => (hex.startsWith("#") ? `color-mix(in srgb, ${hex}, black var(--data-shade))` : hex);

// ponytail: rewrites core's pastel data colors in place at startup so they follow --data-shade with no
// per-site change. New core color maps (or module-level copies like colorByTech) must be listed here.
export function themeDataColors() {
  for (const map of [TYPE_COLORS, COMPETENCY_COLORS, colorByTech] as Record<string, string>[]) {
    for (const key of Object.keys(map)) map[key] = themed(map[key]!);
  }
  for (const item of [...DIFFICULTIES, ...categories] as { color: string }[]) item.color = themed(item.color);
  for (const status of Object.values(STATUS_STYLES) as { color: string; bg: string }[]) {
    status.color = themed(status.color);
    status.bg = alpha(status.color, 0.13);
  }
}
