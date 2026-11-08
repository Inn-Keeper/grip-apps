import { brandColors, colors, font, layout, shadow, tints } from "@grip/core/tokens";

// Tokens as CSS variables on :root, since stylesheets can't import them:
// --c-<color>, --tint-<tint>, --brand-<color>, --fs-<size>, --shadow-<name> (kebab-case), plus --page-max.
const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export function applyTokenVars(root: HTMLElement = document.documentElement) {
  for (const [name, value] of Object.entries(colors)) root.style.setProperty(`--c-${kebab(name)}`, value);
  for (const [name, value] of Object.entries(tints)) root.style.setProperty(`--tint-${kebab(name)}`, value);
  for (const [name, value] of Object.entries(brandColors)) root.style.setProperty(`--brand-${kebab(name)}`, value);
  for (const [name, value] of Object.entries(font.size)) root.style.setProperty(`--fs-${kebab(name)}`, `${Number(value) / 16}rem`);
  for (const [name, value] of Object.entries(shadow)) root.style.setProperty(`--shadow-${kebab(name)}`, value);
  root.style.setProperty("--page-max", `${layout.webPageMax}px`);
}
