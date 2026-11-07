import { font as nativeFont } from "@grip/core/tokens";

export * from "@grip/core/tokens";

// Keep native font tokens numeric while web text follows the user's default size.
export const font = {
  ...nativeFont,
  size: Object.fromEntries(
    Object.entries(nativeFont.size).map(([name, size]) => [name, `${Number(size) / 16}rem`]),
  ) as { [K in keyof typeof nativeFont.size]: string },
};
