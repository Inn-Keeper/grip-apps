import React from "react";
import { STATUSES, STATUS_STYLES } from "@grip/core/contacts";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import type { Contact } from "./types";

export function QuestLeftRail({
  canAdd,
  contacts,
  dueCount,
  onAdd,
}: {
  canAdd: boolean;
  contacts: Contact[];
  dueCount: number;
  onAdd: () => void;
}) {
  const counts = Object.fromEntries(
    STATUSES.map((status) => [status, contacts.filter((c) => c.status === status).length])
  );

  return (
    <>
      <WorkspacePanel>
        <WorkspaceTitle
          icon={<BrandIcon name="contact" color={colors.accentBright} size={17} />}
          title={t("contacts.pipeline")}
          subtitle={t("contacts.peopleTracked", { count: contacts.length })}
        />
        {canAdd && (
          <button
            onClick={onAdd}
            style={{
              width: "100%",
              marginTop: 14,
              padding: "9px 12px",
              background: colors.accent,
              border: "none",
              borderRadius: 8,
              color: colors.onAccent,
              fontSize: 12,
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            {t("contacts.addContactPlain")}
          </button>
        )}
      </WorkspacePanel>

      <WorkspacePanel style={{ padding: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {STATUSES.map((status) => {
            const style = STATUS_STYLES[status] ?? { color: "", bg: "" };
            return (
              <div
                key={status}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 7,
                  background: counts[status] ? `${style.color}14` : "transparent",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: counts[status] ? style.color : colors.border,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    color: counts[status] ? colors.text : colors.textFaint,
                    fontSize: 12.5,
                    fontWeight: 750,
                  }}
                >
                  {t(`enum.status.${status}` as Parameters<typeof t>[0])}
                </span>
                <span style={{ color: counts[status] ? style.color : colors.textFaint, fontSize: 12, fontWeight: 850 }}>
                  {counts[status]}
                </span>
              </div>
            );
          })}
        </div>
      </WorkspacePanel>

      {dueCount > 0 && (
        <WorkspacePanel tone="sunken" style={{ borderColor: `${colors.danger}70` }}>
          <WorkspaceTitle
            icon={<BrandIcon name="warning" color={colors.dangerBright} size={17} />}
            title={t("contacts.dueTitle", { count: dueCount, plural: dueCount > 1 ? "s" : "" })}
            subtitle={t("contacts.dueSubtitle")}
          />
        </WorkspacePanel>
      )}
    </>
  );
}
