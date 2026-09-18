import { SELF_RATING_MAX, TALK_TRACK_SECTIONS, scoreTalkTrack } from "@grip/core/talkTrack";
import { t } from "@grip/core/i18n";
import { colors, shadow } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { REVIEW_SCORE, SHIP_SCORE } from "./constants";

export function TalkTrack({
  sections,
  rating,
  onChangeSection,
  onChangeRating,
}: {
  sections: Record<string, string>;
  rating: number | null;
  onChangeSection: (id: string, value: string) => void;
  onChangeRating: (value: number | null) => void;
}) {
  const { answered, completion } = scoreTalkTrack({ sections, rating });
  const meterColor =
    completion >= SHIP_SCORE ? colors.success : completion >= REVIEW_SCORE ? colors.warning : colors.danger;

  return (
    <section
      style={{
        marginTop: 14,
        padding: "18px 20px",
        background: colors.surface,
        border: `1px solid ${colors.borderSoft}`,
        boxShadow: shadow.card,
        borderRadius: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <BrandIcon name="spark" color={colors.accentBright} size={16} />
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.textBright }}>{t("talk.title")}</h2>
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint }}>
          {t("talk.covered", { answered: answered.length, total: TALK_TRACK_SECTIONS.length })}
        </span>
        <div
          aria-hidden
          style={{ flex: 1, minWidth: 80, height: 4, borderRadius: 2, background: colors.borderSoft, overflow: "hidden" }}
        >
          <div style={{ width: `${completion}%`, height: "100%", background: meterColor }} />
        </div>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 12, lineHeight: 1.55, color: colors.textFaint }}>{t("talk.intro")}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {TALK_TRACK_SECTIONS.map((section) => {
          const value = sections[section.id] ?? "";
          const covered = answered.includes(section.id);
          return (
            <label key={section.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <BrandIcon
                  name={covered ? "check" : "board"}
                  color={covered ? colors.successBright : colors.textFaint}
                  size={13}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{section.label}</span>
              </span>
              <span style={{ fontSize: 11, lineHeight: 1.5, color: colors.textFaint }}>{section.hint}</span>
              <textarea
                value={value}
                onChange={(e) => onChangeSection(section.id, e.target.value)}
                rows={4}
                style={{
                  resize: "vertical",
                  padding: "8px 10px",
                  background: colors.bgDeep,
                  border: `1px solid ${covered ? `${colors.success}55` : colors.borderSoft}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  fontFamily: "inherit",
                }}
              />
            </label>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{t("talk.ratingLabel")}</span>
        <span style={{ fontSize: 11, color: colors.textFaint }}>{t("talk.ratingHint")}</span>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {Array.from({ length: SELF_RATING_MAX }, (_, i) => i + 1).map((value) => {
            const active = rating === value;
            return (
              <button
                key={value}
                onClick={() => onChangeRating(active ? null : value)}
                aria-pressed={active}
                style={{
                  width: 30,
                  height: 30,
                  background: active ? colors.accent : "transparent",
                  border: `1px solid ${active ? colors.accent : colors.borderSoft}`,
                  borderRadius: 8,
                  color: active ? colors.onAccent : colors.textDim,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
