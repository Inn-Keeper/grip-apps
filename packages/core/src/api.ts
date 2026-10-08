// Data layer: Supabase queries + snake_case<->camelCase and date mapping.
// UI keeps DD-MM-YYYY strings; Postgres stores real dates.
// One module per domain under ./api; this file keeps the public types and entry point.
import type { BoardEdge, BoardNode, Check } from "./arch.js";
import { boardsApi } from "./api/boards";
import { contactsApi } from "./api/contacts";
import { profileApi } from "./api/profile";
import { scenariosApi } from "./api/scenarios";
import { scoresApi } from "./api/scores";
import type { Db } from "./api/shared";
import { storiesApi } from "./api/stories";

export { dateToDb, dateToUi } from "./api/shared";
export type { Db } from "./api/shared";
export type { Database } from "./database.types";

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

export type SavedBoard = {
  id?: string;
  title: string;
  scenarioId: string;
  /** the story this board was designed for */
  storyId?: string | null;
  nodes: BoardNode[];
  edges: BoardEdge[];
  talkTrack?: TalkTrack;
  talkGrade?: number | null;
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
  budget: number;
  checks: Check[];
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
  };
}

export type Api = ReturnType<typeof createApi>;
