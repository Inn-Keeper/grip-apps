import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { EvalResult, Scenario } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, font, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { Button } from "@/components/ui";

type Props = {
  result: EvalResult | null;
  scenario: Scenario;
  pushback?: string[];
  onClose: () => void;
};

function verdict(score: number): { label: string; color: string } {
  if (score >= 80) return { label: t("board.verdictShip"), color: colors.success };
  if (score >= 50) return { label: t("board.verdictReview"), color: colors.warning };
  return { label: t("board.verdictWhiteboard"), color: colors.danger };
}

export function ResultSheet({ result, scenario, pushback = [], onClose }: Props) {
  if (!result) return null;
  const { label, color } = verdict(result.score);
  const maintLabel = result.maint <= 8 ? "lean" : result.maint <= 14 ? "moderate" : "heavy";

  return (
    // Modal's native slide animation — Reanimated entering animations
    // don't fire reliably inside RN Modals.
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: tints.modalScrim }} />
      <View
        style={{
          maxHeight: "75%",
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          padding: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
          <Text style={{ fontSize: font.size.statLg, fontWeight: "700", color }}>{result.score}%</Text>
          <Text style={{ fontSize: font.size.bodyMd, fontWeight: "600", color: colors.textBright, flex: 1 }}>{label}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <BrandIcon name="cost" color={colors.textDim} size={14} />
            <Text style={{ fontSize: font.size.small, color: colors.textDim }}>{result.cost}/{scenario.budget} budget</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <BrandIcon name="maintenance" color={colors.textDim} size={14} />
            <Text style={{ fontSize: font.size.small, color: colors.textDim }}>maintenance {result.maint} ({maintLabel})</Text>
          </View>
        </View>

        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: font.size.label, fontWeight: "700", color: colors.textDim, letterSpacing: 0.6 }}>
              {t("board.designChecks")}
            </Text>
            {result.checks.map((check) => (
              <View key={check.label} style={{ flexDirection: "row", alignItems: "flex-start", gap: 7 }}>
                <BrandIcon name={check.passed ? "check" : "error"} color={check.passed ? colors.successBright : colors.dangerBright} size={14} />
                <Text style={{ flex: 1, fontSize: font.size.smallLg, lineHeight: 18, color: check.passed ? colors.successBright : colors.dangerBright }}>
                  {check.label} ({check.points} pts)
                </Text>
              </View>
            ))}
          </View>

          {result.warnings.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: font.size.label, fontWeight: "700", color: colors.textDim, letterSpacing: 0.6 }}>
                {t("board.meetingNotes")}
              </Text>
              {result.warnings.map((warning) => (
                <View key={warning} style={{ flexDirection: "row", alignItems: "flex-start", gap: 7 }}>
                  <BrandIcon name="warning" color={colors.warningBright} size={14} />
                  <Text style={{ flex: 1, fontSize: font.size.smallLg, lineHeight: 18, color: colors.warningBright }}>{warning}</Text>
                </View>
              ))}
            </View>
          )}

          {pushback.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: font.size.label, fontWeight: "700", color: colors.textDim, letterSpacing: 0.6 }}>
                {t("board.pushback")}
              </Text>
              <Text style={{ fontSize: font.size.label, color: colors.textFaint }}>{t("board.pushbackHint")}</Text>
              {pushback.map((question, index) => (
                <View key={question} style={{ flexDirection: "row", alignItems: "flex-start", gap: 7 }}>
                  <Text style={{ fontSize: font.size.smallLg, lineHeight: 18, color: colors.textFaint, fontWeight: "700" }}>
                    {index + 1}.
                  </Text>
                  <Text style={{ flex: 1, fontSize: font.size.smallLg, lineHeight: 18, color: colors.text }}>{question}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={{ marginTop: 12, alignItems: "flex-end" }}>
          <Button label={t("common.close")} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
