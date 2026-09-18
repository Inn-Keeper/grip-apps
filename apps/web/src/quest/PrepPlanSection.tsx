import { buildPrepPlan } from "@grip/core/prepPlan";
import { computeReadiness } from "@grip/core/readiness";
import { t } from "@grip/core/i18n";
import { colors, tints } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { writePrepPlan } from "../lib/prepPlanHandoff";
import type { Contact, ScoredBoard } from "./types";

// How many weakest posting techs the plan surfaces and hands to the Prep drill.
const PLAN_TECH_COUNT = 5;

function ReadinessStat({ label, value }: { label: string; value: number | null }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4, fontSize: 11, color: colors.textDim }}>
      {label}
      <span style={{ fontWeight: 800, color: value === null ? colors.textFaint : colors.text }}>
        {value === null ? "--" : `${value}%`}
      </span>
    </span>
  );
}

export function PrepPlanSection({
  contact,
  answers,
  stories,
  boards,
}: {
  contact: Contact;
  answers: Record<string, { correct: number; wrong: number }>;
  stories: { competency: string }[];
  boards: ScoredBoard[];
}) {
  const plan = buildPrepPlan({
    techs: contact.postingTechs,
    answers,
    deadline: contact.nextActionDate,
  });
  const readiness = computeReadiness({
    postingTechs: contact.postingTechs,
    answers,
    stories,
    boards,
  });
  const focus = plan.items.slice(0, PLAN_TECH_COUNT);

  const startPlanDrill = () => {
    writePrepPlan({
      name: contact.name,
      deadline: contact.nextActionDate,
      techs: focus.map((item) => item.tech),
    });
    window.dispatchEvent(new CustomEvent("grip:navigate", { detail: "prep" }));
  };

  return (
    <div
      style={{
        marginTop: 10,
        padding: "10px 12px",
        background: tints.accentSoft,
        border: `1px solid ${colors.accent}40`,
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: colors.accentBright, letterSpacing: "0.05em" }}>
          <BrandIcon name="drill" color={colors.accentBright} size={13} />
          {t("plan.title").toUpperCase()}
        </span>
        <span style={{ fontSize: 11, color: colors.textDim }}>
          {contact.nextActionDate
            ? t("plan.deadline", { date: contact.nextActionDate, days: plan.daysLeft ?? 0 })
            : t("plan.noDeadline")}
        </span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 10 }}>
          <ReadinessStat label={t("plan.readiness")} value={readiness.overall} />
          <ReadinessStat label={t("plan.readinessPrep")} value={readiness.prep} />
          <ReadinessStat label={t("plan.readinessStories")} value={readiness.stories} />
          <ReadinessStat label={t("plan.readinessBoards")} value={readiness.arch} />
          {readiness.archTopology !== null && (
            <span
              style={{ fontSize: 10.5, color: colors.textFaint }}
              title={t("plan.readinessBoardsSplitHint")}
            >
              {t("plan.readinessBoardsSplit", {
                design: readiness.archTopology,
                talk: readiness.archTalk === null ? "--" : `${readiness.archTalk}%`,
              })}
            </span>
          )}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
        {focus.map((item) => (
          <span
            key={item.tech}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 9px",
              borderRadius: 999,
              border: `1px solid ${colors.borderSoft}`,
              background: colors.well,
              fontSize: 11,
              color: colors.text,
            }}
          >
            {item.tech}
            <span style={{ fontWeight: 800, color: item.accuracy === null ? colors.warningBright : colors.textDim }}>
              {item.accuracy === null ? t("plan.never") : `${item.accuracy}%`}
            </span>
          </span>
        ))}
        <button
          onClick={startPlanDrill}
          style={{
            marginLeft: "auto",
            padding: "4px 12px",
            background: colors.accent,
            border: "none",
            borderRadius: 8,
            color: colors.onAccent,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t("plan.drillCta")}
        </button>
      </div>
    </div>
  );
}
