export type Difficulty = { key: string; label: string; emoji: string; color: string; blurbKey: string; xp: number };
export type QuizQuestion = { question: string; options: string[]; correct: number };
export type PrepItem = { tech: string; oneliner: string; prep: string[]; quiz: QuizQuestion[]; color?: string; emoji?: string; category?: string };
export type Category = { name: string; emoji: string; color: string; items: PrepItem[] };
export type DrillEntry = { tech: string; color: string; link?: string; q: QuizQuestion };
export type DrillState = { questions: DrillEntry[]; index: number; answered: number | null; correctCount: number; done: boolean; difficulty: string;
  // "card": a single tech's quiz opened from its card; recorded and celebrated as such.
  source?: "card" };
export type CelebrationState = { title: string; subtitle: string; accent: string };
export type PoeCue = { type: string; id?: number };
export type ScoreEntry = { correct: number; wrong: number };
export type Scores = { xp: number; answers: Record<string, ScoreEntry> };
export type Summary = { attempts: number; accuracy: number | null; ranked: { tech: string; acc: number; n: number }[] };
export type GithubStatus = { hasUrl: boolean; enabled: boolean; loading: boolean; error: Error | null | unknown; count: number };
// Headline readiness for a set of techs (a prep plan, the profile stack, or what's been practiced).
export type Readiness = { pct: number; label: string; count: number };
export type AccuracyPoint = { date: string; accuracy: number };

// At/above this, accuracy reads as "strong" (success color).
export const ACCURACY_GOOD_PCT = 70;
