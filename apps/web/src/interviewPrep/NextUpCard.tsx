import { pickNextUp, type NextUpKind } from "@grip/core/nextUp";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { NextUpLink, NextUpShell } from "../components/NextUpShell";
import type { StoredPrepPlan } from "../lib/prepPlanHandoff";

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

  return (
    <NextUpShell
      title={copy.title}
      sub={copy.sub}
      tone={copy.tone ?? ""}
      actionLabel={copy.action}
      onAction={() => onStart(primary)}
      busy={busy}
      disabled={disabled}
      error={error}
      links={
        <>
          {alternatives.map((kind) => (
            <NextUpLink key={kind} label={t(ALT_LABEL[kind])} onClick={() => onStart(kind)} disabled={disabled} />
          ))}
          <NextUpLink label={t("nextUp.altMock")} onClick={onMock} disabled={disabled} />
          {primary === "plan" && <NextUpLink label={t("prep.planDismiss")} onClick={onDismissPlan} muted withOr={false} />}
        </>
      }
    />
  );
}
