import React from "react";
import { space, font } from "@grip/core/tokens";

export interface MiniButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color: string;
}

export const MiniButton = React.forwardRef<HTMLButtonElement, MiniButtonProps>(
  ({ color, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        style={{
          padding: `${space.xs}px ${space.sm! + 2}px`,
          background: "transparent",
          border: `1px solid ${color}50`,
          borderRadius: space.md,
          color,
          fontSize: font.size!.label,
          fontWeight: "600",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

MiniButton.displayName = "MiniButton";
