// Browser Back/Forward cannot be cancelled: popstate fires after the URL has
// changed. So run the same cancelable "grip:navigate" guard the tabs use, and
// when a page refuses to be left (unsaved Arch Board edits), put the current
// page back into the URL.
export function guardHistoryNavigation(win, currentPage) {
  if (win.dispatchEvent(new CustomEvent("grip:navigate", { cancelable: true }))) return true;
  win.history.pushState({ page: currentPage }, "", `/${currentPage}`);
  return false;
}

// A sign-in just happened (not a reload of an existing session): the app had seen no
// session (null, never undefined, which means "still loading") and now has a user.
export const isFreshSignIn = (previousUserId, nextUserId) => previousUserId === null && !!nextUserId;

// The page is loading on the way back from an OAuth sign-in: Supabase puts the session in
// the hash (implicit flow) or a one-time code in the query (PKCE flow).
export const isAuthReturn = (search, hash) => /(^|[?&#])(access_token|code)=/.test(`${search}${hash}`);
