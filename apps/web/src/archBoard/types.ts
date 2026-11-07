import type { FreeStyle } from "@grip/core/arch";
import type { TalkAssessment } from "@grip/core/api";

export type BoardNode = {
  id: string;
  type: string;
  x: number;
  y: number;
  partitionKey?: string;
  replicas?: number;
  label?: string;
  shape?: "rect" | "diamond" | "ellipse" | "note";
  w?: number;
  h?: number;
  x2?: number;
  y2?: number;
  style?: FreeStyle;
};
export type BoardEdge = {
  id: string;
  from: string;
  to: string;
  mode?: "sync" | "async";
  protocol?: string;
};
export type ConnectDrag = { from: string; x: number; y: number; moved: boolean };
export type DragRef = { id: string; dx: number; dy: number; moved: boolean };

export type ScenarioScale = {
  dau: number;
  actionsPerUserPerDay: number;
  writesPerUserPerDay: number;
  payloadKb: number;
  retentionDays: number;
};

export type AugmentedScenario = {
  id: string;
  name: string;
  brief: string;
  scale?: ScenarioScale;
  pushback?: string;
  checks: object[];
  warnings?: object[];
  category?: string;
  custom?: boolean;
};

export type TalkTrackData = { sections: Record<string, string>; rating: number | null };

/** What grip-ai-api returns from /api/v1/ai/status. */
export type GradingStatus = {
  grading: "available" | "unavailable";
  code?: string;
  message?: string;
  /** Seconds until the provider limit lapses. */
  retry_after?: number;
};

/** What grip-ai-api returns from /api/v1/ai/grade-talk-track. */
export type { TalkAssessment, TalkGradeResult } from "@grip/core/api";

export type SavedBoard = {
  id?: string;
  title: string;
  scenarioId: string;
  storyId?: string | null;
  // A free board's own brief; empty on scenario boards.
  brief?: string;
  nodes: BoardNode[];
  edges: BoardEdge[];
  talkTrack?: TalkTrackData;
  talkGrade?: number | null;
  talkAssessment?: TalkAssessment | null;
  shareToken?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BoardSummary = Pick<SavedBoard, "id" | "title" | "scenarioId" | "storyId" | "shareToken"> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
