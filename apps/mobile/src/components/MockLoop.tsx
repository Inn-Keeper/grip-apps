import { useEffect, useRef, useState, type ReactNode } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SCENARIOS } from "@grip/core/arch";
import { COMPETENCY_COLORS, PROMPTS } from "@grip/core/stories";
import { composeMockLoop, scoreMockLoop, STORY_RATING_MAX } from "@grip/core/mockLoop";
import { t } from "@grip/core/i18n";
import { colors, shadow, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { Button, inputStyle } from "@/components/ui";
import { DrillSession, type Drill } from "./DrillSession";

// One timed session, as on web: a quiz round, an Arch Board scenario and a behavioral
// prompt, scored as a single loop.
// ponytail: the design round is self-reported, as on web; opening the board and scoring it is the upgrade path.

type Stage = "quiz" | "arch" | "story" | "summary";
type Scenario = { id: string; name: string; brief: string; budget: number };
type Prompt = { competency: string; text: string };

type Props = {
  drill: Drill;
  onAnswer: (i: number) => void;
  onNextQuestion: () => void;
  onExit: () => void;
};

export function MockLoop({ drill, onAnswer, onNextQuestion, onExit }: Props) {
  const [stage, setStage] = useState<Stage>("quiz");
  const [{ scenario, prompt }] = useState(
    () => composeMockLoop({ scenarios: SCENARIOS, prompts: PROMPTS }) as { scenario: Scenario; prompt: Prompt }
  );
  const [archScore, setArchScore] = useState("");
  const [archSkipped, setArchSkipped] = useState(false);
  const [storyRating, setStoryRating] = useState<number | null>(null);
  const startedAt = useRef(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  // The quiz round finishing hands over to the design round.
  useEffect(() => {
    if (stage === "quiz" && drill.done) setStage("arch");
  }, [stage, drill.done]);

  const finish = () => {
    setElapsedMs(Date.now() - startedAt.current);
    setStage("summary");
  };

  if (stage === "quiz") {
    return (
      <View style={{ gap: 10 }}>
        <StageLabel text={t("mock.stageQuiz")} />
        <DrillSession drill={drill} onAnswer={onAnswer} onNext={onNextQuestion} onExit={onExit} />
      </View>
    );
  }

  if (stage === "arch") {
    return (
      <StageCard label={t("mock.stageArch")} onExit={onExit}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: colors.textBright }}>{scenario.name}</Text>
        <Text style={{ fontSize: 13, lineHeight: 19, color: colors.text }}>{scenario.brief}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <BrandIcon name="cost" color={colors.textDim} size={13} />
          <Text style={{ fontSize: 12, color: colors.textDim }}>{t("mock.archBudget", { budget: scenario.budget })}</Text>
        </View>
        <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textDim }}>{t("mock.archInstruction")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ flex: 1, fontSize: 12, color: colors.textDim }}>{t("mock.archScoreLabel")}</Text>
          <TextInput
            value={archScore}
            onChangeText={(value) => setArchScore(value.replace(/\D/g, "").slice(0, 3))}
            keyboardType="number-pad"
            accessibilityLabel={t("mock.archScoreLabel")}
            style={[inputStyle, { width: 80, textAlign: "center" }]}
          />
        </View>
        <Actions>
          <Button label={t("mock.skip")} variant="ghost" onPress={() => { setArchSkipped(true); setStage("story"); }} />
          <Button label={t("common.next")} onPress={() => setStage("story")} disabled={archScore === ""} />
        </Actions>
      </StageCard>
    );
  }

  if (stage === "story") {
    const competencyColor = COMPETENCY_COLORS[prompt.competency as keyof typeof COMPETENCY_COLORS] ?? colors.accent;
    return (
      <StageCard label={t("mock.stageStory")} onExit={onExit}>
        <Text style={{ alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: "hidden", backgroundColor: `${competencyColor}20`, color: competencyColor, fontSize: 11, fontWeight: "700" }}>
          {t(`enum.competency.${prompt.competency}` as Parameters<typeof t>[0])}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "700", lineHeight: 22, color: colors.text }}>{prompt.text}</Text>
        <Text style={{ fontSize: 13, color: colors.textDim }}>{t("mock.storyInstruction")}</Text>
        <Text style={{ fontSize: 12, color: colors.textDim }}>{t("mock.storyRateLabel")}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {Array.from({ length: STORY_RATING_MAX }, (_, i) => i + 1).map((rating) => {
            const active = storyRating === rating;
            return (
              <TouchableOpacity
                key={rating}
                onPress={() => setStoryRating(rating)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{ width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: active ? colors.accent : colors.borderSoft, backgroundColor: active ? tints.accentSoft : "transparent" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: active ? colors.accentBright : colors.textDim }}>{rating}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Actions>
          <Button label={t("mock.skip")} variant="ghost" onPress={finish} />
          <Button label={t("mock.finish")} onPress={finish} disabled={storyRating === null} />
        </Actions>
      </StageCard>
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
    <View style={{ ...cardStyle, alignItems: "center" }}>
      <StageLabel text={t("mock.summaryTitle")} />
      <Text style={{ fontSize: 44, fontWeight: "800", color: colors.textBright }}>{result.overall === null ? "--" : `${result.overall}%`}</Text>
      <Text style={{ fontSize: 12, color: colors.textFaint }}>{t("mock.elapsed", { minutes, seconds })}</Text>
      <View style={{ flexDirection: "row", gap: 22 }}>
        {[
          { label: t("mock.summaryQuiz"), value: result.quiz },
          { label: t("mock.summaryArch"), value: result.arch },
          { label: t("mock.summaryStory"), value: result.story },
        ].map(({ label, value }) => (
          <View key={label} style={{ alignItems: "center", gap: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textFaint }}>{label}</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: value === null ? colors.textFaint : colors.text }}>{value === null ? "--" : `${value}%`}</Text>
          </View>
        ))}
      </View>
      <Button label={t("prep.backToCards")} onPress={onExit} />
    </View>
  );
}

const cardStyle = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.borderSoft,
  borderRadius: 14,
  boxShadow: shadow.card,
  padding: 18,
  gap: 12,
} as const;

function StageLabel({ text }: { text: string }) {
  return <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 0.9, color: colors.accentBright }}>{text.toUpperCase()}</Text>;
}

function StageCard({ label, onExit, children }: { label: string; onExit: () => void; children: ReactNode }) {
  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <StageLabel text={label} />
        <TouchableOpacity onPress={onExit} accessibilityRole="button" hitSlop={8} style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: colors.borderSoft }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textFaint }}>{t("prep.exit")}</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>{children}</View>;
}
