import React, { useState } from "react";
import { friendlyAuthError } from "@grip/core/auth";
import { t } from "@grip/core/i18n";
import { supabase } from "./lib/supabase";
import { BrandMark } from "./components/BrandMark";
import { Field } from "./components/shared";
import styles from "./SignIn.module.css";

// Shown after a reset link signs the person in, until the new password is saved.
export function ResetPassword({ onSaved }: { onSaved: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) setError(friendlyAuthError(err.message));
    else onSaved();
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <BrandMark size={88} className={styles.mark} />
        <h1 className={styles.title}>{t("auth.newPasswordTitle")}</h1>
        <form onSubmit={submit} className={styles.form} data-busy={busy || undefined}>
          <Field label={t("auth.newPasswordLabel")}>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.newPasswordPlaceholder")}
              aria-label={t("auth.newPasswordLabel")}
              autoComplete="new-password"
              className={styles.field}
            />
          </Field>
          <button type="submit" disabled={busy} className={`${styles.action} ${styles.submit}`}>
            {busy ? "…" : t("auth.savePassword")}
          </button>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </form>
      </div>
    </main>
  );
}
