# Password Recovery (web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Email and password users can request a reset link from the web sign-in card and set a new password at `/reset-password`.

**Architecture:** SignIn gets a third mode, `reset`, that calls `resetPasswordForEmail`. A pure helper reads the recovery state from the URL once at load; a small hook keeps it (plus a localStorage flag) so App shows a ResetPassword form instead of the app until the password is saved. Expired links fall back to SignIn in reset mode with a message.

**Tech Stack:** React + Vite (apps/web), supabase-js 2.108, node:test for `.js` helpers, i18n in `packages/core/src/locales/{en,pt,sv}.js`.

**Spec:** `docs/superpowers/specs/2026-11-25-password-recovery-design.md`

## Global Constraints

- Web only. No change to `apps/mobile`.
- Every new string exists in en, pt (Brazilian) and sv, as `auth.*` keys. No em or en dashes in copy.
- Code comments: one or two lines.
- Follow SCREEN-GUIDELINES.md: one main action per state, small links under it (rule 2), labels above fields (29), errors next to the action (13) and announced (43), 40px fields (27).
- Reset link target: `${window.location.origin}/reset-password`.
- New password minimum: 8 characters, `autoComplete="new-password"`.
- The "link sent" notice is identical whether or not the email has an account.
- Commit messages: short imperative subject, no prefix, no AI attribution.

## Review Focus

- Reloading `/reset-password` after the router rewrote the URL to `/prep`: the form must still show (localStorage flag). Manual check in Task 3.
- A link with `#error_code=otp_expired` while another account is already signed in: show the app, not a form for the wrong account. Pinned by the helper test in Task 1 (returns `"expired"`) and the hook rule in Task 3.
- Sign out while a reset is pending: the flag is cleared, so the next sign-in goes to the app. Manual check in Task 3.
- Captcha not resolved yet when "Send reset link" is pressed: the button stays disabled like Sign in (`waitingForCaptcha`). Task 2.
- `updateUser` rejecting a weak or reused password: the Supabase message shows under the button, the form stays. Task 3.

---

### Task 1: Read recovery state from the URL

**Files:**
- Modify: `apps/web/src/lib/navigation.js`
- Test: `apps/web/src/lib/navigation.test.js`

**Interfaces:**
- Produces: `recoveryFromUrl(pathname: string, search: string, hash: string): "set" | "expired" | null`

- [ ] **Step 1: Write the failing test**

```js
test("a reset link is recognised by its path, and its error by error_code", () => {
  assert.equal(recoveryFromUrl("/reset-password", "", "#access_token=abc&type=recovery"), "set");
  assert.equal(recoveryFromUrl("/reset-password", "", ""), "set");
  assert.equal(recoveryFromUrl("/reset-password", "", "#error=access_denied&error_code=otp_expired"), "expired");
  assert.equal(recoveryFromUrl("/reset-password", "?error_code=otp_expired", ""), "expired");
  assert.equal(recoveryFromUrl("/prep", "", "#access_token=abc"), null);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter web test`
Expected: FAIL, `recoveryFromUrl` is not exported.

- [ ] **Step 3: Implement `recoveryFromUrl` in `navigation.js`**

`null` unless `pathname === "/reset-password"`; `"expired"` when `/(^|[?&#])error_code=/` matches `search + hash`; otherwise `"set"`.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/navigation.js apps/web/src/lib/navigation.test.js
git commit -m "Recognise password reset links"
```

### Task 2: "Forgot password?" on the sign-in card

**Files:**
- Modify: `apps/web/src/SignIn.tsx`
- Modify: `packages/core/src/locales/en.js`, `pt.js`, `sv.js`

**Interfaces:**
- Produces: `SignIn(props: { initialMode?: "signin" | "signup" | "reset"; message?: string })`. `message` shows as an error line above the form when given. Defaults keep today's behaviour.

- [ ] **Step 1: Add copy keys** (en / pt / sv)

| Key | en | pt | sv |
| --- | --- | --- | --- |
| `auth.forgotPassword` | Forgot password? | Esqueceu a senha? | Glömt lösenordet? |
| `auth.sendResetLink` | Send reset link | Enviar link de redefinição | Skicka återställningslänk |
| `auth.resetLinkSent` | If that email has an account, a reset link is on its way. | Se esse email tiver uma conta, um link de redefinição está a caminho. | Om e-postadressen har ett konto är en återställningslänk på väg. |
| `auth.backToSignIn` | Back to sign in | Voltar para entrar | Tillbaka till inloggning |
| `auth.resetExpired` | This reset link has expired or was already used. Send a new one. | Este link expirou ou já foi usado. Envie um novo. | Länken har gått ut eller redan använts. Skicka en ny. |

- [ ] **Step 2: Implement reset mode in `SignIn.tsx`**

- `mode` type widens to `"signin" | "signup" | "reset"`, initial value from `initialMode ?? "signin"`.
- In `reset` mode: hide the GitHub and demo buttons, the divider and the password field. Submit label `auth.sendResetLink`, disabled while `busy || waitingForCaptcha`.
- Submit in `reset` mode: `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${window.location.origin}/reset-password\`, captchaToken: captchaToken ?? undefined })`. On error: `friendlyAuthError(err.message)`. On success: `setNotice(t("auth.resetLinkSent"))`. Then `resetCaptcha()`.
- In `signin` mode only: a `modeSwitch`-styled button `auth.forgotPassword` directly under the submit button, setting mode `reset` and clearing error and notice.
- The bottom mode switch shows `auth.backToSignIn` in `reset` mode (sets `signin`).
- `message` prop renders as `<p className={styles.error} role="alert">` at the top of the form.

