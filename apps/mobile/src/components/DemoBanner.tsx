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

  // One slim line, like web's demo bar: what this is, and a link to keep the progress.
  return (
    <View
      accessibilityRole="summary"
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        columnGap: 8,
        paddingHorizontal: 16,
        paddingVertical: 4,
        backgroundColor: `${colors.accent}14`,
        borderBottomWidth: 1,
        borderBottomColor: `${colors.accent}40`,
      }}
    >
      <Text style={{ fontSize: 11.5, color: colors.textDim }}>{t("demo.bar")}</Text>
      <TouchableOpacity onPress={keepProgress} disabled={busy} accessibilityRole="link" hitSlop={8}>
        <Text style={{ fontSize: 11.5, fontWeight: "700", color: colors.accentBright, opacity: busy ? 0.6 : 1 }}>{t("auth.github")}</Text>
      </TouchableOpacity>
      {error && <Text style={{ width: "100%", textAlign: "center", fontSize: 11.5, color: colors.dangerBright }}>{error}</Text>}
    </View>
  );
}
