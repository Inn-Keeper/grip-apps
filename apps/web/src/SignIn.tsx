import React, { useCallback, useEffect, useState } from "react";
import { friendlyAuthError } from "@grip/core/auth";
import { t } from "@grip/core/i18n";
import { supabase } from "./lib/supabase";
import { brand, colors } from "./lib/tokens";
import { BrandIcon } from "./components/BrandIcon";
import { BrandMark } from "./components/BrandMark";
import { Turnstile } from "./components/Turnstile";
import { TURNSTILE_SITE_KEY } from "./lib/turnstile";
import { Field } from "./components/shared";
import styles from "./SignIn.module.css";

export function SignIn() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumped after each attempt to remount the widget: Turnstile tokens are single-use.
  const [captchaKey, setCaptchaKey] = useState(0);
  const onToken = useCallback((token: string | null) => setCaptchaToken(token), []);
  const waitingForCaptcha = !!TURNSTILE_SITE_KEY && !captchaToken;
  const captchaOptions = { captchaToken: captchaToken ?? undefined };
  // A demo click before the invisible captcha resolves waits for the token instead of a disabled button.
  const [demoQueued, setDemoQueued] = useState(false);

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaKey((k) => k + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    if (mode === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password, options: captchaOptions });
      if (err) setError(err.message);
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password, options: captchaOptions });
      if (err) {
        setError(err.message);
      } else if (!data.session) {
        // "Confirm email" is on in Supabase: the mail only arrives once a custom SMTP sender is set up.
        setNotice(t("auth.confirmEmailNotice"));
      }
      // With confirmation disabled, signUp returns a session and the auth listener signs us in.
    }
    resetCaptcha();
    setBusy(false);
  };

  // Guest session; the database seeds sample data for it (migration 0016).
  const tryDemo = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: err } = await supabase.auth.signInAnonymously({ options: captchaOptions });
    if (err) setError(friendlyAuthError(err.message));
    resetCaptcha();
    setBusy(false);
  };

  useEffect(() => {
    if (!demoQueued || waitingForCaptcha) return;
    setDemoQueued(false);
    void tryDemo();
  }, [demoQueued, waitingForCaptcha]); // eslint-disable-line react-hooks/exhaustive-deps

  const signInWithGitHub = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
    if (err) {
      setError(friendlyAuthError(err.message));
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {/* Poe's raven, the same mark as the favicon and header. */}
        <BrandMark size={88} className={styles.mark} />
        <h1 className={styles.title}>{brand.productName}</h1>
        {/* The promise reads at the same weight as the form labels. */}
        <p className={styles.subtitle}>{t("auth.subtitle")}</p>

        <form onSubmit={submit} className={styles.form} data-busy={busy || undefined}>
          <button
            type="button"
            onClick={signInWithGitHub}
            disabled={busy}
            className={`${styles.action} ${styles.github}`}
          >
            <BrandIcon name="code" color={colors.accentBright} size={15} />
            {t("auth.github")}
          </button>
          <button
            type="button"
            onClick={() => (waitingForCaptcha ? setDemoQueued(true) : tryDemo())}
            disabled={busy || demoQueued}
            aria-busy={demoQueued || undefined}
            className={`${styles.action} ${styles.demo}`}
          >
            {demoQueued ? "…" : t("demo.try")}
            <span className={styles.demoHint}>{t("demo.trySub")}</span>
          </button>
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            {t("auth.or")}
            <span className={styles.dividerLine} />
          </div>
          <Field label={t("auth.emailLabel")}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              aria-label={t("auth.emailLabel")}
              autoComplete="email"
              className={styles.field}
            />
          </Field>
          <Field label={t("auth.passwordLabel")}>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? t("auth.newPasswordPlaceholder") : t("auth.passwordPlaceholder")}
              aria-label={t("auth.passwordLabel")}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={styles.field}
            />
          </Field>
          <Turnstile key={captchaKey} onToken={onToken} />
          <button
            type="submit"
            disabled={busy || waitingForCaptcha}
            className={`${styles.action} ${styles.submit}`}
          >
            {busy ? "…" : mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
          </button>
          {error && <p className={styles.error}>{error}</p>}
          {notice && <p className={styles.notice}>{notice}</p>}
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className={styles.modeSwitch}
        >
          {mode === "signin" ? t("auth.switchToSignUp") : t("auth.switchToSignIn")}
        </button>

        {/* Under the form so the main action stays at the top (rule 1). */}
        <p className={styles.proof}>
          <span className={styles.proofIcon}>
            <BrandIcon name="spark" color={colors.accentBright} size={14} />
          </span>
          {t("auth.aiProof")}
        </p>
      </div>
    </main>
  );
}
