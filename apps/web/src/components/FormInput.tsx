import React from "react";
import { colors, space, font } from "@grip/core/tokens";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "text" | "password" | "email";
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ variant = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={variant}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: `${space.xs}px ${space.sm! + 2}px`,
          background: colors.bgDeep,
          border: `1px solid ${colors.borderSoft}`,
          borderRadius: space.md,
          color: colors.text,
          fontSize: font.size!.body,
          outline: "none",
          fontFamily: "inherit",
        }}
        {...props}
      />
    );
  }
);

FormInput.displayName = "FormInput";

export type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (props, ref) => {
    return (
      <textarea
        ref={ref}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: `${space.xs}px ${space.sm! + 2}px`,
          background: colors.bgDeep,
          border: `1px solid ${colors.borderSoft}`,
          borderRadius: space.md,
          color: colors.text,
          fontSize: font.size!.body,
          outline: "none",
          fontFamily: "inherit",
          minHeight: 56,
          resize: "vertical",
          lineHeight: 1.5,
        }}
        {...props}
      />
    );
  }
);

FormTextarea.displayName = "FormTextarea";
