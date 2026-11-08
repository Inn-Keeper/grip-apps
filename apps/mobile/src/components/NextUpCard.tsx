import { Text, TouchableOpacity, View } from "react-native";
import { pickNextUp, type NextUpKind } from "@grip/core/nextUp";
import { t } from "@grip/core/i18n";
import type { PrepPlan } from "@/lib/uiStore";
import { alpha, colors, font, shadow } from "@/theme";
import { tints } from "@grip/core/tokens";
import { BrandIcon } from "@/components/BrandIcon";

type Props = {
  reviewDueCount: number;
  plan: PrepPlan | null;
  attempts: number;
  /** No generated playbook yet: offer the wizard, which lives on web for now. */
  needsSetup: boolean;
  busy: boolean;
  onStart: (kind: NextUpKind) => void;
  onMock: () => void;
  onDismissPlan: () => void;
};

const ALT_LABEL: Record<NextUpKind, Parameters<typeof t>[0]> = {
  review: "nextUp.altReview",
  plan: "nextUp.altPlan",
  weakest: "nextUp.altWeakest",
  warmup: "nextUp.altWarmup",
  setup: "nextUp.altSetup",
};

// The one suggested action at the top of Prep; the other available actions stay one tap away.
export function NextUpCard({ reviewDueCount, plan, attempts, needsSetup, busy, onStart, onMock, onDismissPlan }: Props) {
  const { primary, alternatives } = pickNextUp({ reviewDueCount, hasPlan: !!plan, attempts, needsSetup });

  const copy = {
    review: { title: t("nextUp.reviewTitle", { count: reviewDueCount }), sub: t("nextUp.reviewSub"), action: t("prep.reviewNow"), tone: colors.warning },
    plan: {
      title: t("prep.planBanner", { name: plan?.name ?? "" }),
      sub: `${plan?.deadline ? t("prep.planDeadline", { date: plan.deadline }) : t("prep.planDeadlineNone")} · ${plan?.techs.join(", ") ?? ""}`,
      action: t("prep.planStart"),
      tone: colors.accent,
    },
    weakest: { title: t("nextUp.weakestTitle"), sub: t("nextUp.weakestSub"), action: t("prep.drillWeakest"), tone: colors.accent },
    warmup: { title: t("nextUp.warmupTitle"), sub: t("nextUp.warmupSub"), action: t("nextUp.warmupAction"), tone: colors.accent },
    setup: { title: t("nextUp.setupTitle"), sub: `${t("nextUp.setupSub")} ${t("nextUp.setupWebHint")}`, action: t("nextUp.setupAction"), tone: colors.accent },
  }[primary];

  return (
    <View
      accessibilityLabel={t("nextUp.label")}
      style={{
        padding: 14,
        gap: 6,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: alpha(copy.tone, 0.38),
        boxShadow: shadow.card,
        backgroundColor: colors.surface
      }}
    >
      <Text style={{
          fontSize: font.size.captionLg,
          fontWeight: "700",
          letterSpacing: 0.8,
          color: copy.tone
        }}>{t("nextUp.label").toUpperCase()}</Text>
      <Text style={{
          fontSize: font.size.bodyLg,
          fontWeight: "700",
          color: colors.textBright
        }}>{copy.title}</Text>
      <Text style={{
          fontSize: font.size.small,
          lineHeight: 17,
          color: colors.textDim
        }}>{copy.sub}</Text>

      <TouchableOpacity
        onPress={() => onStart(primary)}
        disabled={busy}
        accessibilityRole="button"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          marginTop: 6,
          paddingVertical: 11,
          borderRadius: 10,
          backgroundColor: copy.tone,
          opacity: busy ? 0.6 : 1,
        }}
      >
        <BrandIcon name={primary === "setup" ? "spark" : "drill"} color={colors.onAccent} size={14} />
        <Text style={{
            fontSize: font.size.bodyMd,
            fontWeight: "700",
            color: colors.onAccent
          }}>{busy ? t("common.loading") : copy.action}</Text>
      </TouchableOpacity>

      {/* The mock loop is always on offer, as on web. */}
      <View style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 12,
          marginTop: 4
        }}>
        {alternatives.filter((kind) => kind !== "setup").map((kind) => (
          <TouchableOpacity key={kind} onPress={() => onStart(kind)} disabled={busy} accessibilityRole="button">
            <Text style={{
                fontSize: font.size.small,
                color: colors.textFaint
              }}>
              {t("nextUp.or")} <Text style={{
                  color: colors.accentBright,
                  fontWeight: "600"
                }}>{t(ALT_LABEL[kind])}</Text>
            </Text>
          </TouchableOpacity>
        ))}
        {alternatives.includes("setup") && <SetupPill onPress={() => onStart("setup")} disabled={busy} />}
        <TouchableOpacity onPress={onMock} disabled={busy} accessibilityRole="button">
          <Text style={{
              fontSize: font.size.small,
              color: colors.textFaint
            }}>
            {t("nextUp.or")} <Text style={{
                color: colors.accentBright,
                fontWeight: "600"
              }}>{t("nextUp.altMock")}</Text>
          </Text>
        </TouchableOpacity>
        {primary === "plan" && (
          <TouchableOpacity onPress={onDismissPlan} accessibilityRole="button">
            <Text style={{
                fontSize: font.size.small,
                color: colors.textFaint,
                textDecorationLine: "underline"
              }}>{t("prep.planDismiss")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// The playbook is Grip's standout feature, so its alternative is a pill, not a quiet "or" link.
function SetupPill({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 4,
        paddingLeft: 6,
        paddingRight: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.accent,
        backgroundColor: tints.accentSoft
      }}
    >
      <Text style={{
          paddingHorizontal: 7,
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: colors.accent,
          color: colors.onAccent,
          fontSize: font.size.caption,
          fontWeight: "700"
        }}>{t("nextUp.new")}</Text>
      <BrandIcon name="spark" color={colors.accentBright} size={13} />
      <Text style={{
          fontSize: font.size.small,
          fontWeight: "700",
          color: colors.accentBright
        }}>{t("nextUp.setupTitle")}</Text>
    </TouchableOpacity>
  );
}

