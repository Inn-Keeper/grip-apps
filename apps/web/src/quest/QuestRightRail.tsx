import React from "react";
import { colors } from "@grip-apps/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { FunnelDashboard } from "./FunnelDashboard";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import type { Contact } from "./types";
import type { VelocityReport } from "@grip-apps/core/pipeline";

type FunnelSummary = Parameters<typeof FunnelDashboard>[0]["summary"];

export function QuestRightRail({
  dueContacts,
  funnel,
  velocity,
  velocityError,
  velocityLoading,
}: {
  dueContacts: Contact[];
  funnel: FunnelSummary;
  velocity?: VelocityReport;
  velocityError?: Error | null;
  velocityLoading: boolean;
}) {
  const velocityStages = velocity?.stages ?? [];

  return (
    <>
      <FunnelDashboard summary={funnel} compact />
      <WorkspacePanel>
        <WorkspaceTitle
          icon={
            <BrandIcon
              name="calendar"
              color={dueContacts.length ? colors.dangerBright : colors.successBright}
              size={17}
            />
          }
          title={dueContacts.length ? "Due now" : "No overdue actions"}
          subtitle={dueContacts.length ? "Clear these first." : "Your follow-up queue is calm."}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {dueContacts.slice(0, 5).map((contact) => (
            <div key={contact.id} style={{ fontSize: 12, lineHeight: 1.45 }}>
              <div style={{ color: colors.textBright, fontWeight: 800 }}>{contact.name}</div>
              <div style={{ color: colors.textFaint }}>{contact.nextAction}</div>
            </div>
          ))}
          {dueContacts.length === 0 && (
            <p style={{ margin: 0, color: colors.textFaint, fontSize: 12 }}>
              Add next actions to keep the pipeline moving.
            </p>
          )}
        </div>
      </WorkspacePanel>

      <WorkspacePanel>
        <WorkspaceTitle
          icon={<BrandIcon name="calendar" color={colors.accentBright} size={17} />}
          title="Stage velocity"
          subtitle="Avg. days between transitions"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {velocityLoading && velocityStages.length === 0 && (
            <p style={{ margin: 0, color: colors.textFaint, fontSize: 12 }}>
              Loading velocity...
            </p>
          )}
          {velocityError && (
            <p style={{ margin: 0, color: colors.dangerBright, fontSize: 12 }}>
              Velocity unavailable. Check the pipeline service connection.
            </p>
          )}
          {!velocityLoading && !velocityError && velocityStages.length === 0 && (
            <p style={{ margin: 0, color: colors.textFaint, fontSize: 12 }}>
              Move contacts between stages to build velocity history.
            </p>
          )}
          {velocityStages.length > 0 && (
            <>
              {velocityStages.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: 1, fontSize: 11.5, color: colors.textDim, fontWeight: 600 }}>
                    {s.fromStage} → {s.toStage}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: colors.textBright }}>
                    {Number(s.avgDays).toFixed(1)}d
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </WorkspacePanel>
    </>
  );
}
