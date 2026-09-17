import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { friendlyAuthError } from "@grip/core/auth";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = Linking.createURL("auth/callback");

async function openOAuthUrl(url: string) {
  const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
  if (result.type !== "success") return;

  const callbackUrl = new URL(result.url);
  const code = callbackUrl.searchParams.get("code");
  if (!code) throw new Error("GitHub did not return an auth code.");

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw new Error(friendlyAuthError(error.message));
}

export async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw new Error(friendlyAuthError(error.message));
  if (data.url) await openOAuthUrl(data.url);
}

export async function linkGitHubIdentity() {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "github",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw new Error(friendlyAuthError(error.message));
  if (data.url) await openOAuthUrl(data.url);
}
