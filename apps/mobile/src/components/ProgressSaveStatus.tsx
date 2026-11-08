import { Text, View } from "react-native";
import { t } from "@grip/core/i18n";
import { alpha, colors, font, tints } from "@/theme";
import { MiniButton } from "@/components/ui";
import type { SaveStatus } from "@/lib/useScores";

// Unsaved answers, a failed bonus or a failed score load, above the active task.
export function ProgressSaveStatus({ status }: { status: SaveStatus }) {
  const { pending, failed, bonusFailed, loadFailed, retry } = status;
  if (!failed && !bonusFailed && !loadFailed) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{
        margin: 12,
        marginBottom: 0,
        padding: 10,
        gap: 6,
        backgroundColor: tints.dangerSoft,
        borderWidth: 1,
        borderColor: alpha(colors.danger, 0.38),
        borderRadius: 10
      }}>
      {loadFailed && <Text style={{
          color: colors.dangerBright,
          fontSize: font.size.body
        }}>{t("prep.scoresLoadError")}</Text>}
      {failed > 0 && <Text style={{
          color: colors.dangerBright,
          fontSize: font.size.body
        }}>{t("prep.progressUnsavedMobile", { count: failed })}</Text>}
      {bonusFailed > 0 && <Text style={{
          color: colors.dangerBright,
          fontSize: font.size.body
        }}>{t("prep.bonusUnsaved")}</Text>}
      {failed > 0 && (
        <View style={{ alignSelf: "flex-end" }}>
          <MiniButton
            label={pending > 0 ? t("prep.progressSaving") : t("prep.progressRetry")}
            color={colors.dangerBright}
            onPress={() => { if (!pending) retry(); }}
          />
        </View>
      )}
    </View>
  );
}
