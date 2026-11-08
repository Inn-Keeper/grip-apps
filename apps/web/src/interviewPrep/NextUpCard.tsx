import { pickNextUp, type NextUpKind } from "@grip/core/nextUp";
import { t } from "@grip/core/i18n";
import { font } from "@grip/core/tokens";
import { colors, tints } from "../lib/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { NextUpLink, NextUpShell } from "../components/NextUpShell";
import type { StoredPrepPlan } from "../lib/prepPlanHandoff";

type Props = {
  reviewDueCount: number;
  plan: StoredPrepPlan | null;
  attempts: number;
  /** No generated playbook yet: offer the first-run wizard. */
  needsSetup: boolean;
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
  setup: "nextUp.altSetup",
};

// The one suggested action at the top of Prep; the other available actions stay one click away.
export function NextUpCard({ reviewDueCount, plan, attempts, needsSetup, busy, disabled, error, onStart, onMock, onDismissPlan }: Props) {
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
    setup: { title: t("nextUp.setupTitle"), sub: t("nextUp.setupSub"), action: t("nextUp.setupAction"), tone: colors.accent },
  }[primary];

  return (
    <NextUpShell
      title={copy.title}
      sub={copy.sub}
      tone={copy.tone ?? ""}
      actionLabel={copy.action}
      actionIcon={primary === "setup" ? "spark" : undefined}
      onAction={() => onStart(primary)}
      busy={busy}
      disabled={disabled}
      error={error}
      links={
        <>
          {alternatives.filter((kind) => kind !== "setup").map((kind) => (
            <NextUpLink key={kind} label={t(ALT_LABEL[kind])} onClick={() => onStart(kind)} disabled={disabled} />
          ))}
          <NextUpLink label={t("nextUp.altMock")} onClick={onMock} disabled={disabled} />
          {alternatives.includes("setup") && <SetupPill onClick={() => onStart("setup")} disabled={disabled} />}
          {primary === "plan" && <NextUpLink label={t("prep.planDismiss")} onClick={onDismissPlan} muted withOr={false} />}
        </>
      }
    />
  );
}

// The playbook is Grip's standout feature, so its alternative is a pill, not a quiet "or" link.
function SetupPill({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px 4px 6px",
        borderRadius: 999,
        border: `1px solid ${colors.accent}`,
        background: tints.accentSoft,
        color: colors.accentBright,
        fontSize: font.size.small,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span style={{
          padding: "1px 7px",
          borderRadius: 999,
          background: colors.accent,
          color: colors.onAccent,
          fontSize: font.size.caption,
          letterSpacing: "0.04em"
        }}>{t("nextUp.new")}</span>
      <BrandIcon name="spark" color={colors.accentBright ?? ""} size={13} />
      {t("nextUp.setupTitle")}
    </button>
  );
}
