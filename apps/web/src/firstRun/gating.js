// Whether the first-run wizard takes over the main area. Share routes return
// before App reaches this, so public boards are never blocked.

/**
 * @param {{ session: { user: { is_anonymous?: boolean } } | null | undefined,
 *   profile: { onboardingCompleted: boolean } | null | undefined, openedManually: boolean }} input
 */
export function shouldShowWizard({ session, profile, openedManually }) {
  if (!session || session.user.is_anonymous) return false;
  if (openedManually) return true;
  // undefined = still loading; null = no profile row, which counts as not done.
  return profile !== undefined && !profile?.onboardingCompleted;
}
