// Browser Back/Forward cannot be cancelled: popstate fires after the URL has
// changed. So run the same cancelable "grip:navigate" guard the tabs use, and
// when a page refuses to be left (unsaved edits), put the full current path back.
export function guardHistoryNavigation(win, currentPath) {
  if (win.dispatchEvent(new CustomEvent("grip:navigate", { cancelable: true }))) return true;
  win.history.pushState({ path: currentPath }, "", currentPath);
  return false;
}

const PAGE_IDS = ["prep", "stories", "board", "quest", "about", "profile"];

// The top-level page is the first path segment. "contacts" is Quest's old name.
export function pageFromName(name) {
  if (name === "contacts") return "quest";
  return name && PAGE_IDS.includes(name) ? name : null;
}
export const pageFromPath = (pathname) => pageFromName(pathname.split("/")[1] ?? "");

// A sign-in just happened (not a reload of an existing session): the app had seen no
// session (null, never undefined, which means "still loading") and now has a user.
export const isFreshSignIn = (previousUserId, nextUserId) => previousUserId === null && !!nextUserId;

// The page is loading on the way back from an OAuth sign-in: Supabase puts the session in
// the hash (implicit flow) or a one-time code in the query (PKCE flow).
export const isAuthReturn = (search, hash) => /(^|[?&#])(access_token|code)=/.test(`${search}${hash}`);
