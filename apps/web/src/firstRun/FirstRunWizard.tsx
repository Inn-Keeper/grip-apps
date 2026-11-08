import { useEffect, useReducer, useRef } from "react";
import type { User } from "@grip/core/api";
import { t } from "@grip/core/i18n";
import { colors, font, space } from "../lib/tokens";
import { playbookApi } from "../lib/api";
import { useSaveProfileMutation } from "../profile/queries";
import { GenerateStep, type Landing } from "./GenerateStep";
import { StepExperience } from "./StepExperience";
import { StepGoal } from "./StepGoal";
import { StepReview } from "./StepReview";
import { StepRole } from "./StepRole";
import { StepStack } from "./StepStack";
import { dimText, ghostBtn, primaryBtn } from "./styles";
import { canContinue, initialWizard, profileUpdate, STEPS, wizardReducer } from "./wizardState.js";

type Key = Parameters<typeof t>[0];
const NUMBERED = ["stack", "goal", "role", "experience"];
const SKIPPABLE = ["role", "experience"];

// The first-run wizard: one question per screen, then the playbook is generated.
export function FirstRunWizard({ profile, onLand, onExplore }: {
  profile: User | null;
  onLand: (landing: Landing) => void;
  onExplore: () => void;
}) {
  const [state, dispatch] = useReducer(wizardReducer, profile, initialWizard);
  const saveProfile = useSaveProfileMutation();
  const heading = useRef<HTMLHeadingElement>(null);
  const { step } = state;

  // Move focus to the new question so screen readers announce the step change.
  useEffect(() => heading.current?.focus(), [step]);

  const start = () => {
    // Saved before generating, so a failed generation never loses the setup; App sets the done flag on landing.
    saveProfile.mutate(profileUpdate(state));
    dispatch({ type: "goTo", step: "generate" });
  };

  const number = NUMBERED.indexOf(step);
  const titleKey = (step === "generate" ? "firstRun.generate.title" : `firstRun.${step}.title`) as Key;
  const introKey = (`firstRun.${step}.intro`) as Key;
  const goal = state.goal || "explore";
  const startLabel = playbookApi ? t(`firstRun.review.start.${goal}` as Key) : t("firstRun.review.noAi");

  return (
    <main style={{
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
        padding: `${space.xxl * 2}px ${space.lg}px`,
        boxSizing: "border-box"
      }}>
      <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: space.lg
        }}>
        <span style={{
            ...dimText,
            fontSize: font.size.label,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: colors.accentBright
          }}>
          {number >= 0 && t("firstRun.stepOf", { n: number + 1, total: NUMBERED.length })}
          {SKIPPABLE.includes(step) && ` · ${t("firstRun.optional")}`}
        </span>
        {step !== "generate" && (
          <button type="button" onClick={onExplore} style={ghostBtn}>{t("firstRun.explore")}</button>
        )}
      </div>
      <h1 ref={heading} tabIndex={-1} style={{
          margin: 0,
          fontSize: font.size.display,
          fontWeight: 800,
          color: colors.textBright,
          outline: "none"
        }}>
        {t(titleKey)}
      </h1>
      {step !== "generate" && <p style={{
          ...dimText,
          fontSize: font.size.body,
          margin: `${space.sm}px 0 ${space.xl}px`
        }}>{t(introKey)}</p>}
      {step === "generate" && <div style={{ height: space.xl }} />}

      {step === "stack" && <StepStack state={state} dispatch={dispatch} />}
      {step === "goal" && <StepGoal state={state} dispatch={dispatch} />}
      {step === "role" && <StepRole state={state} dispatch={dispatch} />}
      {step === "experience" && <StepExperience state={state} dispatch={dispatch} displayName={profile?.displayName ?? ""} />}
      {step === "review" && <StepReview state={state} dispatch={dispatch} />}
      {step === "generate" && <GenerateStep state={state} onLand={onLand} />}

      {step !== "generate" && (
        <footer style={{
            display: "flex",
            justifyContent: "space-between",
            gap: space.md,
            flexWrap: "wrap",
            marginTop: space.xxl
          }}>
          {STEPS.indexOf(step) > 0 ? (
            <button type="button" onClick={() => dispatch({ type: "back" })} style={ghostBtn}>{t("firstRun.back")}</button>
          ) : <span />}
          <div style={{
              display: "flex",
              gap: space.sm,
              flexWrap: "wrap",
              marginLeft: "auto"
            }}>
            {SKIPPABLE.includes(step) && (
              <button type="button" onClick={() => dispatch({ type: "skip" })} style={ghostBtn}>{t("firstRun.skip")}</button>
            )}
            {step === "review" ? (
              <button type="button" onClick={start} style={primaryBtn()}>{startLabel}</button>
            ) : (
              <button type="button" onClick={() => dispatch({ type: "next" })} disabled={!canContinue(state)} style={primaryBtn(canContinue(state))}>
                {t("firstRun.continue")}
              </button>
            )}
          </div>
        </footer>
      )}
    </main>
  );
}
