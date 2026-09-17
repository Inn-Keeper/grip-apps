import { t } from "@grip-apps/core/i18n";
import { colors } from "@grip-apps/core/tokens";
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
}: {
  result: EvalResult;
  scenario: AugmentedScenario;
  pushback?: string[];
}) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: "18px 20px",
        background: colors.well,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: result.score >= SHIP_SCORE ? colors.success : result.score >= REVIEW_SCORE ? colors.warning : colors.danger,
          }}
        >
          {result.score}% <span style={{ fontSize: 12, color: colors.textDim }}>checklist coverage</span>
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.textBright }}>
          {result.score >= SHIP_SCORE ? "Checklist complete" : "Checklist partially complete"}
        </span>
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            color: colors.textDim,
          }}
        >
          <BrandIcon name="cost" color={colors.textDim} size={14} />
          cost units {result.cost}/{scenario.budget} ·
          <BrandIcon name="maintenance" color={colors.textDim} size={14} />
          maint {result.maint} (
          {result.maint <= MAINT_LEAN_MAX ? "lean" : result.maint <= MAINT_MODERATE_MAX ? "moderate" : "heavy"})
        </span>
      </div>
      <p style={{ margin: "-6px 0 14px", fontSize: 12, color: colors.textFaint }}>
        Checks matched for this scenario; review the warnings and explain your trade-offs.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.textDim, marginBottom: 8, letterSpacing: "0.04em" }}>
            DESIGN CHECKS
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {result.checks.map((check) => (
              <li
                key={check.label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 7,
                  fontSize: 12.5,
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
                  {check.label} <span style={{ color: colors.textFaint }}>({check.points} pts)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {result.warnings.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textDim, marginBottom: 8, letterSpacing: "0.04em" }}>
              DESIGN WARNINGS ({result.warnings.length})
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {result.warnings.map((warning) => (
                <li
                  key={warning}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 7,
                    fontSize: 12.5,
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
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.textDim, marginBottom: 8, letterSpacing: "0.04em" }}>
            {t("board.pushback").toUpperCase()}
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 11.5, color: colors.textFaint }}>{t("board.pushbackHint")}</p>
          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            {pushback.map((question) => (
              <li key={question} style={{ fontSize: 12.5, lineHeight: 1.55, color: colors.text }}>
                {question}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
