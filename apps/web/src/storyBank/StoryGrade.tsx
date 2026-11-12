import { t } from "@grip/core/i18n";
import { STORY_SECTIONS, currentStoryGrade } from "@grip/core/storyGrade";
import type { StoryGradeResult } from "@grip/core/api";
import { colors, font } from "../lib/tokens";
import { miniBtn } from "../components/fieldStyles";
import { ErrorText } from "../components/ErrorText";
import spinner from "../components/Spinner.module.css";
import { storyGradeEnabled, useGradeStoryMutation } from "./queries";
import type { Story } from "./types";

// Same wording and colours as the talk-track verdicts.
const VERDICTS = {
  covered: { color: colors.successBright, key: "talk.verdictCovered" },
  thin: { color: colors.warningBright, key: "talk.verdictThin" },
  missing: { color: colors.textFaint, key: "talk.verdictMissing" },
} as const;

const small = { margin: 0, fontSize: font.size.small, lineHeight: 1.55 } as const;

// AI grade of one story: a verdict and the interviewer's next question per STAR section.
export function StoryGrade({ story }: { story: Story }) {
  const mutation = useGradeStoryMutation();
  if (!storyGradeEnabled || !story.id) return null;
  const grade = currentStoryGrade(story) as StoryGradeResult | null;
  const stale = !grade && Boolean(story.assessment);

  return (
    <div style={{
        marginTop: 16,
        paddingTop: 14,
        borderTop: `1px solid ${colors.borderSoft}`,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }}>
      <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap"
        }}>
        <button type="button" className={`tap ${spinner.withSpinner}`} disabled={mutation.isPending} aria-busy={mutation.isPending} onClick={() => mutation.mutate(story)} style={miniBtn(colors.accentBright ?? "")}>
          {mutation.isPending && <span aria-hidden="true" className={spinner.spinner} />}
          {mutation.isPending ? t("talk.grading") : t(grade || stale ? "stories.gradeAgain" : "stories.gradeAction")}
        </button>
        <span style={{
            ...small,
            color: colors.textFaint
          }}>{t(stale ? "stories.gradeStale" : "stories.gradeHint")}</span>
      </div>
      {mutation.error && <ErrorText>{`${t("talk.gradeFailed")}: ${mutation.error.message}`}</ErrorText>}
      {/* Always mounted so the result is announced when it arrives. */}
      <div role="status" style={{
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}>
        {grade && (
          <>
            <p style={{
                ...small,
                fontWeight: 700,
                color: colors.textBright
              }}>{t("stories.gradeScore", { score: grade.score })}</p>
            {STORY_SECTIONS.map((id) => {
              const graded = grade.suggestion.sections.find((item) => item.section === id);
              if (!graded) return null;
              const verdict = VERDICTS[graded.verdict];
              return (
                <p key={id} style={{
                    ...small,
                    color: colors.text
                  }}>
                  <strong>{t(`stories.${id}` as Parameters<typeof t>[0])}</strong>{" · "}
                  <span style={{
                      color: verdict.color,
                      fontWeight: 600
                    }}>{t(verdict.key)}</span>{" · "}
                  {graded.gap}
                </p>
              );
            })}
            <p style={{
                ...small,
                color: colors.text
              }}>
              <strong>{t("talk.gradeFollowup")}</strong> {grade.suggestion.hardest_followup}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
