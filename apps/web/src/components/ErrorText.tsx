import type { CSSProperties, ReactNode } from "react";
import { colors, font, tints } from "@grip/core/tokens";

// An inline error under the control it belongs to; announced by screen readers.
export function ErrorText({ children, margin = 0, size = "small" }: { children: ReactNode; margin?: CSSProperties["margin"]; size?: "small" | "label" }) {
  return (
    <p role="alert" style={{ margin, fontSize: font.size[size], color: colors.dangerBright }}>
      {children}
    </p>
  );
}

// A page-level error above the content, such as a list that failed to load.
export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" style={{ marginBottom: 16, padding: "10px 14px", background: tints.dangerSoft, border: `1px solid ${colors.danger}60`, borderRadius: 8, color: colors.dangerBright, fontSize: font.size.body }}>
      {children}
    </div>
  );
}
