import { useRef, useState } from "react";
import { categories } from "@grip/core/prepData";
import { extractTechsFromText } from "@grip/core/cvTechs";
import { colors, font } from "@grip/core/tokens";
import { t } from "@grip/core/i18n";
import { readCvText, CvParseError } from "./cvParser";

const KNOWN_TECHS = categories.flatMap((c) => c.items.map((item) => item.tech));

export function CvUpload({
  cvTechs,
  disabled,
  pending,
  onTechsExtracted,
  onClear,
}: {
  cvTechs: string[];
  disabled: boolean;
  pending: boolean;
  onTechsExtracted: (techs: string[]) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setParsing(true);
    try {
      const text = await readCvText(file);
      const techs = extractTechsFromText(text, KNOWN_TECHS).map((s) => s.tech);
      if (!techs.length) {
        setError(t("profile.cvNoTechs"));
        return;
      }
      onTechsExtracted(techs);
    } catch (err) {
      // Surface parse failures (oversized, unsupported, scanned PDF) rather than swallow.
      setError(err instanceof CvParseError ? err.message : t("profile.cvReadError"));
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const busy = parsing || pending;

  return (
    // The section header (title and intro) comes from the Profile screen.
    <section>

      <div
        role="button"
        tabIndex={disabled || busy ? -1 : 0}
        aria-disabled={disabled || busy}
        onClick={() => { if (!disabled && !busy) inputRef.current?.click(); }}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled && !busy) { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled && !busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "44px 32px",
          background: dragging ? `${colors.accent}10` : colors.surface,
          border: `2px dashed ${dragging ? colors.accent : colors.borderSoft}`,
          borderRadius: 14,
          color: colors.textDim,
          cursor: disabled || busy ? "default" : "pointer",
          opacity: disabled ? 0.55 : 1,
          transition: "background 0.18s ease, border-color 0.18s ease",
        }}
      >
        <span style={{ fontSize: font.size.bodyLg, fontWeight: 800, color: colors.textBright }}>
          {busy ? t("profile.cvReading") : t("profile.cvDropTitle")}
        </span>
        <span style={{ fontSize: font.size.body, color: colors.textFaint }}>{t("profile.cvDropHint")}</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
        />
      </div>

      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        style={{
          marginTop: 16,
          padding: "11px 18px",
          background: colors.accent,
          border: "none",
          borderRadius: 8,
          color: colors.onAccent,
          fontSize: font.size.body,
          fontWeight: 800,
          cursor: disabled || busy ? "default" : "pointer",
          opacity: disabled || busy ? 0.6 : 1,
        }}
      >
        {busy ? t("profile.cvReading") : t("profile.cvImportButton")}
      </button>

      {error && (
        <p style={{ marginTop: 16, color: colors.dangerBright, fontSize: font.size.body, lineHeight: 1.6 }}>{error}</p>
      )}

      {cvTechs.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: font.size.body, fontWeight: 800, color: colors.textBright }}>{t("profile.cvDetected")}</span>
            <button
              type="button"
              onClick={onClear}
              disabled={busy}
              style={{ background: "none", border: "none", color: colors.textFaint, fontSize: font.size.small, fontWeight: 700, cursor: "pointer" }}
            >
              {t("profile.cvClear")}
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {cvTechs.map((tech) => (
              <span
                key={tech}
                style={{
                  padding: "7px 14px",
                  background: `${colors.accent}14`,
                  border: `1px solid ${colors.accent}40`,
                  borderRadius: 999,
                  color: colors.accentBright,
                  fontSize: font.size.body,
                  fontWeight: 700,
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
