import React, { useCallback, useState } from "react";
import { friendlyAuthError } from "@grip/core/auth";
import { t } from "@grip/core/i18n";
import { supabase } from "./lib/supabase";
import { brand, colors, layout } from "@grip/core/tokens";
import { BrandIcon } from "./components/BrandIcon";
import { Turnstile } from "./components/Turnstile";
import { TURNSTILE_SITE_KEY } from "./lib/turnstile";

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

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaKey((k) => k + 1);
  };

  const inputStyle: React.CSSProperties = {
    padding: "11px 14px",
    background: colors.surface,
    border: `1px solid ${colors.borderSoft}`,
    borderRadius: 10,
    color: colors.text,
    fontSize: 14,
    outline: "none",
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
        // "Confirm email" is still enabled in Supabase — without SMTP that mail never arrives.
        setNotice(
          'Account created, but email confirmation is enabled in Supabase. Disable "Confirm email" under Authentication → Sign In / Providers to activate accounts instantly.'
        );
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
    <main
      style={{
        minHeight: `calc(100vh - ${layout.webHeaderHeight}px)`,
        display: "grid",
        placeItems: "center",
        padding: "32px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ width: 76, height: 62, display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
          <BrandIcon name="spark" color={colors.accentBright} size={42} />
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: colors.textBright }}>
          {brand.productName}
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: colors.textFaint, lineHeight: 1.6 }}>
          {brand.promise}
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={signInWithGitHub}
            disabled={busy}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 14px",
              background: colors.surface,
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 10,
              color: colors.textBright,
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            <BrandIcon name="code" color={colors.accentBright} size={15} />
            Continue with GitHub
          </button>
          <button
            type="button"
            onClick={tryDemo}
            disabled={busy || waitingForCaptcha}
            style={{
              padding: "11px 14px",
              background: "transparent",
              border: `1px dashed ${colors.accent}80`,
              borderRadius: 10,
              color: colors.accentBright,
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? "wait" : "pointer",
              opacity: busy || waitingForCaptcha ? 0.6 : 1,
            }}
          >
            {t("demo.try")}
            <span style={{ display: "block", marginTop: 2, fontSize: 11, fontWeight: 500, color: colors.textFaint }}>
              {t("demo.trySub")}
            </span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: colors.textFaint, fontSize: 11, fontWeight: 700 }}>
            <span style={{ flex: 1, height: 1, background: colors.borderSoft }} />
            or
            <span style={{ flex: 1, height: 1, background: colors.borderSoft }} />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            style={inputStyle}
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "password (8+ characters)" : "password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            style={inputStyle}
          />
          <Turnstile key={captchaKey} onToken={onToken} />
          <button
            type="submit"
            disabled={busy || waitingForCaptcha}
            style={{
              padding: "11px 14px",
              background: colors.accent,
              border: "none",
              borderRadius: 10,
              color: colors.onAccent,
              fontSize: 14,
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
              opacity: busy || waitingForCaptcha ? 0.6 : 1,
            }}
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          {error && <p style={{ margin: 0, fontSize: 12, color: colors.dangerBright }}>{error}</p>}
          {notice && <p style={{ margin: 0, fontSize: 12, color: colors.warningBright, lineHeight: 1.5 }}>{notice}</p>}
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          style={{
            marginTop: 18,
            background: "transparent",
            border: "none",
            color: colors.textDim,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
