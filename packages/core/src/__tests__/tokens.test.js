import { brandColors, colors, tints } from "../tokens.js";

// UI code derives tints via `${colors.x}NN` string concat — a non-6-digit
// color silently produces an invalid tint, so the format is load-bearing.
describe("tokens", () => {
  it("keeps every color a 6-digit hex (alpha-concat invariant)", () => {
    for (const [name, value] of Object.entries(colors)) {
      expect({ name, value }).toEqual({ name, value: expect.stringMatching(/^#[0-9A-F]{6}$/i) });
    }
  });

  it("keeps every pre-baked tint an 8-digit hex", () => {
    for (const [name, value] of Object.entries(tints)) {
      expect({ name, value }).toEqual({ name, value: expect.stringMatching(/^#[0-9A-F]{8}$/i) });
    }
  });

  it("keeps every brand color a 6-digit hex", () => {
    for (const [name, value] of Object.entries(brandColors)) {
      expect({ name, value }).toEqual({ name, value: expect.stringMatching(/^#[0-9A-F]{6}$/i) });
    }
  });
});

// Captions and hints are normal-size text, including on raised interactive surfaces.
function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear.reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

it("keeps informational captions readable across the elevation ladder", () => {
  for (const background of [colors.bgDeep, colors.bg, colors.well, colors.surface, colors.surfaceHi]) {
    const ratio = (luminance(colors.textFaint) + 0.05) / (luminance(background) + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
});
