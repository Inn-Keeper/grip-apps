import { STATUSES } from "@grip/core/contacts";
import { t } from "@grip/core/i18n";
import { colors, font, radius, space } from "@grip/core/tokens";
import { fieldStyle } from "../../components/fieldStyles";
import { DateInput } from "../shared";
import { TechPicker } from "../TechPicker";
import type { Contact } from "../types";

export type ReviewRow = Contact & { id: string; stageReachedOn: string; included: boolean; source: string; warnings: string[]; techsEdited?: boolean; linkStatus?: string };

const compactField = { ...fieldStyle, minHeight: 34, padding: `${space.xs + 2}px ${space.sm}px` };
// The prep plan drills the top 5 posting techs.
const IMPORT_TECH_LIMIT = 5;
const label = { fontSize: font.size.micro, fontWeight: 700, color: colors.textFaint };

// One editable card per parsed application; unchecked rows are not imported.
export function ReviewList({ rows, onChange }: { rows: ReviewRow[]; onChange: (id: string, patch: Partial<ReviewRow>) => void }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: space.sm }}>
      {rows.map((row) => (
        <li
          key={row.id}
          style={{ padding: space.md, borderRadius: radius.sm, background: colors.well, border: `1px solid ${colors.borderSoft}`, opacity: row.included ? 1 : 0.6 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "auto 1.2fr 1fr 0.9fr 0.9fr", gap: space.sm, alignItems: "end" }}>
            <label style={{ display: "flex", alignItems: "center", alignSelf: "center" }}>
              <input type="checkbox" checked={row.included} onChange={(e) => onChange(row.id, { included: e.target.checked })} aria-label={t("quest.importInclude")} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={label}>{t("quest.importColName")}</span>
              <input style={compactField} value={row.name} onChange={(e) => onChange(row.id, { name: e.target.value })} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={label}>{t("quest.importColRole")}</span>
              <input style={compactField} value={row.role} onChange={(e) => onChange(row.id, { role: e.target.value })} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={label}>{t("quest.importColStage")}</span>
              <select style={compactField} value={row.status} onChange={(e) => onChange(row.id, { status: e.target.value })}>
                {STATUSES.map((status) => <option key={status} value={status}>{t(`enum.status.${status}` as Parameters<typeof t>[0])}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={label}>{t("quest.importColFollowUp")}</span>
              <DateInput value={row.nextActionDate} onChange={(nextActionDate) => onChange(row.id, { nextActionDate })} />
            </label>
          </div>
          <div style={{ marginTop: space.sm }}>
            <TechPicker
              label={t("quest.importTechs")}
              techs={row.postingTechs}
              limit={IMPORT_TECH_LIMIT}
              onChange={(postingTechs) => onChange(row.id, { postingTechs, techsEdited: true })}
            />
            {row.linkStatus && row.linkStatus !== "ok" && (
              <p style={{ margin: `${space.xs}px 0 0`, fontSize: font.size.label, color: colors.textFaint }}>{t("quest.importLinkFailed")}</p>
            )}
          </div>
          {row.warnings.length > 0 && (
            <p style={{ margin: `${space.sm}px 0 0`, fontSize: font.size.label, color: colors.warningBright }}>
              {row.warnings.map((warning) => t(`quest.importWarn.${warning}` as Parameters<typeof t>[0])).join(" · ")}
            </p>
          )}
          <details style={{ marginTop: space.xs, fontSize: font.size.label, color: colors.textDim }}>
            <summary style={{ cursor: "pointer", color: colors.textFaint }}>{t("quest.importSource", { text: "" }).trim()}</summary>
            <p style={{ margin: `${space.xs}px 0 0`, whiteSpace: "pre-wrap" }}>{row.source}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
