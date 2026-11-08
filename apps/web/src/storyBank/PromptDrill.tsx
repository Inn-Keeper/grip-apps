import React from "react";
import { PROMPTS } from "@grip/core/stories";
import { t } from "@grip/core/i18n";
import { colors, font, shadow } from "../lib/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { CompetencyBadge } from "./CompetencyBadge";
import { StoryCard } from "./StoryCard";
import type { Story } from "./types";
import { miniBtn } from "../components/fieldStyles";

type Prompt = { text: string; competency: string };
type PromptState = { promptIdx: number; revealed: boolean };

export function PromptDrill({ stories, state, onChange, onAddStory }: {
  stories: Story[];
  state: PromptState;
  onChange: (state: PromptState) => void;
  onAddStory: (competency: string) => void;
}) {
  const { promptIdx, revealed } = state;

  const prompt = PROMPTS[promptIdx] as Prompt | undefined;
  const matching = stories.filter((s) => s.competency === prompt?.competency);

  const nextPrompt = () => {
    let next = Math.floor(Math.random() * PROMPTS.length);
    if (next === promptIdx) next = (next + 1) % PROMPTS.length;
    onChange({ promptIdx: next, revealed: false });
  };

  return (
    <div>
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.borderSoft}`,
          boxShadow: shadow.card,
          borderRadius: 14,
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <CompetencyBadge competency={prompt?.competency ?? ""} />
        </div>
        <p style={{
            margin: "0 0 8px",
            fontSize: font.size.title,
            fontWeight: 600,
            lineHeight: 1.5,
            color: colors.textBright
          }}>
          "{prompt?.text}"
        </p>
        <p style={{
            margin: "0 0 20px",
            fontSize: font.size.small,
            color: colors.textFaint
          }}>
          {t("stories.answerOutLoud")}
        </p>
        <div style={{
            display: "flex",
            gap: 10,
            justifyContent: "center"
          }}>
          <button
            onClick={() => onChange({ promptIdx, revealed: true })}
            disabled={revealed}
            style={{
              padding: "9px 18px",
              background: colors.accent,
              border: "none",
              borderRadius: 8,
              color: colors.onAccent,
              fontSize: font.size.body,
              fontWeight: 600,
              cursor: revealed ? "default" : "pointer",
              opacity: revealed ? 0.5 : 1,
            }}
          >
            {t("stories.reveal")}
          </button>
          <button
            onClick={nextPrompt}
            style={{
              padding: "9px 18px",
              background: "transparent",
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 8,
              color: colors.textDim,
              fontSize: font.size.body,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("stories.nextPrompt")}
          </button>
        </div>
      </div>

      {revealed && (
        <div style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}>
          {matching.length === 0 ? (
            <div role="status">
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  color: colors.warningBright,
                  fontSize: font.size.body,
                  textAlign: "center",
                }}
              >
                <BrandIcon name="warning" color={colors.warningBright} size={14} />
                <span>
                  {t("stories.noStoryFor", { competency: prompt?.competency ? t(`enum.competency.${prompt.competency}` as Parameters<typeof t>[0]) : "" })}
                </span>
              </p>
              {prompt && <button type="button" onClick={() => onAddStory(prompt.competency)} style={miniBtn(colors.accentBright ?? "")}>
                {t("stories.writeFor", { competency: t(`enum.competency.${prompt.competency}` as Parameters<typeof t>[0]) })}
              </button>}
            </div>
          ) : (
            matching.map((s) => <StoryCard key={s.id} story={s} readOnly />)
          )}
        </div>
      )}
    </div>
  );
}
