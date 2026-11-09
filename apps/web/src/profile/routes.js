// Profile sub-URLs. The section lives in the path so links, reloads and Back work.
const PATHS = {
  account: "/profile/account",
  preparation: "/profile/preparation",
  edit: "/profile/preparation/edit",
  playbook: "/profile/preparation/playbook",
  preferences: "/profile/preferences",
};

const trim = (pathname) => pathname.replace(/\/+$/, "") || "/";

export const profilePath = (section) => PATHS[section] ?? PATHS.preparation;

/** @returns {"account" | "preparation" | "edit" | "playbook" | "preferences" | "notFound"} */
export function parseProfilePath(pathname) {
  const path = trim(pathname);
  const found = Object.keys(PATHS).find((key) => PATHS[key] === path);
  return /** @type {any} */ (found ?? "notFound");
}

// Bare /profile and the old section names land on preparation (replaceState, not a new entry).
export function profileRedirect(pathname) {
  return ["/profile", "/profile/cv", "/profile/connections"].includes(trim(pathname)) ? PATHS.preparation : null;
}
