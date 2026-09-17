import { useState } from "react";
import { ESTIMATE_TARGETS, deriveScale, formatCompact, gradeEstimate } from "@grip/core/estimation";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import type { AugmentedScenario } from "./types";

const DAYS_PER_YEAR = 365;

const formatRetention = (days: number) =>
  days >= DAYS_PER_YEAR
    ? t("scale.years", { count: Math.round((days / DAYS_PER_YEAR) * 10) / 10 })
    : t("scale.days", { count: days });

const BAND_STYLE = {
  close: { color: () => colors.successBright, icon: "check", label: "scale.bandClose" },
  order: { color: () => colors.successBright, icon: "check", label: "scale.bandOrder" },
  off: { color: () => colors.dangerBright, icon: "error", label: "scale.bandOff" },
} as const;

export function ScaleBrief({ scenario }: { scenario: AugmentedScenario }) {
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  // Custom scenarios have no scale givens, so there's nothing to estimate.
  if (!scenario.scale) return null;
  const derived = deriveScale(scenario.scale);
  const { dau, actionsPerUserPerDay, writesPerUserPerDay, payloadKb, retentionDays } = scenario.scale;

  const givens = [
    { label: t("scale.dauLabel"), value: formatCompact(dau) },
    { label: t("scale.actionsLabel"), value: formatCompact(actionsPerUserPerDay) },
    { label: t("scale.writesLabel"), value: formatCompact(writesPerUserPerDay) },
    { label: t("scale.payloadLabel"), value: `${formatCompact(payloadKb)} KB` },
    { label: t("scale.retentionLabel"), value: formatRetention(retentionDays) },
  ];

  return (
    <details open
      style={{
        padding: "14px 16px",
        marginBottom: 14,
        background: colors.well,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
      }}
    >
      <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700, color: colors.textBright, marginBottom: 10 }}>
        {t("scale.title")}
      </summary>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <BrandIcon name="accuracy" color={colors.accentBright} size={15} />
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.textBright }}>{t("scale.title")}</h2>
        <span style={{ fontSize: 11, color: colors.textFaint }}>{t("scale.subtitle")}</span>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 14 }}>
        {givens.map((given) => (
          <div key={given.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.textFaint, letterSpacing: "0.03em" }}>
              {given.label.toUpperCase()}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: colors.text, fontVariantNumeric: "tabular-nums" }}>
              {given.value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {ESTIMATE_TARGETS.map((target) => {
          const actual = target.valueOf(derived);
          const grade = checked ? gradeEstimate(actual, guesses[target.id]) : null;
          const band = grade?.band ? BAND_STYLE[grade.band] : null;
          return (
            <div key={target.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>
                {target.label} <span style={{ color: colors.textFaint, fontWeight: 600 }}>({target.unit})</span>
              </label>
              <span style={{ fontSize: 11, color: colors.textFaint }}>{target.hint}</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={guesses[target.id] ?? ""}
                placeholder={t("scale.placeholder")}
                onChange={(e) => {
                  setGuesses((prev) => ({ ...prev, [target.id]: e.target.value }));
                  setChecked(false);
                }}
                style={{
                  padding: "7px 10px",
                  background: colors.bgDeep,
                  border: `1px solid ${band ? band.color() : colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 13,
                  fontVariantNumeric: "tabular-nums",
                }}
              />
              {band && grade?.ratio !== null && grade !== null && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: band.color() }}>
                  <BrandIcon name={band.icon} color={band.color()} size={13} />
                  {t(band.label)} — {t("scale.actual", { value: formatCompact(Math.round(actual)) })}{" "}
                  <span style={{ color: colors.textFaint }}>
                    {grade.ratio >= 1
                      ? t("scale.ratioHigh", { ratio: formatCompact(Math.round(grade.ratio * 10) / 10) })
                      : t("scale.ratioLow", { ratio: formatCompact(Math.round((1 / grade.ratio) * 10) / 10) })}
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setChecked(true)}
        style={{
          marginTop: 12,
          padding: "7px 16px",
          background: "transparent",
          border: `1px solid ${colors.accent}`,
          borderRadius: 8,
          color: colors.accentBright,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {t("scale.check")}
      </button>
    </details>
  );
}
