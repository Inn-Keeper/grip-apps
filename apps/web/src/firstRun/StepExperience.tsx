import { useState } from "react";
import { t } from "@grip/core/i18n";
import { FIRST_RUN_LIMITS, redactCv } from "@grip/core/firstRun";
import { Field } from "../components/shared";
import { textareaFieldStyle } from "../components/fieldStyles";
import { ErrorText } from "../components/ErrorText";
import { CvParseError, readCvText } from "../profile/cvParser";
import { space } from "../lib/tokens";
import { dimText, stackCol } from "./styles";
import type { StepProps } from "./types";

// The CV is read and redacted here, in the browser; only the edited preview is sent.
export function StepExperience({ state, dispatch, displayName }: StepProps & { displayName: string }) {
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trimmed, setTrimmed] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setError(null);
    try {
      const clean = redactCv(await readCvText(file), displayName).trim();
      setTrimmed(clean.length > FIRST_RUN_LIMITS.cvText);
      dispatch({ type: "setField", field: "cvText", value: clean.slice(0, FIRST_RUN_LIMITS.cvText) });
    } catch (e) {
      setError(e instanceof CvParseError ? e.message : String(e));
    } finally {
      setReading(false);
    }
  };

  return (
    <div style={stackCol()}>
      <Field label={`${t("firstRun.experience.cv")} · ${t("firstRun.optional")}`}>
        <input type="file" accept=".pdf,.txt" disabled={reading} onChange={(e) => onFile(e.target.files?.[0])} />
      </Field>
      {reading && <p role="status" style={dimText}>{t("firstRun.experience.cvReading")}</p>}
      {error && <ErrorText>{error}</ErrorText>}
      {state.cvText !== "" && (
        <Field label={t("firstRun.experience.cvPreview")}>
          <p style={dimText}>{t("firstRun.experience.cvNote")}</p>
          <textarea
            value={state.cvText}
            maxLength={FIRST_RUN_LIMITS.cvText}
            onChange={(e) => dispatch({ type: "setField", field: "cvText", value: e.target.value })}
            style={{
              ...textareaFieldStyle,
              minHeight: 200
            }}
          />
          <span style={dimText}>
            {t("firstRun.counter", { count: state.cvText.length, max: FIRST_RUN_LIMITS.cvText })}
            {trimmed && ` · ${t("firstRun.experience.cvTrimmed", { max: FIRST_RUN_LIMITS.cvText })}`}
          </span>
        </Field>
      )}
      <fieldset style={{
          border: 0,
          padding: 0,
          margin: 0,
          ...stackCol(space.md)
        }}>
        <legend style={{
            ...dimText,
            marginBottom: space.sm
          }}>{t("firstRun.experience.notes")}</legend>
        {state.notes.map((note, index) => (
          <textarea
            key={index}
            aria-label={t("firstRun.experience.note", { n: index + 1 })}
            value={note}
            maxLength={FIRST_RUN_LIMITS.note}
            placeholder={index === 0 ? t("firstRun.experience.notePlaceholder") : ""}
            onChange={(e) => dispatch({ type: "setNote", index, value: e.target.value })}
            style={{
              ...textareaFieldStyle,
              minHeight: 64
            }}
          />
        ))}
      </fieldset>
    </div>
  );
}
