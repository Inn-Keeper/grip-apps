import { Text, View } from "react-native";
import { t } from "@grip/core/i18n";
import { colors, font, radius, tints } from "@/theme";

// Linked or optional, for an account connection such as GitHub.
export function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: radius.pill,
        backgroundColor: connected ? tints.successSoft : colors.surfaceHi,
        borderWidth: 1,
        borderColor: connected ? colors.success : colors.border,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connected ? colors.successBright : colors.textFaint }} />
      <Text style={{ color: connected ? colors.successBright : colors.textFaint, fontSize: font.size.label, fontWeight: "800" }}>
        {connected ? t("profile.connectionLinked") : t("profile.connectionOptional")}
      </Text>
    </View>
  );
}
