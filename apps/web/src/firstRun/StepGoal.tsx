import { t } from "@grip/core/i18n";
import { FIRST_RUN_LIMITS } from "@grip/core/firstRun";
import { Field } from "../components/shared";
import { textareaFieldStyle } from "../components/fieldStyles";
import { space } from "../lib/tokens";
import { choiceBtn, dimText, stackCol } from "./styles";
import { GOALS, type StepProps } from "./types";

type Key = Parameters<typeof t>[0];

export function StepGoal({ state, dispatch }: StepProps) {
  return (
    <div style={stackCol()}>
      <div role="radiogroup" aria-label={t("firstRun.goal.title")} style={stackCol(space.md)}>
        {GOALS.map((goal) => {
          const selected = state.goal === goal;
          return (
            <button
              key={goal}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => dispatch({ type: "setGoal", goal })}
              style={choiceBtn(selected)}
            >
              <span>
                {t(`firstRun.goal.${goal}` as Key)}
                <span style={{
                    ...dimText,
                    display: "block"
                  }}>{t(`firstRun.goal.${goal}.desc` as Key)}</span>
              </span>
              <span aria-hidden="true">{selected ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>
      {state.goal === "design" && (
        <Field label={`${t("firstRun.goal.brief")} · ${t("firstRun.optional")}`}>
          <textarea
            value={state.brief}
            maxLength={FIRST_RUN_LIMITS.brief}
            placeholder={t("firstRun.goal.briefPlaceholder")}
            onChange={(e) => dispatch({ type: "setField", field: "brief", value: e.target.value })}
            style={textareaFieldStyle}
          />
        </Field>
      )}
    </div>
  );
}
