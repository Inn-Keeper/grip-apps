import React from "react";
import type { Difficulty } from "./types";

const DIFFICULTY_PATHS: Record<string, (color: string) => React.ReactElement> = {
  // Single calm bar — flat, easy
  easy: (color: string) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="7" width="12" height="4" rx="2" fill={color} />
    </svg>
  ),
  // Three ascending bars — building momentum
  mid: (color: string) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="11" width="4" height="5" rx="1.2" fill={color} opacity="0.55" />
      <rect x="7" y="7.5" width="4" height="8.5" rx="1.2" fill={color} opacity="0.78" />
      <rect x="12" y="3" width="4" height="13" rx="1.2" fill={color} />
    </svg>
  ),
  // Flame — angular, aggressive
  high: (color: string) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16C5.5 16 3 13.5 3 10.5C3 7 5 6 5 6C5 8 6.5 8.5 7 8C7 5.5 8.5 3 11 2C10.5 4 11.5 5.5 12.5 5.5C13.5 5.5 14 4.5 14 4.5C15 6 15 8.5 14 10.5C13.5 9.5 12.5 9 12.5 9C12.5 11 11 12 11 12C11 10.5 10 9.5 9.5 9.5C9.5 11.5 9 14 9 16Z" fill={color} />
    </svg>
  ),
  // Diamond with inner cross — precision / hard-edged
  ultra: (color: string) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 2L16 9L9 16L2 9L9 2Z" stroke={color} strokeWidth="1.5" fill={`${color}22`} />
      <line x1="6" y1="6" x2="12" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="6" x2="6" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export function DifficultyIcon({ tier, size = 18 }: { tier: Difficulty | undefined | null; size?: number }) {
  if (!tier) return null;
  const render = DIFFICULTY_PATHS[tier.key];
  if (!render) return null;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0
      }}
    >
      {render(tier.color)}
    </span>
  );
}
