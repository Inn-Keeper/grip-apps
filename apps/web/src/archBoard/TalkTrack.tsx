import { SELF_RATING_MAX, TALK_TRACK_SECTIONS, scoreTalkTrack } from "@grip/core/talkTrack";
import { t } from "@grip/core/i18n";
import { colors, shadow, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { REVIEW_SCORE, SHIP_SCORE } from "./constants";
import type { TalkGradeResult } from "./types";

// Only an earned verdict carries colour. "missing" is the absence of credit,
// not a failure, and six red badges made an empty talk track look broken.
const VERDICTS = {
  covered: { color: colors.successBright, key: "talk.verdictCovered" },
  thin: { color: colors.warningBright, key: "talk.verdictThin" },
  missing: { color: colors.textFaint, key: "talk.verdictMissing" },
} as const;

export function TalkTrack({
  sections,
  rating,
  grade,
  gradeDetail,
  grading,
  gradeError,
  gradeBlocked,
  onGrade,
  onChangeSection,
  onChangeRating,
}: {
  sections: Record<string, string>;
  rating: number | null;
  grade: number | null;
  grading: boolean;
  gradeError: (Error & { status?: number }) | null;
  /** Localized reason grading is unavailable right now, or null when it is ready. */
  gradeBlocked: string | null;
  /** Already filtered by gradeState: null once the grade it belongs to is gone. */
  gradeDetail: TalkGradeResult | null;
  /** Null when VITE_AI_URL is unset, which hides the action entirely. */
  onGrade: (() => void) | null;
  onChangeSection: (id: string, value: string) => void;
  onChangeRating: (value: number | null) => void;
}) {
  const { answered, completion } = scoreTalkTrack({ sections, rating });
  const meterColor =
    completion >= SHIP_SCORE ? colors.success : completion >= REVIEW_SCORE ? colors.warning : colors.danger;
  const gradeColor = grade === null ? colors.textDim : grade >= SHIP_SCORE ? colors.successBright : grade >= REVIEW_SCORE ? colors.warningBright : colors.dangerBright;

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
        <h2 style={{ margin: 0, fontSize: font.size.body, fontWeight: 700, color: colors.textBright }}>{t("talk.title")}</h2>
        <span style={{ fontSize: font.size.label, fontWeight: 600, color: colors.textFaint }}>
          {t("talk.covered", { answered: answered.length, total: TALK_TRACK_SECTIONS.length })}
        </span>
        <div
          aria-hidden
          style={{ flex: 1, minWidth: 80, height: 4, borderRadius: 2, background: colors.borderSoft, overflow: "hidden" }}
        >
          <div style={{ width: `${completion}%`, height: "100%", background: meterColor }} />
        </div>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: font.size.small, lineHeight: 1.55, color: colors.textFaint }}>{t("talk.intro")}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {TALK_TRACK_SECTIONS.map((section) => {
          const value = sections[section.id] ?? "";
          const covered = answered.includes(section.id);
          const graded = gradeDetail?.suggestion.sections.find((item) => item.section === section.id);
          const verdict = graded ? VERDICTS[graded.verdict] : null;
          // "Missing" beside visible text reads as a contradiction. The service's
          // placeholder floor is what happened, so name it.
          const verdictKey = graded?.verdict === "missing" && value.trim() ? "talk.verdictTooThin" : verdict?.key;
          return (
            <label key={section.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <BrandIcon
                  name={covered ? "check" : "board"}
                  color={covered ? colors.successBright : colors.textFaint}
                  size={13}
                />
                <span style={{ fontSize: font.size.small, fontWeight: 700, color: colors.text }}>{section.label}</span>
                {verdict && verdictKey && (
                  <span style={{ marginLeft: "auto", fontSize: font.size.label, fontWeight: 700, color: verdict.color }}>
                    {t(verdictKey)}
                  </span>
                )}
              </span>
              <span style={{ fontSize: font.size.label, lineHeight: 1.5, color: colors.textFaint }}>{section.hint}</span>
              <textarea
                value={value}
                onChange={(e) => onChangeSection(section.id, e.target.value)}
                rows={4}
                style={{
                  resize: "vertical",
                  minHeight: 96,
                  padding: "10px 12px",
                  background: colors.bgDeep,
                  border: `1px solid ${covered ? `${colors.success}55` : colors.borderSoft}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: font.size.body,
                  lineHeight: 1.55,
                  fontFamily: "inherit",
                }}
              />
              {/* The quoted span the credit was given for — the grade's evidence. */}
              {graded?.evidence && (
                <span style={{ borderLeft: `2px solid ${verdict?.color ?? colors.borderSoft}`, paddingLeft: 8, fontSize: font.size.label, lineHeight: 1.5, fontStyle: "italic", color: colors.textDim }}>
                  {`\u201C${graded.evidence}\u201D`}
                </span>
              )}
              {/* Grading by absence: what an interviewer would still ask here. */}
              {graded && (
                <span style={{ fontSize: font.size.label, lineHeight: 1.5, color: colors.text }}>{graded.gap}</span>
              )}
            </label>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: font.size.small, fontWeight: 700, color: colors.text }}>{t("talk.ratingLabel")}</span>
        <span style={{ fontSize: font.size.label, color: colors.textFaint }}>{t("talk.ratingHint")}</span>
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
                  fontSize: font.size.small,
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

      {onGrade && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onGrade}
              disabled={grading || gradeBlocked !== null}
              aria-busy={grading}
              style={{
                padding: "8px 14px",
                background: gradeBlocked ? "transparent" : colors.accent,
                border: `1px solid ${gradeBlocked ? colors.borderSoft : colors.accent}`,
                borderRadius: 8,
                color: gradeBlocked ? colors.textDim : colors.onAccent,
                fontSize: font.size.small,
                fontWeight: 700,
                cursor: grading || gradeBlocked ? "default" : "pointer",
              }}
            >
              {grading ? t("talk.grading") : t("talk.gradeAction")}
            </button>
            {/* Rule 13: the reason and the result sit next to the button that was clicked. */}
            <span aria-live="polite" style={{ fontSize: font.size.label, color: colors.textFaint, flex: 1, minWidth: 140 }}>
              {gradeBlocked ?? (grade === null ? t("talk.gradeHint") : t("talk.gradeScore"))}
            </span>
            {grade !== null && (
              <span style={{ fontSize: font.size.body, fontWeight: 700, color: gradeColor }}>{grade}%</span>
            )}
          </div>

          {/* A 429 is already explained by the blocked line above. */}
          {gradeError && gradeError.status !== 429 && (
            <p role="alert" style={{ margin: "10px 0 0", fontSize: font.size.small, color: colors.dangerBright }}>
              {`${t("talk.gradeFailed")}: ${gradeError.message}`}
            </p>
          )}

          {gradeDetail && (
            <div aria-live="polite" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {gradeDetail.divergence !== null && gradeDetail.divergence > 0 && (
                <p style={{ margin: 0, fontSize: font.size.small, color: colors.warningBright }}>
                  {t("talk.gradeDivergence", { points: gradeDetail.divergence })}
                </p>
              )}
              <p style={{ margin: 0, fontSize: font.size.small, lineHeight: 1.55, color: colors.text }}>
                <span style={{ fontWeight: 700, color: colors.textDim }}>{t("talk.gradeFollowup")} </span>
                {gradeDetail.suggestion.hardest_followup}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
