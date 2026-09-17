import { colors, tints } from "@grip/core/tokens";

// Lightweight confirmation modal (scrim + centered card).
export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: tints.modalScrim, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(100%, 380px)", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20 }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 850, color: colors.textBright }}>{title}</h2>
        <p style={{ margin: "0 0 18px", fontSize: 13, lineHeight: 1.5, color: colors.textDim }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.textDim, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: "8px 16px", background: colors.accent, border: "none", borderRadius: 8, color: colors.onAccent, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
