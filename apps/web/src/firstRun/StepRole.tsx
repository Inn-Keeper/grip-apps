import { useState } from "react";
import { t } from "@grip/core/i18n";
import { cleanJobText, FIRST_RUN_LIMITS } from "@grip/core/firstRun";
import { PREP_TECHS } from "@grip/core/prepData";
import { extractTechsFromText } from "@grip/core/techMatch";
import { Field } from "../components/shared";
import { fieldStyle, miniBtn, textareaFieldStyle } from "../components/fieldStyles";
import { postingReader } from "../lib/api";
import { colors, space } from "../lib/tokens";
import { dimText, ghostBtn, stackCol } from "./styles";
import type { StepProps } from "./types";

const isLink = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());
// Techs come from the whole page; only the cleaned description is cut to the AI's limit.
const techsIn = (text: string): string[] => extractTechsFromText(text, PREP_TECHS, 20).map((d: { tech: string }) => d.tech);

export function StepRole({ state, dispatch }: StepProps) {
  const [reading, setReading] = useState(false);
  const [readStatus, setReadStatus] = useState<"ok" | "failed" | null>(null);
  const set = (field: string, value: unknown) => dispatch({ type: "setField", field, value });
  const applyJob = (text: string) => {
    set("jobText", cleanJobText(text).slice(0, FIRST_RUN_LIMITS.jobText));
    set("jobTechs", techsIn(text));
  };

  const onJobInput = (value: string) => {
    set("jobInput", value);
    setReadStatus(null);
    // Pasted text is the description itself; a link waits for "Read link".
    if (isLink(value)) {
      set("jobText", "");
      set("jobTechs", []);
    } else applyJob(value);
  };

  const readLink = async () => {
    if (!postingReader) return setReadStatus("failed");
    setReading(true);
    try {
      const [posting] = await postingReader.readPostings([state.jobInput.trim()]);
      const ok = posting?.status === "ok" && posting.text;
      if (ok) applyJob(posting.text);
      setReadStatus(ok ? "ok" : "failed");
    } catch {
      setReadStatus("failed");
    } finally {
      setReading(false);
    }
  };

  const detected = state.jobTechs.filter((tech) => !state.stack.includes(tech));

  return (
    <div style={stackCol()}>
      <Field label={t("firstRun.role.label")}>
        <input
          value={state.role}
          maxLength={FIRST_RUN_LIMITS.role}
          placeholder={t("firstRun.role.placeholder")}
          onChange={(e) => set("role", e.target.value)}
          style={fieldStyle}
        />
      </Field>
      <Field label={`${t("firstRun.role.job")} · ${t("firstRun.optional")}`}>
        <textarea
          value={state.jobInput}
          
          placeholder={t("firstRun.role.jobPlaceholder")}
          onChange={(e) => onJobInput(e.target.value)}
          style={{
            ...textareaFieldStyle,
            minHeight: 140
          }}
        />
      </Field>
      {isLink(state.jobInput) && (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: space.md,
            flexWrap: "wrap"
          }}>
          <button type="button" onClick={readLink} disabled={reading} aria-busy={reading} style={{
              ...ghostBtn,
              border: `1px solid ${colors.border}`
            }}>
            {reading ? t("firstRun.role.reading") : t("firstRun.role.read")}
          </button>
          <span role="status" style={{
              ...dimText,
              color: readStatus === "failed" ? colors.dangerBright : colors.textDim
            }}>
            {readStatus === "failed" ? t("firstRun.role.readFailed") : readStatus === "ok" ? t(state.jobTechs.length ? "firstRun.role.readOk" : "firstRun.role.readNone", { count: state.jobTechs.length }) : ""}
          </span>
        </div>
      )}
      {detected.length > 0 && (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: space.sm,
            flexWrap: "wrap"
          }}>
          <span style={dimText}>{t("firstRun.role.detected")}</span>
          {detected.map((tech: string) => (
            <button key={tech} type="button" onClick={() => dispatch({ type: "toggleTech", tech })} style={miniBtn(colors.textDim ?? "")}>
              {t("firstRun.role.addTech", { tech })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
