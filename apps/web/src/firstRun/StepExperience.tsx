import { useRef, useState } from "react";
import { t } from "@grip/core/i18n";
import { FIRST_RUN_LIMITS, formatCvText, redactCv } from "@grip/core/firstRun";
import { Field } from "../components/shared";
import { textareaFieldStyle } from "../components/fieldStyles";
import { ErrorText } from "../components/ErrorText";
import { CvParseError, readCvText } from "../profile/cvParser";
import { colors, space } from "../lib/tokens";
import { dimText, ghostBtn, stackCol } from "./styles";
import type { StepProps } from "./types";

// The CV is read and redacted here, in the browser; only the edited preview is sent.
export function StepExperience({ state, dispatch, displayName }: StepProps & { displayName: string }) {
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trimmed, setTrimmed] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setError(null);
    try {
      const clean = redactCv(formatCvText(await readCvText(file)), displayName);
      setFileName(file.name);
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
      <div style={{
          display: "flex",
          alignItems: "center",
          gap: space.md,
          flexWrap: "wrap"
        }}>
        <button
          type="button"
          disabled={reading}
          onClick={() => fileRef.current?.click()}
          style={{
            ...ghostBtn,
            border: `1px solid ${colors.border}`,
            color: colors.text
          }}
        >
          {state.cvText ? t("firstRun.experience.cvReplace") : t("firstRun.experience.cv")}
        </button>
        <span style={dimText}>{fileName || t("firstRun.experience.cvHint")}</span>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt"
          hidden
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
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
