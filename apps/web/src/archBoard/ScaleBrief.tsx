import { useState } from "react";
import { ESTIMATE_TARGETS, deriveScale, formatCompact, gradeEstimate } from "@grip/core/estimation";
import { t } from "@grip/core/i18n";
import { colors, shadow, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { InfoTip } from "../components/InfoTip";
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
        padding: 14,
        background: colors.surface,
        border: `1px solid ${colors.borderSoft}`,
        boxShadow: shadow.card,
        borderRadius: 8,
      }}
    >
      <summary style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: font.size.body, fontWeight: 800, color: colors.textBright }}>
        <BrandIcon name="accuracy" color={colors.accentBright} size={15} />
        {t("scale.title")}
        {/* How to use the brief, on demand. The ⓘ is its own button, so it doesn't fold the brief. */}
        <InfoTip>{t("scale.subtitle")}</InfoTip>
      </summary>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", margin: "12px 0 14px" }}>
        {givens.map((given) => (
          <div key={given.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: font.size.label, fontWeight: 700, color: colors.textFaint, letterSpacing: "0.03em" }}>
              {given.label.toUpperCase()}
            </span>
            <span style={{ fontSize: font.size.bodyLg, fontWeight: 700, color: colors.text, fontVariantNumeric: "tabular-nums" }}>
              {given.value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {ESTIMATE_TARGETS.map((target) => {
          const actual = target.valueOf(derived);
          const grade = checked ? gradeEstimate(actual, guesses[target.id]) : null;
          const band = grade?.band ? BAND_STYLE[grade.band] : null;
          return (
            <div key={target.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <label style={{ fontSize: font.size.small, fontWeight: 700, color: colors.text }}>
                  {target.label} <span style={{ color: colors.textFaint, fontWeight: 600 }}>({target.unit})</span>
                </label>
                {/* The formula stays one tap away instead of printed under every field. */}
                <InfoTip>{target.hint}</InfoTip>
              </div>
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
                  minHeight: 40,
                  padding: "10px 12px",
                  background: colors.bgDeep,
                  border: `1px solid ${band ? band.color() : colors.borderSoft}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: font.size.body,
                  fontVariantNumeric: "tabular-nums",
                }}
              />
              {band && grade?.ratio !== null && grade !== null && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: font.size.small, color: band.color() }}>
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
          fontSize: font.size.small,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {t("scale.check")}
      </button>
    </details>
  );
}
