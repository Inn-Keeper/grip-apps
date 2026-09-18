import { useEffect, useRef } from "react";
import { t } from "@grip/core/i18n";
import { colors, shadow, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import {
  MAINT_LEAN_MAX,
  MAINT_MODERATE_MAX,
  REVIEW_SCORE,
  SHIP_SCORE,
} from "./constants";
import type { AugmentedScenario } from "./types";

type EvalResult = {
  score: number;
  cost: number;
  maint: number;
  checks: { label: string; passed: boolean; points: number }[];
  warnings: string[];
};

export function EvalResults({
  result,
  scenario,
  pushback = [],
  showScore = true,
}: {
  result: EvalResult;
  scenario: AugmentedScenario;
  pushback?: string[];
  // Off on the Arch Board, whose right rail already shows the score, cost and maintenance (rule 6).
  showScore?: boolean;
}) {
  // Results render below the canvas; bring them into view so "Evaluate design" visibly answers.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  return (
    <div
      ref={ref}
      aria-live="polite"
      style={{
        // Clears the sticky app header.
        scrollMarginTop: 96,
        marginTop: 16,
        padding: "18px 20px",
        background: colors.surface,
        border: `1px solid ${colors.borderSoft}`,
        boxShadow: shadow.card,
        borderRadius: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        {showScore && (
          <span
            style={{
              fontSize: font.size.display,
              fontWeight: 700,
              color: result.score >= SHIP_SCORE ? colors.success : result.score >= REVIEW_SCORE ? colors.warning : colors.danger,
            }}
          >
            {result.score}% <span style={{ fontSize: font.size.small, color: colors.textDim }}>{t("board.eval.coverage")}</span>
          </span>
        )}
        <span style={{ fontSize: font.size.body, fontWeight: 600, color: colors.textBright }}>
          {result.score >= SHIP_SCORE ? t("board.eval.complete") : t("board.eval.partial")}
        </span>
        {showScore && (
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: font.size.small,
            color: colors.textDim,
          }}
        >
          <BrandIcon name="cost" color={colors.textDim} size={14} />
          {t("board.eval.cost", { cost: result.cost, budget: scenario.budget })}
          <BrandIcon name="maintenance" color={colors.textDim} size={14} />
          {t("board.eval.maint", {
            value: result.maint,
            level: t(result.maint <= MAINT_LEAN_MAX ? "board.eval.lean" : result.maint <= MAINT_MODERATE_MAX ? "board.eval.moderate" : "board.eval.heavy"),
          })}
        </span>
        )}
      </div>
      <p style={{ margin: "-6px 0 14px", fontSize: font.size.small, color: colors.textFaint }}>
        {t("board.eval.intro")}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        <div>
          <div style={{ fontSize: font.size.label, fontWeight: 700, color: colors.textDim, marginBottom: 8, letterSpacing: "0.04em" }}>
            {t("board.designChecks")}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {result.checks.map((check) => (
              <li
                key={check.label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 7,
                  fontSize: font.size.body,
                  lineHeight: 1.5,
                  color: check.passed ? colors.successBright : colors.dangerBright,
                }}
              >
                <BrandIcon
                  name={check.passed ? "check" : "error"}
                  color={check.passed ? colors.successBright : colors.dangerBright}
                  size={14}
                />
                <span style={{ flex: 1 }}>
                  {check.label} <span style={{ color: colors.textFaint }}>{t("board.eval.points", { points: check.points })}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {result.warnings.length > 0 && (
          <div>
            <div style={{ fontSize: font.size.label, fontWeight: 700, color: colors.textDim, marginBottom: 8, letterSpacing: "0.04em" }}>
              {t("board.eval.warnings", { count: result.warnings.length })}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {result.warnings.map((warning) => (
                <li
                  key={warning}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 7,
                    fontSize: font.size.body,
                    lineHeight: 1.5,
                    color: colors.warningBright,
                  }}
                >
                  <BrandIcon name="warning" color={colors.warningBright} size={14} />
                  <span style={{ flex: 1 }}>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {pushback.length > 0 && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${colors.borderSoft}` }}>
          <div style={{ fontSize: font.size.label, fontWeight: 700, color: colors.textDim, marginBottom: 8, letterSpacing: "0.04em" }}>
            {t("board.pushback").toUpperCase()}
          </div>
          <p style={{ margin: "0 0 10px", fontSize: font.size.small, color: colors.textFaint }}>{t("board.pushbackHint")}</p>
          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            {pushback.map((question) => (
              <li key={question} style={{ fontSize: font.size.body, lineHeight: 1.55, color: colors.text }}>
                {question}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
