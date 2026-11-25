# Password recovery (web)

## Why

People who sign up with email and password have no way back in when they forget it.
`docs/production-readiness-2026-11-09.md` lists this as gap #1 before a public launch.
GitHub users and guests are not affected: GitHub owns their password, guests have no email.

## Goals

- "Forgot password?" on the web sign-in card sends a reset link by email.
- The link opens a page where the person sets a new password and lands signed in on Prep.
- An expired or reused link says so and offers a new link on the same page.

## Non-goals

- Mobile. Mobile users reset on the web and then sign in on the phone.
- "Change password" in Profile. The new page can serve it later.
- Translating the reset email. Supabase sends one template; its wording stays in the Supabase dashboard.
- Email delivery itself: Resend as Supabase's SMTP sender is set up in the dashboards, not in code.

## Anti-goals

- A reload or closed tab must never leave someone signed in without a password they know.
- The form never reveals whether an email has an account: the same notice shows either way.

## Approaches

- **A. Dedicated `/reset-password` page (chosen).** Survives reloads, gives expired links a clear
  state, reusable for change password. Costs one more allowed redirect URL in Supabase.
- B. Catch Supabase's one-time `PASSWORD_RECOVERY` event and overlay a form. No config, but a reload
  before saving drops the person into the app without a password: the anti-goal above.
- Rejected: emailing a one-time sign-in link instead. It changes how sign-in works and still leaves
  no password.

## Design

**Request the link (SignIn card).** A third mode, `reset`, next to `signin` and `signup`.
"Forgot password?" is a small link under Sign in (rule 2). In `reset` mode the card shows only the
email field and "Send reset link", with the existing Turnstile token, then calls
`supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + "/reset-password", captchaToken })`.
On success: a neutral notice ("If that email has an account, a reset link is on its way.").
"Back to sign in" returns to `signin`.

**Set the password (`/reset-password`).** The link arrives with an auth token in the URL. The router
already treats that as a fresh sign-in and rewrites the path to `/prep`, and Supabase clears the token
once it has a session. So the link is recognised **once at module load**, like `returningFromSignIn`,
by `type=recovery` in the URL on any path: Supabase sends it to the Site URL when the redirect is not
allow-listed. A plain visit to `/reset-password` is not a reset. A valid link also stores a "reset pending" flag in localStorage,
cleared only when the password is saved or on sign out, so a reload or a new tab still shows the
form. App renders the page before the signed-in shell and the SignIn screen:

- loading (session undefined): nothing new, as today.
- session present: "New password" field (8+ characters, `autoComplete="new-password"`) and
  "Save password". `supabase.auth.updateUser({ password })`; on success go to Prep, signed in.
  A small "Sign out" link under it is the way out for someone who opened the link by mistake.
- no session, or the URL carries `error_code` (for example `otp_expired`): "This link has expired or
  was already used", with the email field and "Send a new link" in place.

**Copy.** New `auth.*` keys in en, pt and sv. Error messages go through `friendlyAuthError`.

**Dashboard setup (not code).** Resend connected as SMTP; Site URL set to the production origin;
`/reset-password` on production and `http://localhost:5173/**` added to Redirect URLs.

## Checks

Screen guidelines checklist (one main action per state, labels above fields, errors next to the
action, announced to screen readers, 375px to 1680px, reduced motion). Unit test for the
"opened at /reset-password" detection. `pnpm run ci`.

## Left to the builder

Component and file names, CSS reuse from `SignIn.module.css`, exact copy within the tone in BRAND.md.
