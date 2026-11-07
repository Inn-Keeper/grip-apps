import type { CSSProperties } from "react";
import styles from "./BrandMark.module.css";

// Poe's raven, the same still artwork as the favicon.
export function BrandMark({ size, style }: { size: number; style?: CSSProperties }) {
  return (
    <span className={styles.mark} style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        ...style
      }}>
      <img src="/favicon.svg" alt="" width={size} height={size} />
    </span>
  );
}
