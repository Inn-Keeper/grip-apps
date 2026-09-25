import { LOCALE_LABELS, en, getLocale, pt, setLocale, subscribeLocale, sv, t } from "../i18n.js";

afterEach(() => {
  // Always reset to English so tests don't bleed locale state.
  setLocale("en");
});

describe("t()", () => {
  it("returns the English string for a known key", () => {
    expect(t("common.save")).toBe("Save");
  });

  it("returns the key itself for an unknown key", () => {
    expect(t("does.not.exist")).toBe("does.not.exist");
  });

  it("interpolates {var} placeholders", () => {
    expect(t("prep.xpToNext", { xp: 120, rank: "Mid" })).toBe("120 XP to Mid");
  });

  it("leaves unmatched placeholders intact", () => {
    expect(t("prep.xpToNext", { xp: 5 })).toBe("5 XP to {rank}");
  });
});

describe("setLocale / getLocale", () => {
  it("defaults to English", () => {
    expect(getLocale()).toBe("en");
  });

  it("switches to pt-BR", () => {
    setLocale("pt");
    expect(getLocale()).toBe("pt");
    expect(t("common.save")).toBe("Salvar");
  });

  it("switches to Swedish", () => {
    setLocale("sv");
    expect(getLocale()).toBe("sv");
    expect(t("common.save")).toBe("Spara");
  });

  it("falls back to English for an unknown locale", () => {
    setLocale("xx");
    expect(getLocale()).toBe("en");
    expect(t("common.save")).toBe("Save");
  });
});

describe("locale completeness", () => {
  const enKeys = Object.keys(en);

  it("pt-BR covers every English key", () => {
    const missing = enKeys.filter((k) => !Object.prototype.hasOwnProperty.call(pt, k));
    expect(missing).toEqual([]);
  });

  it("Swedish covers every English key", () => {
    const missing = enKeys.filter((k) => !Object.prototype.hasOwnProperty.call(sv, k));
    expect(missing).toEqual([]);
  });
});

describe("subscribeLocale", () => {
  it("notifies subscribers when the locale changes", () => {
    let calls = 0;
    const unsubscribe = subscribeLocale(() => {
      calls += 1;
    });
    setLocale("pt");
    expect(calls).toBe(1);
    setLocale("sv");
    expect(calls).toBe(2);
    unsubscribe();
  });

  it("does not notify when setting the same locale", () => {
    setLocale("pt");
    let calls = 0;
    const unsubscribe = subscribeLocale(() => {
      calls += 1;
    });
    setLocale("pt");
    expect(calls).toBe(0);
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    let calls = 0;
    const unsubscribe = subscribeLocale(() => {
      calls += 1;
    });
    unsubscribe();
    setLocale("sv");
    expect(calls).toBe(0);
  });
});

describe("LOCALE_LABELS", () => {
  it("has a label for each supported locale", () => {
    expect(LOCALE_LABELS.en).toBeDefined();
    expect(LOCALE_LABELS.pt).toBeDefined();
    expect(LOCALE_LABELS.sv).toBeDefined();
  });
});

describe("node descriptions", () => {
  it("describes every palette node type", async () => {
    const { NODE_TYPES } = await import("../arch.js");
    for (const { type } of NODE_TYPES) expect(en[`node.desc.${type}`]).toBeTruthy();
  });
});
