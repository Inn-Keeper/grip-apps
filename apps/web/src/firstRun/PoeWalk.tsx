import { useEffect, useState } from "react";
import { t } from "@grip/core/i18n";
import { colors, font, space } from "../lib/tokens";
import styles from "./PoeWalk.module.css";

const STATUS = ["firstRun.generate.reading", "firstRun.generate.writing", "firstRun.generate.drawing"] as const;

// Poe walks across while the playbook is written (SCREEN-GUIDELINES rule 34 exception).
// Reduced motion: the CSS shows one still frame and only the status line changes.
export function PoeWalk({ saving }: { saving: boolean }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => Math.min(i + 1, STATUS.length - 1)), 4000);
    return () => window.clearInterval(id);
  }, []);

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
      </p>
    </div>
  );
}
