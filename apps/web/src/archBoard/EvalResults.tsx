import { useEffect, useRef } from "react";
import { t } from "@grip/core/i18n";
import { colors, shadow, font, tints } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import {
  MAINT_LEAN_MAX,
  MAINT_MODERATE_MAX,
  REVIEW_SCORE,
  SHIP_SCORE,
} from "./constants";
import type { AugmentedScenario } from "./types";
import { scrollBehavior } from "../lib/motion";

type Check = { label: string; passed: boolean; points: number };

type EvalResult = {
  score: number;
  cost: number;
  maint: number;
  checks: Check[];
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
    ref.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  }, [result]);

  return (
    <div
      ref={ref}
      aria-live="polite"
      style={{
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
      <ChecklistSummary checks={result.checks} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 18, marginTop: 16 }}>
        <Checklist checks={result.checks} />
        {result.warnings.length > 0 && (
          <section>
            <SectionHeading icon="warning" label={t("board.eval.warnings", { count: result.warnings.length })} />
            <ul style={{ ...listStyle, gap: 8 }}>
              {result.warnings.map((warning) => (
                <li
                  key={warning}
                  style={{
                    padding: "8px 12px",
                    background: tints.warningSoft,
                    borderLeft: `3px solid ${colors.warning}`,
                    borderRadius: 6,
                    fontSize: font.size.body,
                    lineHeight: 1.5,
                    color: colors.text,
                  }}
                >
                  {warning}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {pushback.length > 0 && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${colors.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: font.size.label, fontWeight: 700, color: colors.textDim, marginBottom: 8, letterSpacing: "0.04em" }}>
              <BrandIcon name="prompt" color={colors.textDim} size={13} />
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

const listStyle = { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" } as const;

function SectionHeading({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: font.size.label, fontWeight: 700, color: colors.textDim, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      <BrandIcon name={icon} color={colors.textDim} size={13} />
      {label}
    </div>
  );
}

// How much of the scenario's checklist the design earns, as a count and a bar.
function ChecklistSummary({ checks }: { checks: Check[] }) {
  const passed = checks.filter((c) => c.passed);
  const earned = passed.reduce((sum, c) => sum + c.points, 0);
  const total = checks.reduce((sum, c) => sum + c.points, 0);
  const pct = total ? Math.round((earned / total) * 100) : 0;
  return (
    <div>
      <p style={{ margin: "0 0 6px", fontSize: font.size.small, color: colors.textDim }}>
        {t("board.eval.summary", { passed: passed.length, total: checks.length, earned, points: total })}
      </p>
      <div role="presentation" style={{ height: 6, borderRadius: 3, background: colors.bgDeep, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: pct === 100 ? colors.success : colors.accent }} />
      </div>
    </div>
  );
}

// Missing checks lead as a to-do list, biggest points first; earned ones fold away until everything passes.
// A missing check is credit not yet earned, not an error, so nothing here is red.
function Checklist({ checks }: { checks: Check[] }) {
  const missing = checks.filter((c) => !c.passed).sort((a, b) => b.points - a.points);
  const done = checks.filter((c) => c.passed);
  return (
    <section>
      {missing.length > 0 && (
        <>
          <SectionHeading icon="evaluate" label={t("board.eval.missing", { count: missing.length })} />
          <ul style={{ ...listStyle, gap: 4 }}>
            {missing.map((check) => <CheckRow key={check.label} check={check} />)}
          </ul>
        </>
      )}
      {done.length > 0 && (
        <details open={missing.length === 0} style={{ marginTop: missing.length > 0 ? 12 : 0 }}>
          <summary style={{ cursor: "pointer", fontSize: font.size.label, fontWeight: 700, color: colors.textDim, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
            {t("board.eval.done", { count: done.length })}
          </summary>
          <ul style={{ ...listStyle, gap: 4 }}>
            {done.map((check) => <CheckRow key={check.label} check={check} />)}
          </ul>
        </details>
      )}
    </section>
  );
}

function CheckRow({ check }: { check: Check }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 10px", borderRadius: 8, background: check.passed ? "transparent" : colors.bgDeep }}>
      <span style={{ flex: "0 0 auto", display: "flex", marginTop: 3 }}>
        {check.passed ? (
          <BrandIcon name="check" color={colors.successBright} size={14} />
        ) : (
          <span aria-hidden="true" style={{ width: 12, height: 12, margin: 1, borderRadius: 6, border: `2px solid ${colors.textFaint}` }} />
        )}
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: font.size.body, lineHeight: 1.5, color: check.passed ? colors.textDim : colors.text }}>
        {check.label}
      </span>
      <span
        style={{
          flex: "0 0 auto",
          padding: "2px 8px",
          borderRadius: 10,
          fontSize: font.size.label,
          fontWeight: 700,
          background: check.passed ? "transparent" : tints.accentSoft,
          color: check.passed ? colors.textFaint : colors.accentBright,
        }}
      >
        {t(check.passed ? "board.eval.earnedPoints" : "board.eval.openPoints", { points: check.points })}
      </span>
    </li>
  );
}
