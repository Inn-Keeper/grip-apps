import { pickNextUp, type NextUpKind } from "@grip/core/nextUp";
import { t } from "@grip/core/i18n";
import { colors, font, shadow } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import type { StoredPrepPlan } from "../lib/prepPlanHandoff";
import hover from "../components/HoverCard.module.css";

type Props = {
  reviewDueCount: number;
  plan: StoredPrepPlan | null;
  attempts: number;
  // busy: a session this card started is loading; disabled: any session is loading.
  busy: boolean;
  disabled: boolean;
  error: string | null;
  onStart: (kind: NextUpKind) => void;
  onMock: () => void;
  onDismissPlan: () => void;
};

const ALT_LABEL: Record<NextUpKind, Parameters<typeof t>[0]> = {
  review: "nextUp.altReview",
  plan: "nextUp.altPlan",
  weakest: "nextUp.altWeakest",
  warmup: "nextUp.altWarmup",
};

// The one suggested action at the top of Prep; the other available actions stay one click away.
export function NextUpCard({ reviewDueCount, plan, attempts, busy, disabled, error, onStart, onMock, onDismissPlan }: Props) {
  const { primary, alternatives } = pickNextUp({ reviewDueCount, hasPlan: !!plan, attempts });

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
  }[primary];

  const linkStyle = {
    background: "transparent", border: "none", padding: 0, color: colors.accentBright,
    fontSize: font.size.small, fontWeight: 600, cursor: disabled ? "default" : "pointer", textDecoration: "underline",
  } as const;

  return (
    <section
      aria-label={t("nextUp.label")}
      className={hover.hoverCard}
      style={{
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16, padding: "14px 16px",
        background: `linear-gradient(135deg, ${copy.tone}1A, ${colors.surface})`,
        border: `1px solid ${copy.tone}60`, borderRadius: 12, boxShadow: shadow.card,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: "1 1 260px" }}>
        <span style={{ fontSize: font.size.label, fontWeight: 800, letterSpacing: "0.08em", color: copy.tone, textTransform: "uppercase" }}>
          {t("nextUp.label")}
        </span>
        <span style={{ fontSize: font.size.bodyLg, fontWeight: 800, color: colors.textBright }}>{copy.title}</span>
        <span style={{ fontSize: font.size.small, color: colors.textDim }}>{copy.sub}</span>
        <span style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4, fontSize: font.size.small, color: colors.textFaint }}>
          {alternatives.map((kind) => (
            <span key={kind}>
              {t("nextUp.or")}{" "}
              <button type="button" disabled={disabled} onClick={() => onStart(kind)} style={linkStyle}>{t(ALT_LABEL[kind])}</button>
            </span>
          ))}
          <span>
            {t("nextUp.or")}{" "}
            <button type="button" disabled={disabled} onClick={onMock} style={linkStyle}>{t("nextUp.altMock")}</button>
          </span>
          {primary === "plan" && (
            <button type="button" onClick={onDismissPlan} style={{ ...linkStyle, color: colors.textFaint }}>{t("prep.planDismiss")}</button>
          )}
        </span>
        {error && (
          <span role="alert" style={{ marginTop: 4, fontSize: font.size.small, color: colors.warningBright }}>{error}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onStart(primary)}
        disabled={disabled}
        style={{
          display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
          background: copy.tone, border: "none", borderRadius: 9, color: colors.onAccent,
          fontSize: font.size.body, fontWeight: 800, cursor: busy ? "wait" : disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1,
        }}
      >
        <BrandIcon name="drill" color={colors.onAccent} size={14} />
        {busy ? t("common.loading") : copy.action}
      </button>
    </section>
  );
}
