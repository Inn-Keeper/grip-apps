import type { CSSProperties, ReactNode } from "react";
import { colors, layout, shadow } from "@grip/core/tokens";
import styles from "./WorkspaceLayout.module.css";

type WorkspaceLayoutProps = {
  left: ReactNode;
  children: ReactNode;
  right: ReactNode;
  mainLabel?: string;
  density?: "normal" | "compact";
  // Space to keep clear under the left rail, e.g. for Poe fixed at the bottom-left.
  leftRailBottomInset?: number;
};

export function WorkspaceLayout({ left, children, right, mainLabel = "Workspace", density = "normal", leftRailBottomInset }: WorkspaceLayoutProps) {
  const compact = density === "compact";

  return (
    <main
      className={styles.shell}
      style={{
        background: colors.bg,
        "--app-header-height": `${layout.webHeaderHeight}px`,
        "--workspace-top": `${layout.workspaceTop}px`,
        "--workspace-bottom-inset": `${layout.workspaceBottomInset}px`,
        "--workspace-left-bottom-inset": `${leftRailBottomInset ?? layout.workspaceBottomInset}px`,
        "--workspace-gap": compact ? "18px" : "22px",
        "--workspace-padding": compact ? "18px 24px 40px" : "22px 24px 44px",
        "--workspace-rail-min": `${layout.workspaceRailMin}px`,
        "--workspace-left-rail-max": `${layout.workspaceLeftRailMax}px`,
        "--workspace-right-rail-min": `${layout.workspaceRightRailMin}px`,
        "--workspace-right-rail-max": `${layout.workspaceRightRailMax}px`,
      } as CSSProperties}
    >
      <aside className={`${styles.rail} ${styles.leftRail}`}>
        {left}
      </aside>
      <section aria-label={mainLabel} className={styles.main}>
        {children}
      </section>
      <aside className={`${styles.rail} ${styles.rightRail}`}>
        {right}
      </aside>
    </main>
  );
}

type WorkspacePanelProps = { children: ReactNode; tone?: "default" | "sunken"; style?: CSSProperties };

export function WorkspacePanel({ children, tone = "default", style }: WorkspacePanelProps) {
  return (
    <div
      style={{
        background: tone === "sunken" ? colors.well : colors.surface,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 8,
        boxShadow: tone === "sunken" ? undefined : shadow.card,
        padding: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type WorkspaceTitleProps = { icon: ReactNode; title: string; subtitle?: string; right?: ReactNode };

export function WorkspaceTitle({ icon, title, subtitle, right }: WorkspaceTitleProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ margin: 0, color: colors.textBright, fontSize: 13, fontWeight: 800 }}>{title}</h2>
        {subtitle && <p style={{ margin: "4px 0 0", color: colors.textFaint, fontSize: 11, lineHeight: 1.45 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
