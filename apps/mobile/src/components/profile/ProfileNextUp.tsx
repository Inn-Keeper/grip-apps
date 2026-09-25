import { Text, TouchableOpacity, View } from "react-native";
import { t } from "@grip/core/i18n";
import { colors, font, shadow } from "@/theme";

type Props = {
  title: string;
  sub: string;
  /** Null when the profile is complete: nothing is left to do. */
  action: { label: string; onPress: () => void } | null;
  disabled: boolean;
};

// The one next thing that makes the profile more useful, styled like Prep's Next Up.
export function ProfileNextUp({ title, sub, action, disabled }: Props) {
  return (
    <View
      accessibilityLabel={t("nextUp.label")}
      style={{ padding: 14, gap: 6, borderRadius: 14, borderWidth: 1, borderColor: `${colors.accent}60`, boxShadow: shadow.card, backgroundColor: colors.surface }}
    >
      <Text style={{ fontSize: font.size.captionLg, fontWeight: "800", letterSpacing: 0.8, color: colors.accent }}>{t("nextUp.label").toUpperCase()}</Text>
      <Text style={{ fontSize: font.size.bodyLg, fontWeight: "800", color: colors.textBright }}>{title}</Text>
      <Text style={{ fontSize: font.size.small, lineHeight: 17, color: colors.textDim }}>{sub}</Text>
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          disabled={disabled}
          accessibilityRole="button"
          style={{ alignItems: "center", marginTop: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.accent, opacity: disabled ? 0.6 : 1 }}
        >
          <Text style={{ fontSize: font.size.bodyMd, fontWeight: "800", color: colors.onAccent }}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
