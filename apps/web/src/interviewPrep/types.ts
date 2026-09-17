export type Difficulty = { key: string; label: string; emoji: string; color: string; blurbKey: string; xp: number };
export type QuizQuestion = { question: string; options: string[]; correct: number };
export type PrepItem = { tech: string; oneliner: string; prep: string[]; quiz: QuizQuestion[]; color?: string; emoji?: string; category?: string };
export type Category = { name: string; emoji: string; color: string; items: PrepItem[] };
// "result": the short run summary shown before the card flips back.
export type CardState = { phase: "front" | "back" | "quiz" | "result"; quizIndex: number; answered: number | null; runCorrect: number; shuffled: QuizQuestion[] | null; resultXp?: number; resultTotal?: number };
export type DrillEntry = { tech: string; color: string; link?: string; q: QuizQuestion };
export type DrillState = { questions: DrillEntry[]; index: number; answered: number | null; correctCount: number; done: boolean; difficulty: string };
export type CelebrationState = { title: string; subtitle: string; accent: string };
export type PoeCue = { type: string; id?: number };
export type ScoreEntry = { correct: number; wrong: number };
export type Scores = { xp: number; answers: Record<string, ScoreEntry> };
export type Summary = { attempts: number; accuracy: number | null; ranked: { tech: string; acc: number; n: number }[] };
export type GithubStatus = { hasUrl: boolean; enabled: boolean; loading: boolean; error: Error | null | unknown; count: number };
export type AccuracyPoint = { date: string; accuracy: number };

// At/above this, accuracy reads as "strong" (success color).
export const ACCURACY_GOOD_PCT = 70;
