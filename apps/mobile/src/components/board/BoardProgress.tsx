import { Text, View } from "react-native";
import { WORKFLOW_STEPS, stepState } from "@grip/core/workflowState";
import { t } from "@grip/core/i18n";
import { colors, font, tints } from "@/theme";
import { MiniButton } from "@/components/ui";

type Props = {
  step: number;
  title: string;
  sub: string;
  /** Only when the step's action has no button elsewhere on screen. */
  action?: { label: string; onPress: () => void } | null;
};

// The web rail and Next Up card in one compact block: five numbered dots with the
// current step named, then what to do now. Finished steps stay marked done.
export function BoardProgress({ step, title, sub, action }: Props) {
  const current = WORKFLOW_STEPS.find((item) => item.step === step);
  return (
    <View style={{ gap: 6, padding: 10, borderRadius: 12, backgroundColor: tints.accentSoft }}>
      <View accessibilityRole="progressbar" accessibilityLabel={t("board.railLabel")} accessibilityValue={{ min: 1, max: WORKFLOW_STEPS.length, now: step }} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {WORKFLOW_STEPS.map((item) => {
          const state = stepState(item.step, step);
          return (
            <View
              key={item.step}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: state === "done" ? colors.successBright : state === "current" ? colors.accent : "transparent",
                borderWidth: state === "todo" ? 1 : 0,
                borderColor: colors.borderSoft,
              }}
            >
              <Text style={{ fontSize: font.size.caption, fontWeight: "800", color: state === "todo" ? colors.textFaint : colors.onAccent }}>
                {state === "done" ? "✓" : item.step}
              </Text>
            </View>
          );
        })}
        {current && (
          <Text style={{ marginLeft: 4, fontSize: font.size.label, fontWeight: "800", letterSpacing: 0.6, color: colors.accentBright }}>
            {t(current.labelKey as Parameters<typeof t>[0]).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: font.size.body, fontWeight: "700", color: colors.textBright }}>{title}</Text>
          <Text style={{ fontSize: font.size.labelLg, lineHeight: 16, color: colors.textDim }}>{sub}</Text>
        </View>
        {action && <MiniButton label={action.label} color={colors.accentBright} onPress={action.onPress} />}
      </View>
    </View>
  );
}
