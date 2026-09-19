import { useId, type CSSProperties, type ReactNode } from "react";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { BrandIcon } from "./BrandIcon";
import styles from "./InfoTip.module.css";

// An ⓘ that holds a hint instead of printing it on screen (rule 20: numbers stay
// explainable). A native popover, so tap, click and keyboard all work, and a title
// tooltip (unreachable on touch) isn't needed.
export function InfoTip({ children, label = t("common.moreInfo") }: { children: ReactNode; label?: string }) {
  const id = useId();
  // Anchor names must be dashed identifiers; useId can include characters that aren't.
  const anchor = `--tip-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <>
      <button
        type="button"
        className={styles.button}
        popoverTarget={id}
        aria-label={label}
        style={{ anchorName: anchor, "--tip-focus": colors.accentBright } as CSSProperties}
      >
        <BrandIcon name="info" color={colors.textDim} size={15} />
      </button>
      <div
        id={id}
        popover="auto"
        className={styles.popover}
        style={{
          positionAnchor: anchor,
          "--tip-border": colors.borderSoft,
          "--tip-bg": colors.bgDeep,
          "--tip-text": colors.text,
        } as CSSProperties}
      >
        {children}
      </div>
    </>
  );
}
