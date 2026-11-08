import { alpha, brandColors, themes } from "../tokens.js";

const keys = (obj) => Object.keys(obj).sort();

describe.each(Object.entries(themes))("%s theme", (name, { colors, tints, shadow }) => {
  it("keeps every color a 6-digit hex (alpha() invariant)", () => {
    for (const [key, value] of Object.entries(colors)) {
      expect({ key, value }).toEqual({ key, value: expect.stringMatching(/^#[0-9A-F]{6}$/i) });
    }
  });

  it("keeps every pre-baked tint an 8-digit hex", () => {
    for (const [key, value] of Object.entries(tints)) {
      expect({ key, value }).toEqual({ key, value: expect.stringMatching(/^#[0-9A-F]{8}$/i) });
    }
  });

  // A token missing from one theme would render as undefined there.
  it("has the same keys as the dark theme", () => {
    expect(keys(colors)).toEqual(keys(themes.dark.colors));
    expect(keys(tints)).toEqual(keys(themes.dark.tints));
    expect(keys(shadow)).toEqual(keys(themes.dark.shadow));
  });

  // Captions and hints are normal-size text, including on raised interactive surfaces.
  it("keeps informational captions readable across the elevation ladder", () => {
    for (const background of [colors.bgDeep, colors.bg, colors.well, colors.surface, colors.surfaceHi]) {
      expect(contrast(colors.textFaint, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps body text and links readable on the page and on cards", () => {
    for (const background of [colors.bg, colors.surface]) {
      expect(contrast(colors.text, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.accentBright, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

it("keeps every brand color a 6-digit hex", () => {
  for (const [name, value] of Object.entries(brandColors)) {
    expect({ name, value }).toEqual({ name, value: expect.stringMatching(/^#[0-9A-F]{6}$/i) });
  }
});

describe("alpha", () => {
  it("appends a 2-digit alpha to hex", () => {
    expect(alpha("#14B8A6", 0.38)).toBe("#14B8A661");
    expect(alpha("#14B8A6", 0)).toBe("#14B8A600");
  });

  it("uses color-mix for CSS variables", () => {
    expect(alpha("var(--c-accent)", 0.38)).toBe("color-mix(in srgb, var(--c-accent) 38%, transparent)");
  });
});

function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear.reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}
