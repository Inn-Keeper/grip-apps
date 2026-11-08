import type { Dispatch } from "react";
import type { WizardState } from "./wizardState.js";

export type Goal = "technical" | "stories" | "design" | "explore";
export const GOALS: Goal[] = ["technical", "stories", "design", "explore"];

export type StepProps = { state: WizardState; dispatch: Dispatch<Record<string, unknown> & { type: string }> };
