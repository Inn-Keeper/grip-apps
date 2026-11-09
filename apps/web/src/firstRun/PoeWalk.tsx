import { useEffect, useState } from "react";
import { t } from "@grip/core/i18n";
import { colors, font, space } from "../lib/tokens";
import styles from "./PoeWalk.module.css";

const STATUS = ["firstRun.generate.reading", "firstRun.generate.writing", "firstRun.generate.drawing"] as const;

// Poe walks across while the playbook is written (SCREEN-GUIDELINES rule 34 exception).
// Reduced motion: the CSS shows one still frame and only the status line changes.
export function PoeWalk({ saving }: { saving: boolean }) {
  // Stages are paced, not real progress; the elapsed clock shows the build hasn't stalled.
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const index = Math.min(Math.floor(seconds / 4), STATUS.length - 1);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div style={{
        display: "flex",
        flexDirection: "column",
        gap: space.lg
      }}>
      <div className={styles.track} style={{ borderBottom: `2px dashed ${colors.border}` }}>
        <span className={styles.poe} aria-hidden="true" />
      </div>
      <p role="status" style={{
          margin: 0,
          color: colors.textDim,
          fontSize: font.size.body
        }}>
        {t(saving ? "firstRun.generate.saving" : (STATUS[index] ?? STATUS[0]))}
        <span aria-hidden="true" style={{
            marginLeft: space.sm,
            fontVariantNumeric: "tabular-nums"
          }}>{clock}</span>
      </p>
    </div>
  );
}
