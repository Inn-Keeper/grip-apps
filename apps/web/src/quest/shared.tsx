import React from "react";
import { t } from "@grip-apps/core/i18n";
import { inputStyle, miniBtn, Field } from "../components/shared";

export { Field };

export function ActionButton({
  onClick,
  color,
  children,
}: {
  onClick: () => void;
  color: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={miniBtn(color ?? "")}>
      {children}
    </button>
  );
}

export function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      style={inputStyle}
      value={value}
      inputMode="numeric"
      maxLength={10}
      onChange={(e) => onChange(formatDateEntry(e.target.value))}
      placeholder={t("contacts.datePlaceholder")}
    />
  );
}

function formatDateEntry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}
