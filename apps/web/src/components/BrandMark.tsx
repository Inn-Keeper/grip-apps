import type { CSSProperties } from "react";
import styles from "./BrandMark.module.css";

// Poe's raven, the same still artwork as the favicon.
export function BrandMark({ size, style, className }: { size: number; style?: CSSProperties; className?: string }) {
  return (
    <span className={`${styles.mark}${className ? ` ${className}` : ""}`} style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        ...style
      }}>
      <img src="/favicon.svg" alt="" width={size} height={size} />
    </span>
  );
}
