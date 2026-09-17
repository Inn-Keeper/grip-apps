// Public Cloudflare Turnstile site key. Unset = CAPTCHA off: no widget, no token sent.
export const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? "";
// The WebView page pretends to live here; it must be an allowed hostname on the Turnstile widget.
export const TURNSTILE_BASE_URL = process.env.EXPO_PUBLIC_TURNSTILE_BASE_URL ?? "http://localhost";
