import { useId, useRef, type CSSProperties } from "react";
import { ABBREVIATIONS, splitAbbreviations } from "@grip/core/abbreviations";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import styles from "./AbbrText.module.css";

/**
 * Text with its abbreviations explained on hover, focus and tap.
 * Not `title`, which reaches neither keyboard nor touch.
 */
export function AbbrText({ children }: { children: string }) {
  const segments = splitAbbreviations(children);
  return (
    <>
      {segments.map((segment, index) =>
        segment.term ? <Term key={index} term={segment.term} /> : <span key={index}>{segment.text}</span>
      )}
    </>
  );
}

function Term({ term }: { term: string }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  // Anchor names must be dashed identifiers; useId can include other characters.
  const anchor = `--abbr-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const expansion = t(ABBREVIATIONS[term as keyof typeof ABBREVIATIONS] as Parameters<typeof t>[0]);

  // showPopover throws when it is already open, which hover and focus can both cause.
  const toggle = (open: boolean) => {
    try {
      if (open) ref.current?.showPopover();
      else ref.current?.hidePopover();
    } catch {
      /* already in that state */
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.term}
        popoverTarget={id}
        aria-label={`${term}: ${expansion}`}
        onMouseEnter={() => toggle(true)}
        onMouseLeave={() => toggle(false)}
        onFocus={() => toggle(true)}
        onBlur={() => toggle(false)}
        style={{ anchorName: anchor, "--abbr-focus": colors.accentBright } as CSSProperties}
      >
        {term}
      </button>
      <div
        id={id}
        ref={ref}
        popover="auto"
        className={styles.popover}
        style={{
          positionAnchor: anchor,
          "--abbr-border": colors.borderSoft,
          "--abbr-bg": colors.bgDeep,
          "--abbr-text": colors.text,
        } as CSSProperties}
      >
        {expansion}
      </div>
    </>
  );
}
