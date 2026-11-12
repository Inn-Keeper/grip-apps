// Data layer: Supabase queries + snake_case<->camelCase and date mapping.
// UI keeps DD-MM-YYYY strings; Postgres stores real dates.
// One module per domain under ./api; this file keeps the public types and entry point.
import type { BoardEdge, BoardNode, Check } from "./arch.js";
import { boardsApi } from "./api/boards";
import { contactsApi } from "./api/contacts";
import { preparationApi } from "./api/preparation";
import { profileApi } from "./api/profile";
import { scenariosApi } from "./api/scenarios";
import { scoresApi } from "./api/scores";
import type { Db } from "./api/shared";
import { storiesApi } from "./api/stories";

export { dateToDb, dateToUi } from "./api/shared";
export type { Db } from "./api/shared";
export type { Database } from "./database.types";
export type * from "./api/preparation";

export type Retro = {
  id: string;
  round: string;
  questions: string;
  wentWell: string;
  toImprove: string;
  struggledTechs: string[];
  date: string;
};

export type Contact = {
  id?: string;
  name: string;
  status: string;
  role: string;
  link: string;
  note: string;
  date: string;
  nextAction: string;
  nextActionDate: string;
  postingTechs: string[];
  retros?: Retro[];
};

export type StoryGradeResult = {
  score: number;
  suggestion: {
    sections: { section: string; verdict: "covered" | "thin" | "missing"; evidence: string; gap: string }[];
    hardest_followup: string;
  };
};

/** Saved AI grade; `inputs` are the story fields it graded (see storyGrade.js). */
export type StoryAssessment = { version: number; inputs: Record<string, string>; result: StoryGradeResult };

export type Story = {
  id?: string;
  title: string;
  competency: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  /** Arch Board scenario (built-in key or custom uuid) */
  scenarioId?: string | null;
  /** AI-written sample, true until the user saves an edit */
  isSample?: boolean;
  /** Name of the generated playbook this story came from; null for manual stories */
  playbook?: string | null;
  /** Read-only here: written by saveStoryAssessment, never by upsertStory */
  assessment?: StoryAssessment | null;
};

export type Scores = {
  xp: number;
  answers: Record<string, { correct: number; wrong: number }>;
};

export type AccuracyPoint = {
  date: string;
  accuracy: number;
  correct: number;
  total: number;
};

export type TalkTrack = { sections: Record<string, string>; rating: number | null };

/** What grip-ai-api returns from /api/v1/ai/grade-talk-track. */
export type TalkGradeResult = {
  board_id: string;
  score: number;
  divergence: number | null;
  suggestion: {
    sections: { section: string; verdict: "covered" | "thin" | "missing"; evidence: string; gap: string }[];
    hardest_followup: string;
  };
};

/** A saved grading result and the fingerprint of the inputs it graded (see gradeState.js). */
export type TalkAssessment = { version: number; inputs: string; result: TalkGradeResult };

export type SavedBoard = {
  id?: string;
  title: string;
  scenarioId: string;
  /** the story this board was designed for */
  storyId?: string | null;
  /** a free board's own brief, for the AI grader; empty on scenario boards */
  brief?: string;
  nodes: BoardNode[];
  edges: BoardEdge[];
  talkTrack?: TalkTrack;
  talkGrade?: number | null;
  /** the detail behind talkGrade; undefined leaves the stored value untouched */
  talkAssessment?: TalkAssessment | null;
  shareToken?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** A board without its talk track or share link: enough to score it and link to it. */
export type BoardOverview = {
  id: string;
  title: string;
  scenarioId: string;
  storyId: string | null;
  updatedAt: string;
  nodes: BoardNode[];
  edges: BoardEdge[];
  talkGrade: number | null;
};

export type BoardSummary = {
  id: string;
  title: string;
  scenarioId: string;
  storyId?: string | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SharedBoard = {
  title: string;
  scenarioId: string;
  nodes: BoardNode[];
  edges: BoardEdge[];
  updatedAt: string;
};

export type CustomScenario = {
  id?: string;
  name: string;
  brief: string;
  checks: Check[];
  /** Set on wizard-generated scenarios, so "Reset goals" can remove them */
  playbook?: string | null;
};

export type SavedScenario = CustomScenario & { id: string };

export type Question = {
  id: string;
  tech: string;
  category: string;
  difficulty: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string | null;
};

export type StatusEvent = { contactId: string; status: string; createdAt: string };

export type User = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  headline: string;
  targetRole: string;
  location: string;
  portfolioUrl: string;
  githubUrl: string;
  useGithubTechsForPrep: boolean;
  cvTechs: string[];
  linkedinUrl: string;
  timezone: string;
  onboardingCompleted: boolean;
  xp: number;
  createdAt: string | null;
  updatedAt: string | null;
  favoriteTechs: string[];
  /** First-run wizard techs: stack plus target role, shown in Prep as "From My Goals" */
  goalTechs: string[];
};

/** Binds the data layer to a Supabase client (browser or React Native). */
export function createApi(supabase: Db) {
  return {
    ...contactsApi(supabase),
    ...storiesApi(supabase),
    ...boardsApi(supabase),
    ...scenariosApi(supabase),
    ...scoresApi(supabase),
    ...profileApi(supabase),
    ...preparationApi(supabase),
  };
}

export type Api = ReturnType<typeof createApi>;
