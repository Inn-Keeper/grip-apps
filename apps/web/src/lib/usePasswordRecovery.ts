import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { recoveryFromUrl } from "./navigation.js";

type Recovery = "none" | "set" | "expired";
const PENDING_KEY = "grip.passwordResetPending";

// Read once: the router rewrites the path to /prep and Supabase clears the token right after load.
const atLoad =
  typeof window === "undefined"
    ? null
    : (recoveryFromUrl(window.location.pathname, window.location.search, window.location.hash) as Recovery | null);

// The stored flag keeps the form up across reloads and new tabs until a password is saved.
const initialRecovery = (): Recovery => {
  if (atLoad === "set") window.localStorage.setItem(PENDING_KEY, "1");
  return atLoad ?? (window.localStorage.getItem(PENDING_KEY) === "1" ? "set" : "none");
};

export function usePasswordRecovery(session: Session | null | undefined) {
  const [recovery, setRecovery] = useState<Recovery>(initialRecovery);

  useEffect(() => {
    if (session === undefined) return;
    if (recovery === "set" && !session) {
      // The link gave no session: expired, already used, or signed out mid-reset.
      window.localStorage.removeItem(PENDING_KEY);
      setRecovery("expired");
    } else if (recovery === "expired" && session) {
      setRecovery("none");
    }
  }, [session, recovery]);

  const finish = useCallback(() => {
    window.localStorage.removeItem(PENDING_KEY);
    setRecovery("none");
  }, []);

  return { recovery, finish };
}
