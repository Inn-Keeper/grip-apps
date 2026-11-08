import { brandColors, font, layout, themes } from "@grip/core/tokens";
import { kebab } from "./tokens";

// Tokens as CSS variables, since stylesheets can't import them. Theme tokens
// (--c-<color>, --tint-<tint>, --shadow-<name>) live in one stylesheet with a block per
// `data-theme`; the rest (--brand-<color>, --fs-<size>, --page-max) sit on :root.
const block = (values: Record<string, string>, prefix: string) =>
  Object.entries(values).map(([name, value]) => `--${prefix}-${kebab(name)}: ${value};`).join(" ");

export function themeCss() {
  return Object.entries(themes)
    .map(([name, t]) => `:root[data-theme="${name}"] { ${block(t.colors, "c")} ${block(t.tints, "tint")} ${block(t.shadow, "shadow")} }`)
    .join("\n");
}

export function applyTokenVars(root: HTMLElement = document.documentElement) {
  const style = document.createElement("style");
  style.textContent = themeCss();
  document.head.append(style);
  for (const [name, value] of Object.entries(brandColors)) root.style.setProperty(`--brand-${kebab(name)}`, value);
  for (const [name, value] of Object.entries(font.size)) root.style.setProperty(`--fs-${kebab(name)}`, `${Number(value) / 16}rem`);
  root.style.setProperty("--page-max", `${layout.webPageMax}px`);
}
