import { STATUSES, STATUS_STYLES } from "@grip/core/contacts";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import type { Contact } from "./types";

// Left rail = navigate and filter (rule 4): each stage filters the pipeline list.
export function QuestLeftRail({ contacts, filter, onFilter }: {
  contacts: Contact[];
  filter: string | null;
  onFilter: (status: string | null) => void;
}) {
  const counts = Object.fromEntries(STATUSES.map((status) => [status, contacts.filter((c) => c.status === status).length]));
  const rows: { key: string | null; label: string; count: number; color: string }[] = [
    { key: null, label: t("quest.filterAll"), count: contacts.length, color: colors.accentBright ?? "" },
    ...STATUSES.map((status) => ({
      key: status,
      label: t(`enum.status.${status}` as Parameters<typeof t>[0]),
      count: counts[status] ?? 0,
      color: STATUS_STYLES[status]?.color ?? "",
    })),
  ];

  return (
    <>
      <WorkspacePanel>
        <WorkspaceTitle
          icon={<BrandIcon name="contact" color={colors.accentBright} size={17} />}
          title={t("contacts.pipeline")}
          subtitle={t("quest.filterHint")}
        />
      </WorkspacePanel>

      <WorkspacePanel style={{ padding: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {rows.map((row) => {
            const active = filter === row.key;
            return (
              <button
                key={row.label}
                type="button"
                aria-pressed={active}
                onClick={() => onFilter(row.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 10px",
                  border: "none",
                  borderRadius: 7,
                  background: active ? `${row.color}24` : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 4, background: row.count ? row.color : colors.borderSoft }} />
                <span style={{ flex: 1, color: active ? colors.textBright : row.count ? colors.text : colors.textFaint, fontSize: font.size.body, fontWeight: 700 }}>
                  {row.label}
                </span>
                <span style={{ color: row.count ? row.color : colors.textFaint, fontSize: font.size.small, fontWeight: 800 }}>{row.count}</span>
              </button>
            );
          })}
        </div>
      </WorkspacePanel>
    </>
  );
}
