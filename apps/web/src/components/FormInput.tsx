import React from "react";
import { fieldStyle, textareaFieldStyle } from "./fieldStyles";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "text" | "password" | "email";
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ variant = "text", style, ...props }, ref) => (
    <input ref={ref} type={variant} style={{ ...fieldStyle, ...style }} {...props} />
  )
);

FormInput.displayName = "FormInput";

export type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(({ style, ...props }, ref) => (
  <textarea ref={ref} style={{ ...textareaFieldStyle, ...style }} {...props} />
));

FormTextarea.displayName = "FormTextarea";
