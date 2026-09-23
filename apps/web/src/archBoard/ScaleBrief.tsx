import { useState } from "react";
import { ESTIMATE_TARGETS, deriveScale, formatCompact, gradeEstimate } from "@grip/core/estimation";
import { t } from "@grip/core/i18n";
import { colors, shadow, font } from "@grip/core/tokens";
import { AbbrText } from "../components/AbbrText";
import { BrandIcon } from "../components/BrandIcon";
import { InfoTip } from "../components/InfoTip";
import { scaleHandoff } from "./scaleHandoff.js";
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

export function ScaleBrief({
  scenario,
  onUseInTalkTrack,
}: {
  scenario: AugmentedScenario;
  /** Hands the givens and your own estimates to the Back-of-envelope section. */
  onUseInTalkTrack: ((text: string) => void) | null;
}) {
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

  const handoff = scaleHandoff({
    givenLabel: t("scale.givenLabel"),
    estimateLabel: t("scale.myEstimateLabel"),
    givens,
    estimates: ESTIMATE_TARGETS.map((target) => ({
      label: target.label,
      unit: target.unit,
      value: guesses[target.id] ?? "",
    })),
  });

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

      {/* Rows, not wrapped columns. In a narrow rail five stacked pairs broke
          into ragged groups that read as unrelated numbers instead of one
          brief; aligning label and value on a line makes it scannable. */}
      <dl style={{ margin: "12px 0 16px" }}>
        {givens.map((given, index) => (
          <div
            key={given.label}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              padding: "7px 0",
              borderTop: index === 0 ? "none" : `1px solid ${colors.borderSoft}`,
            }}
          >
            <dt style={{ fontSize: font.size.small, color: colors.textDim }}>{given.label}</dt>
            <dd style={{ margin: 0, fontSize: font.size.body, fontWeight: 800, color: colors.textBright, fontVariantNumeric: "tabular-nums" }}>
              {given.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* The brief has two halves and only the first was labelled, so the
          inputs read as another given rather than as the work. */}
      <h3 style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 10px", fontSize: font.size.label, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.textFaint }}>
        <BrandIcon name="drill" color={colors.textFaint} size={13} />
        {t("scale.deriveHeading")}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {ESTIMATE_TARGETS.map((target) => {
          const actual = target.valueOf(derived);
          const grade = checked ? gradeEstimate(actual, guesses[target.id]) : null;
          const band = grade?.band ? BAND_STYLE[grade.band] : null;
          return (
            <div key={target.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <label style={{ fontSize: font.size.small, fontWeight: 700, color: colors.text }}>
                  {target.label}{" "}
                  <span style={{ color: colors.textFaint, fontWeight: 600, whiteSpace: "nowrap" }}>
                    (<AbbrText>{target.unit}</AbbrText>)
                  </span>
                </label>
                {/* The formula stays one tap away instead of printed under every field. */}
                <InfoTip><AbbrText>{target.hint}</AbbrText></InfoTip>
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
                  {t(band.label)} · {t("scale.actual", { value: formatCompact(Math.round(actual)) })}{" "}
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

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        {/* Nothing estimated means nothing to grade: the same test the handoff uses. */}
        <button
          onClick={() => setChecked(true)}
          disabled={handoff === null}
          style={{
            padding: "7px 16px",
            background: "transparent",
            border: `1px solid ${handoff === null ? colors.borderSoft : colors.accent}`,
            borderRadius: 8,
            color: handoff === null ? colors.textFaint : colors.accentBright,
            fontSize: font.size.small,
            fontWeight: 600,
            cursor: handoff === null ? "default" : "pointer",
          }}
        >
          {t("scale.check")}
        </button>
        {/* The arithmetic done here is exactly what the Back-of-envelope section
            is graded on, so it should not have to be typed twice. */}
        {onUseInTalkTrack && (
          <button
            type="button"
            disabled={handoff === null}
            onClick={() => handoff && onUseInTalkTrack(handoff)}
            style={{
              padding: "7px 0",
              background: "transparent",
              border: "none",
              color: handoff === null ? colors.textFaint : colors.accentBright,
              fontSize: font.size.small,
              fontWeight: 600,
              textDecoration: handoff === null ? "none" : "underline",
              cursor: handoff === null ? "default" : "pointer",
            }}
          >
            {t("scale.useInTalkTrack")}
          </button>
        )}
      </div>
    </details>
  );
}
