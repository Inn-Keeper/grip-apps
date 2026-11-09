// Whether the first-run wizard takes over the main area. Share routes return
// before App reaches this, so public boards are never blocked.

/**
 * @param {{ session: object | null | undefined,
 *   profile: { onboardingCompleted: boolean } | null | undefined, openedManually: boolean }} input
 */
export function shouldShowWizard({ session, profile, openedManually }) {
  // Demo (anonymous) sessions get the same wizard: same features for everyone.
  if (!session) return false;
  if (openedManually) return true;
  // undefined = still loading; null = no profile row, which counts as not done.
  return profile !== undefined && !profile?.onboardingCompleted;
}

/** Signed in, profile still loading: the wizard may still appear, so hold the pages back. */
export function wizardUndecided({ session, profile, openedManually }) {
  return !!session && !openedManually && profile === undefined;
}
