import { font as nativeFont, themes } from "@grip/core/tokens";

export * from "@grip/core/tokens";

export const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const cssVars = <T extends Record<string, string>>(prefix: string, values: T) =>
  Object.fromEntries(Object.keys(values).map((name) => [name, `var(--${prefix}-${kebab(name)})`])) as {
    [K in keyof T]: string;
  };

// Theme tokens point at CSS variables (written by tokenVars), so switching themes swaps
// the variables under `data-theme` without re-rendering React.
export const colors = cssVars("c", themes.dark.colors);
export const tints = cssVars("tint", themes.dark.tints);
export const shadow = cssVars("shadow", themes.dark.shadow);

// Keep native font tokens numeric while web text follows the user's default size.
export const font = {
  ...nativeFont,
  size: Object.fromEntries(
    Object.entries(nativeFont.size).map(([name, size]) => [name, `${Number(size) / 16}rem`]),
  ) as { [K in keyof typeof nativeFont.size]: string },
};
