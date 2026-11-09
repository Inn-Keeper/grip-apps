// Dependency-free i18n: a flat key->template dictionary with {var}
// interpolation. Plurals: a `<key>_one` entry is used when count is 1.
// Upgrade path if full ICU is ever needed: i18next.

export { en } from "./locales/en.js";
export { pt } from "./locales/pt.js";
export { sv } from "./locales/sv.js";

import { en } from "./locales/en.js";
import { pt } from "./locales/pt.js";
import { sv } from "./locales/sv.js";

const locales = { en, pt, sv };
let active = en;

/** @type {Set<() => void>} */
const listeners = new Set();

/**
 * @param {keyof typeof en} key
 * @param {Record<string, string | number>} [vars]
 */
export function t(key, vars) {
  const template = (vars?.count === 1 && active[`${key}_one`]) || active[key];
  if (typeof template !== "string") return key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match
  );
}

/** @returns {string} */
export function getLocale() {
  return Object.keys(locales).find((k) => locales[k] === active) ?? "en";
}

/** @param {string} name */
export function setLocale(name) {
  const next = locales[name] ?? en;
  if (next === active) return;
  active = next;
  for (const listener of listeners) listener();
}

/**
 * Subscribe to locale changes. Returns an unsubscribe function.
 * Pairs with getLocale() as the snapshot for React's useSyncExternalStore.
 * @param {() => void} listener
 * @returns {() => void}
 */
export function subscribeLocale(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const LOCALE_LABELS = { en: "English", pt: "Português (BR)", sv: "Svenska" };

export const LOCALE_FLAGS = { en: "flagUS", pt: "flagBR", sv: "flagSE" };