- [ ] **Step 3: Check it**

Run: `pnpm --filter web typecheck && pnpm lint`
Expected: no errors. In the browser at `/`: "Forgot password?" switches the card; "Back to sign in" returns; with your own address, the notice appears and the email arrives.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/SignIn.tsx packages/core/src/locales
git commit -m "Add forgot password to sign in"
```

### Task 3: Set a new password at /reset-password

**Files:**
- Create: `apps/web/src/lib/usePasswordRecovery.ts`
- Create: `apps/web/src/ResetPassword.tsx`
- Modify: `apps/web/src/App.tsx` (signOut at ~line 109, content gate at ~line 256)
- Modify: `packages/core/src/locales/en.js`, `pt.js`, `sv.js`

**Interfaces:**
- Consumes: `recoveryFromUrl` (Task 1); `SignIn({ initialMode, message })` (Task 2).
- Produces: `usePasswordRecovery(session: Session | null | undefined): { recovery: "none" | "set" | "expired"; finish: () => void }`; `ResetPassword(props: { onSaved: () => void })`.

- [ ] **Step 1: Add copy keys**

| Key | en | pt | sv |
| --- | --- | --- | --- |
| `auth.newPasswordTitle` | Set a new password | Defina uma nova senha | Välj ett nytt lösenord |
| `auth.newPasswordLabel` | New password | Nova senha | Nytt lösenord |
| `auth.savePassword` | Save password | Salvar senha | Spara lösenord |

- [ ] **Step 2: Implement `usePasswordRecovery`**

- Module level, read once: `const atLoad = recoveryFromUrl(location.pathname, location.search, location.hash)`. Storage key `grip.passwordResetPending`.
- Initial state: `atLoad ?? (localStorage flag === "1" ? "set" : "none")`. When `atLoad === "set"`, write the flag.
- Effect on `[session, recovery]`, skipped while `session === undefined`:
  - `"set"` and no session: remove flag, become `"expired"`.
  - `"expired"` and a session: become `"none"` (signed-in user clicked a dead link, or signed in again).
- `finish()`: remove flag, become `"none"`.

- [ ] **Step 3: Implement `ResetPassword`**

Same card and classes as `SignIn.module.css` (`page`, `card`, `form`, `field`, `action submit`, `error`). Title `auth.newPasswordTitle`; one `Field` labelled `auth.newPasswordLabel`, `minLength={8}`, `autoComplete="new-password"`; submit `auth.savePassword`. Submit: `supabase.auth.updateUser({ password })`; on error show `friendlyAuthError(err.message)` with `role="alert"` and keep the form; on success call `onSaved()`.

- [ ] **Step 4: Wire App**

- `const { recovery, finish } = usePasswordRecovery(session);`
- Content gate, before the existing three lines: `recovery === "set" && session` renders `<ResetPassword onSaved={() => { finish(); navigatePath("/prep", { replace: true }); }} />` and nothing else; `recovery === "expired" && session === null` renders `<SignIn initialMode="reset" message={t("auth.resetExpired")} />` in place of the plain `<SignIn />`.
- `signOut()` calls `finish()`.

- [ ] **Step 5: Check it in the browser**

With `http://localhost:5173/reset-password` allowed in Supabase Redirect URLs and your own email:
1. Request a link, open it: the form shows. Reload: the form still shows.
2. Save a 7 character password: blocked by the field. Save a valid one: Prep, signed in. Sign out and sign in with the new password.
3. Open the same link again: expired message with "Send reset link".
4. Open a fresh link, sign out instead of saving, sign in with GitHub: the app shows, not the form.
5. SCREEN-GUIDELINES checklist at 375px, 1280px, 1680px, light and dark, reduced motion.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/usePasswordRecovery.ts apps/web/src/ResetPassword.tsx apps/web/src/App.tsx packages/core/src/locales
git commit -m "Add the reset password page"
```

### Task 4: Changelog and full checks

**Files:**
- Modify: `CHANGELOG.md` (today's 2026-11-25 entry, Added)

- [ ] **Step 1: Add the entry**

"Web sign-in: "Forgot password?" emails a reset link; `/reset-password` sets a new password and signs you in. Expired links offer a new one. Needs a custom SMTP sender (Resend) in Supabase and `/reset-password` in its Redirect URLs."

- [ ] **Step 2: Run CI**

Run: `pnpm run ci`
Expected: lint, test, typecheck and build all pass.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md docs/superpowers
git commit -m "Log password recovery"
```
