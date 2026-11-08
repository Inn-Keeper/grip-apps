import type { ReactNode } from "react";
import { t } from "@grip/core/i18n";
import { colors, font, radius, space } from "../lib/tokens";
import { useGradingStatusQuery } from "../archBoard/queries";
import { playbookApi } from "../lib/api";
import { dimText, ghostBtn, stackCol } from "./styles";
import type { StepProps } from "./types";

type Key = Parameters<typeof t>[0];

function Row({ label, onEdit, children }: { label: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: space.md
      }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
            ...dimText,
            fontSize: font.size.label
          }}>{label}</div>
        <div style={{ color: colors.text }}>{children}</div>
      </div>
      <button type="button" aria-label={t("firstRun.review.edit", { section: label })} onClick={onEdit} style={ghostBtn}>
        {t("firstRun.review.edit", { section: "" }).trim()}
      </button>
    </div>
  );
}

export function StepReview({ state, dispatch }: StepProps) {
  const provider = useGradingStatusQuery().data?.provider ?? "gemini";
  const goTo = (step: string) => () => dispatch({ type: "goTo", step });
  const notes = state.notes.filter((n) => n.trim()).length;
  const experience = [state.cvText && t("firstRun.review.cvAdded"), notes > 0 && t("firstRun.review.notesAdded", { count: notes })]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={stackCol()}>
      <div style={{
          ...stackCol(space.lg),
          padding: space.xl,
          borderRadius: radius.md,
          border: `1px solid ${colors.borderSoft}`,
          background: colors.surface
        }}>
        <Row label={t("firstRun.review.stack")} onEdit={goTo("stack")}>
          {state.stack.length ? state.stack.join(", ") : t("firstRun.review.fundamentals")}
        </Row>
        <Row label={t("firstRun.review.goal")} onEdit={goTo("goal")}>
          {state.goal ? t(`firstRun.goal.${state.goal}` as Key) : t("firstRun.review.none")}
          {state.brief && <div style={dimText}>{state.brief}</div>}
        </Row>
        <Row label={t("firstRun.review.role")} onEdit={goTo("role")}>
          {state.role || t("firstRun.review.none")}
          {state.jobText && <div style={dimText}>{t("firstRun.review.jobAdded")}</div>}
        </Row>
        <Row label={t("firstRun.review.experience")} onEdit={goTo("experience")}>
          {experience || t("firstRun.review.none")}
        </Row>
      </div>
      {playbookApi && (
        <p style={dimText}>
          {t("firstRun.review.provider", { provider: t(`firstRun.review.provider.${provider}` as Key) })}
        </p>
      )}
    </div>
  );
}
