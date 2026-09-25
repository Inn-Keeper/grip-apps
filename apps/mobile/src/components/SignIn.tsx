import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { signInWithGitHub } from "@/lib/oauth";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import { Turnstile } from "@/components/Turnstile";
import { friendlyAuthError } from "@grip/core/auth";
import { t } from "@grip/core/i18n";
import { colors, font } from "@/theme";

// Email + password with in-app account creation. No email delivery anywhere:
// requires "Confirm email" to be disabled in Supabase so signUp returns a
// live session immediately.
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

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    if (mode === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: captchaOptions,
      });
      if (err) setError(friendlyAuthError(err.message));
    } else {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: captchaOptions,
      });
      if (err) {
        setError(friendlyAuthError(err.message));
      } else if (!data.session) {
        setNotice(
          t("auth.confirmEmailNotice")
        );
      }
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

  const githubSignIn = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await signInWithGitHub();
    } catch (err) {
      setError(err instanceof Error ? err.message : "GitHub sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = email.includes("@") && password.length >= (mode === "signup" ? 8 : 1);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: 32 }}
    >
      <Text style={{ color: colors.textBright, fontSize: font.size.headingLg, fontWeight: "700", textAlign: "center", marginBottom: 6 }}>
        {t("auth.appName")}
      </Text>
      <Text style={{ color: colors.textFaint, fontSize: font.size.body, textAlign: "center", marginBottom: 28 }}>
        {t("auth.promise")}
      </Text>

      <TouchableOpacity
        onPress={githubSignIn}
        disabled={busy}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          opacity: busy ? 0.6 : 1,
        }}
      >
        <Text style={{ color: colors.textBright, fontWeight: "700", textAlign: "center", fontSize: font.size.bodyLg }}>
          Continue with GitHub
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={tryDemo}
        disabled={busy || waitingForCaptcha}
        accessibilityRole="button"
        style={{
          marginTop: 10,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: `${colors.accent}80`,
          borderRadius: 12,
          padding: 12,
          opacity: busy || waitingForCaptcha ? 0.6 : 1,
        }}
      >
        <Text style={{ color: colors.accentBright, fontWeight: "700", textAlign: "center", fontSize: font.size.bodyLg }}>
          {t("demo.try")}
        </Text>
        <Text style={{ color: colors.textFaint, textAlign: "center", fontSize: font.size.label, marginTop: 2 }}>{t("demo.trySub")}</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ color: colors.textFaint, fontSize: font.size.label, fontWeight: "700" }}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t("auth.emailPlaceholder")}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        style={inputStyle}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={mode === "signup" ? t("auth.newPasswordPlaceholder") : t("auth.passwordPlaceholder")}
        placeholderTextColor={colors.textFaint}
        secureTextEntry
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        style={[inputStyle, { marginTop: 10 }]}
      />

      <Turnstile key={captchaKey} onToken={onToken} />

      <TouchableOpacity
        onPress={submit}
        disabled={busy || !canSubmit || waitingForCaptcha}
        style={{
          backgroundColor: colors.accent,
          borderRadius: 12,
          padding: 14,
          marginTop: 12,
          opacity: busy || !canSubmit || waitingForCaptcha ? 0.6 : 1,
        }}
      >
        <Text style={{ color: colors.onAccent, fontWeight: "600", textAlign: "center", fontSize: font.size.bodyLg }}>
          {busy ? "…" : mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setNotice(null);
        }}
        style={{ marginTop: 18 }}
      >
        <Text style={{ color: colors.textDim, fontSize: font.size.body, textAlign: "center" }}>
          {mode === "signin" ? t("auth.switchToSignUp") : t("auth.switchToSignIn")}
        </Text>
      </TouchableOpacity>

      {error && (
        <Text style={{ color: colors.dangerBright, fontSize: font.size.body, textAlign: "center", marginTop: 16 }}>{error}</Text>
      )}
      {notice && (
        <Text style={{ color: colors.warningBright, fontSize: font.size.body, textAlign: "center", marginTop: 16, lineHeight: 19 }}>
          {notice}
        </Text>
      )}
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  padding: 14,
  color: colors.text,
  fontSize: font.size.bodyLg,
} as const;
