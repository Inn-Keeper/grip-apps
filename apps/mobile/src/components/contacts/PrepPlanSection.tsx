import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { buildPrepPlan } from "@grip/core/prepPlan";
import { readinessSignals } from "@grip/core/readiness";
import { t } from "@grip/core/i18n";
import { alpha, colors, font, tints } from "@/theme";
import { setPrepPlan } from "@/lib/uiStore";
import type { Contact } from "@grip/core/api";
import type { StoryItem } from "./StoryMatchSection";

// How many weakest posting techs the plan surfaces and hands to the Prep drill.
const PLAN_TECH_COUNT = 5;

export function PrepPlanSection({
  contact,
  answers,
  stories,
  boards,
}: {
  contact: Contact;
  answers: Record<string, { correct: number; wrong: number }> | null;
  stories: StoryItem[] | null;
  boards: { topology: number; talkGrade: number | null }[] | null;
}) {
  const router = useRouter();
  const plan = buildPrepPlan({ techs: contact.postingTechs, answers: answers ?? {}, deadline: contact.nextActionDate });
  // Separate evidence, no composite score; null inputs read as unavailable, not 0.
  const signals = readinessSignals({ postingTechs: contact.postingTechs, answers, stories, boards });
  const focus = plan.items.slice(0, PLAN_TECH_COUNT);

  const startPlanDrill = () => {
    setPrepPlan({
      name: contact.name,
      deadline: contact.nextActionDate,
      techs: focus.map((item) => item.tech),
    });
    router.navigate("/");
  };

  return (
    <View
      style={{
        padding: 10,
        backgroundColor: tints.accentSoft,
        borderWidth: 1,
        borderColor: alpha(colors.accent, 0.25),
        borderRadius: 8,
        gap: 8,
      }}
    >
      <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap"
        }}>
        <Text style={{
            fontSize: font.size.label,
            fontWeight: "700",
            color: colors.accentBright,
            letterSpacing: 0.5
          }}>
          {t("plan.title").toUpperCase()}
        </Text>
        <Text style={{
            fontSize: font.size.label,
            color: colors.textDim,
            flex: 1
          }}>
          {contact.nextActionDate
            ? t("plan.deadline", { date: contact.nextActionDate, days: plan.daysLeft ?? 0 })
            : t("plan.noDeadline")}
        </Text>
      </View>

      <View style={{ gap: 2 }}>
        {signals.map((signal) => (
          <Text key={signal.id} accessibilityHint={signal.hint} style={{
              fontSize: font.size.label,
              color: colors.textDim
            }}>
            {signal.label}{" "}
            <Text style={{
                fontWeight: "700",
                color: signal.missing ? colors.textFaint : colors.text
              }}>{signal.value}</Text>
          </Text>
        ))}
      </View>

      <View style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center"
        }}>
        {focus.map((item) => (
          <View
            key={item.tech}
            style={{
              flexDirection: "row",
              gap: 5,
              paddingHorizontal: 9,
              paddingVertical: 3,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.well,
            }}
          >
            <Text style={{
                fontSize: font.size.label,
                color: colors.text
              }}>{item.tech}</Text>
            <Text
              style={{
                fontSize: font.size.label,
                fontWeight: "700",
                color: item.accuracy === null ? colors.warningBright : colors.textDim,
              }}
            >
              {item.accuracy === null ? t("plan.never") : `${item.accuracy}%`}
            </Text>
          </View>
        ))}
        <TouchableOpacity
          onPress={startPlanDrill}
          style={{
            marginLeft: "auto",
            paddingHorizontal: 12,
            paddingVertical: 5,
            backgroundColor: colors.accent,
            borderRadius: 8,
          }}
        >
          <Text style={{
              fontSize: font.size.label,
              fontWeight: "700",
              color: colors.onAccent
            }}>{t("plan.drillCta")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
