import type { ReactNode } from "react";
import { colors, font } from "@grip/core/tokens";
import styles from "./InterviewPrep.module.css";

// One section of the Practice settings card: a quiet caps heading (its value or control on
// the right), a hint, then the control. Dividers, not separate cards, keep it one group.
export function SettingSection({ title, hint, right, children }: { title: string; hint?: string; right?: ReactNode; children?: ReactNode }) {
  return (
    <section className={styles.settingSection}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: font.size.label, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.textDim }}>
          {title}
        </h3>
        {right}
      </div>
      {hint && <p style={{ margin: "4px 0 0", fontSize: font.size.label, lineHeight: 1.45, color: colors.textFaint }}>{hint}</p>}
      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </section>
  );
}
