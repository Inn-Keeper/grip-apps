import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { t } from "@grip/core/i18n";
import { linkGitHubIdentity } from "@/lib/oauth";
import { colors } from "@/theme";

// Shown to anonymous (demo) sessions. Linking GitHub upgrades the same user, so demo progress is kept.
export function DemoBanner() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keepProgress = async () => {
    setBusy(true);
    setError(null);
    try {
      await linkGitHubIdentity();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      accessibilityRole="summary"
      style={{
        marginHorizontal: 16,
        marginTop: 6,
        padding: 10,
        gap: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: `${colors.accent}40`,
        backgroundColor: `${colors.accent}14`,
      }}
    >
      <Text style={{ fontSize: 12, color: colors.text }}>{t("demo.banner")}</Text>
      <TouchableOpacity
        onPress={keepProgress}
        disabled={busy}
        accessibilityRole="button"
        style={{ alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onAccent }}>{t("demo.keepProgress")}</Text>
      </TouchableOpacity>
      {error && <Text style={{ fontSize: 12, color: colors.dangerBright }}>{error}</Text>}
    </View>
  );
}
