import { useState } from "react";
import { t } from "@grip/core/i18n";
import { PREP_TECHS } from "@grip/core/prepData";
import { fieldStyle } from "../components/fieldStyles";
import { space } from "../lib/tokens";
import { choiceBtn, dimText, stackCol } from "./styles";
import type { StepProps } from "./types";

// Shown before any search; the full catalog is one search away.
const POPULAR = ["JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "SQL", "Go"];

export function StepStack({ state, dispatch }: StepProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q
    ? PREP_TECHS.filter((tech) => tech.toLowerCase().includes(q)).slice(0, 24)
    : [...new Set([...state.stack, ...POPULAR.filter((tech) => PREP_TECHS.includes(tech))])];

  return (
    <div style={stackCol()}>
      <input
        type="search"
        aria-label={t("firstRun.stack.search")}
        placeholder={t("firstRun.stack.search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={fieldStyle}
      />
      <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: space.md
        }}>
        {shown.map((tech) => {
          const selected = state.stack.includes(tech);
          return (
            <button
              key={tech}
              type="button"
              aria-pressed={selected}
              onClick={() => dispatch({ type: "toggleTech", tech })}
              style={choiceBtn(selected)}
            >
              <span>{tech}</span>
              <span aria-hidden="true">{selected ? "✓" : "+"}</span>
            </button>
          );
        })}
      </div>
      <p style={dimText} aria-live="polite">
        {state.stack.length
          ? t("firstRun.stack.preview", { techs: state.stack.slice(0, 3).join(", ") })
          : t("firstRun.stack.empty")}
      </p>
    </div>
  );
}
