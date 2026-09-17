import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { TURNSTILE_BASE_URL, TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import { colors } from "@/theme";

// Turnstile has no native SDK, so the widget runs in a small WebView and posts its token back.
// Tokens are single-use: remount this (change its key) after each auth attempt.
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  if (!TURNSTILE_SITE_KEY) return null;

  const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=start&render=explicit" async defer></script>
<style>html,body{margin:0;background:${colors.bg};}</style>
</head><body><div id="w"></div><script>
function send(token){ window.ReactNativeWebView.postMessage(token || ""); }
function start(){
  turnstile.render("#w", {
    sitekey: ${JSON.stringify(TURNSTILE_SITE_KEY)},
    theme: "dark",
    size: "flexible",
    callback: send,
    "expired-callback": function(){ send(""); },
    "error-callback": function(){ send(""); }
  });
}
</script></body></html>`;

  const onMessage = (event: WebViewMessageEvent) => onToken(event.nativeEvent.data || null);

  // Fixed-size wrapper: a bare WebView flexes and would swallow the rest of the form.
  return (
    <View style={{ height: 70, marginTop: 10, overflow: "hidden" }}>
      <WebView
        // Turnstile validates the page hostname; baseUrl must be a hostname allowed on the widget.
        source={{ html, baseUrl: TURNSTILE_BASE_URL }}
        onMessage={onMessage}
        onError={() => onToken(null)}
        originWhitelist={["*"]}
        scrollEnabled={false}
        style={{ flex: 1, backgroundColor: colors.bg }}
      />
    </View>
  );
}
