// Browser Back/Forward cannot be cancelled: popstate fires after the URL has
// changed. So run the same cancelable "grip:navigate" guard the tabs use, and
// when a page refuses to be left (unsaved Arch Board edits), put the current
// page back into the URL.
export function guardHistoryNavigation(win, currentPage) {
  if (win.dispatchEvent(new CustomEvent("grip:navigate", { cancelable: true }))) return true;
  win.history.pushState({ page: currentPage }, "", `/${currentPage}`);
  return false;
}
