import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SCENARIOS } from "@grip/core/arch";
import { PROMPTS } from "@grip/core/stories";
import { COMPETENCY_COLORS } from "@grip/core/stories";
import { composeMockLoop, scoreMockLoop, STORY_RATING_MAX } from "@grip/core/mockLoop";
import { t } from "@grip/core/i18n";
import { colors, tints, font, shadow } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { DrillSession } from "./DrillSession";
import type { DrillState } from "./types";

// One timed session composed from existing pieces: a quiz round, an Arch Board
// scenario, and a behavioral prompt, scored as a single loop.
// ponytail: the design round is self-reported (sketch it on the Arch Board or
// paper, then type the evaluation score back); deep-linking the board into the
// loop with auto-scoring is the upgrade path.

type Stage = "quiz" | "arch" | "story" | "summary";

type Scenario = { id: string; name: string; brief: string; budget: number };
type Prompt = { competency: string; text: string };

const stageStyles: CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.borderSoft}`,
  borderRadius: 14,
  boxShadow: shadow.card,
  padding: "22px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

function StageHeader({ label, onExit }: { label: string; onExit: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: font.size.label, fontWeight: 800, color: colors.accentBright, letterSpacing: "0.08em" }}>
        {label.toUpperCase()}
      </span>
      <button
        onClick={onExit}
        style={{
          padding: "3px 10px",
          background: "transparent",
          border: `1px solid ${colors.borderSoft}`,
          borderRadius: 8,
          color: colors.textFaint,
          fontSize: font.size.caption,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {t("prep.exit")}
      </button>
    </div>
  );
}

export function MockLoop({
  drill,
  onAnswer,
  onNextQuestion,
  onExit,
}: {
  drill: DrillState;
  onAnswer: (i: number) => void;
  onNextQuestion: () => void;
  onExit: () => void;
}) {
  const [stage, setStage] = useState<Stage>("quiz");
  const [{ scenario, prompt }] = useState(
    () => composeMockLoop({ scenarios: SCENARIOS, prompts: PROMPTS }) as { scenario: Scenario; prompt: Prompt }
  );
  const [archScore, setArchScore] = useState("");
  const [archSkipped, setArchSkipped] = useState(false);
  const [storyRating, setStoryRating] = useState<number | null>(null);
  const startedAt = useRef(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  // The quiz round finishing (drill.done) hands over to the design round.
  useEffect(() => {
    if (stage === "quiz" && drill.done) setStage("arch");
  }, [stage, drill.done]);

  const finish = () => {
    setElapsedMs(Date.now() - startedAt.current);
    setStage("summary");
  };

  if (stage === "quiz") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: font.size.label, fontWeight: 800, color: colors.accentBright, letterSpacing: "0.08em" }}>
          {t("mock.stageQuiz").toUpperCase()}
        </span>
        <DrillSession drill={drill} onAnswer={onAnswer} onNext={onNextQuestion} onExit={onExit} />
      </div>
    );
  }

  if (stage === "arch") {
    return (
      <div style={stageStyles}>
        <StageHeader label={t("mock.stageArch")} onExit={onExit} />
        <div>
          <div style={{ fontSize: font.size.title, fontWeight: 800, color: colors.textBright, marginBottom: 6 }}>{scenario.name}</div>
          <p style={{ margin: 0, fontSize: font.size.body, lineHeight: 1.6, color: colors.text }}>{scenario.brief}</p>
          <p style={{ margin: "8px 0 0", fontSize: font.size.small, color: colors.textDim }}>
            <BrandIcon name="cost" color={colors.textDim} size={13} /> {t("mock.archBudget", { budget: scenario.budget })}
          </p>
        </div>
        <p style={{ margin: 0, fontSize: font.size.body, color: colors.textDim, lineHeight: 1.55 }}>{t("mock.archInstruction")}</p>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: font.size.small, color: colors.textDim }}>
          {t("mock.archScoreLabel")}
          <input
            type="number"
            min={0}
            max={100}
            value={archScore}
            onChange={(e) => setArchScore(e.target.value)}
            style={{
              width: 90,
              minHeight: 40,
              padding: "10px 12px",
              background: colors.bgDeep,
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 8,
              color: colors.text,
              fontSize: font.size.body,
            }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setArchSkipped(true);
              setStage("story");
            }}
            style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${colors.borderSoft}`, borderRadius: 8, color: colors.textDim, fontSize: font.size.small, fontWeight: 600, cursor: "pointer" }}
          >
            {t("mock.skip")}
          </button>
          <button
            onClick={() => setStage("story")}
            disabled={archScore === ""}
            style={{ padding: "7px 16px", background: colors.accent, border: "none", borderRadius: 8, color: colors.onAccent, fontSize: font.size.small, fontWeight: 700, cursor: archScore === "" ? "not-allowed" : "pointer", opacity: archScore === "" ? 0.5 : 1 }}
          >
            {t("common.next")}
          </button>
        </div>
      </div>
    );
  }

  if (stage === "story") {
    const competencyColor = COMPETENCY_COLORS[prompt.competency] ?? colors.accent;
    return (
      <div style={stageStyles}>
        <StageHeader label={t("mock.stageStory")} onExit={onExit} />
        <span
          style={{
            alignSelf: "flex-start",
            padding: "3px 10px",
            borderRadius: 999,
            background: `${competencyColor}20`,
            color: competencyColor,
            fontSize: font.size.label,
            fontWeight: 700,
          }}
        >
          {t(`enum.competency.${prompt.competency}` as Parameters<typeof t>[0])}
        </span>
        <p style={{ margin: 0, fontSize: font.size.bodyLg, fontWeight: 700, lineHeight: 1.55, color: colors.text }}>{prompt.text}</p>
        <p style={{ margin: 0, fontSize: font.size.body, color: colors.textDim }}>{t("mock.storyInstruction")}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: font.size.small, color: colors.textDim }}>{t("mock.storyRateLabel")}</span>
          {Array.from({ length: STORY_RATING_MAX }, (_, i) => i + 1).map((rating) => (
            <button
              key={rating}
              onClick={() => setStoryRating(rating)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: `1px solid ${storyRating === rating ? colors.accent : colors.borderSoft}`,
                background: storyRating === rating ? tints.accentSoft : "transparent",
                color: storyRating === rating ? colors.accentBright : colors.textDim,
                fontSize: font.size.body,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {rating}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={finish}
            style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${colors.borderSoft}`, borderRadius: 8, color: colors.textDim, fontSize: font.size.small, fontWeight: 600, cursor: "pointer" }}
          >
            {t("mock.skip")}
          </button>
          <button
            onClick={finish}
            disabled={storyRating === null}
            style={{ padding: "7px 16px", background: colors.accent, border: "none", borderRadius: 8, color: colors.onAccent, fontSize: font.size.small, fontWeight: 700, cursor: storyRating === null ? "not-allowed" : "pointer", opacity: storyRating === null ? 0.5 : 1 }}
          >
            {t("mock.finish")}
          </button>
        </div>
      </div>
    );
  }

  const result = scoreMockLoop({
    quizCorrect: drill.correctCount,
    quizTotal: drill.questions.length,
    archScore: archSkipped || archScore === "" ? null : Number(archScore),
    storyRating,
  });
  const minutes = Math.floor(elapsedMs / 60_000);
  const seconds = Math.floor((elapsedMs % 60_000) / 1000);

  return (
    <div style={{ ...stageStyles, textAlign: "center", alignItems: "center" }}>
      <span style={{ fontSize: font.size.label, fontWeight: 800, color: colors.accentBright, letterSpacing: "0.08em" }}>
        {t("mock.summaryTitle").toUpperCase()}
      </span>
      <div style={{ fontSize: font.size.hero, fontWeight: 800, color: colors.textBright, lineHeight: 1 }}>
        {result.overall === null ? "--" : `${result.overall}%`}
      </div>
      <span style={{ fontSize: font.size.small, color: colors.textFaint }}>{t("mock.elapsed", { minutes, seconds })}</span>
      <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
        {[
          { label: t("mock.summaryQuiz"), value: result.quiz },
          { label: t("mock.summaryArch"), value: result.arch },
          { label: t("mock.summaryStory"), value: result.story },
        ].map(({ label, value }) => (
          <span key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: font.size.label, color: colors.textFaint, fontWeight: 700 }}>{label}</span>
            <span style={{ fontSize: font.size.bodyLg, fontWeight: 800, color: value === null ? colors.textFaint : colors.text }}>
              {value === null ? "--" : `${value}%`}
            </span>
          </span>
        ))}
      </div>
      <button
        onClick={onExit}
        style={{ padding: "9px 18px", background: colors.accent, border: "none", borderRadius: 8, color: colors.onAccent, fontSize: font.size.body, fontWeight: 600, cursor: "pointer" }}
      >
        {t("prep.backToCards")}
      </button>
    </div>
  );
}
