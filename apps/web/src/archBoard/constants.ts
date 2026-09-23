import { CUSTOM_CATEGORY } from "@grip/core/scenarioCatalog";

export const NODE_W = 112;
export const NODE_H = 46;
// Board area nodes can live in; the viewport pans and zooms over it.
export const WORLD = { width: 4000, height: 3000 };

export { CUSTOM_CATEGORY };

export const SHIP_SCORE = 80;
export const REVIEW_SCORE = 50;
export const MAINT_LEAN_MAX = 8;
export const MAINT_MODERATE_MAX = 14;

export const CATEGORY_ICONS: Record<string, string> = {
  Commerce: "cost",
  Fintech: "payment",
  Social: "contact",
  Realtime: "spark",
  "Content & Media": "cloud",
  "Data & Analytics": "accuracy",
  Infrastructure: "gateway",
  "Mobility & Logistics": "globe",
  Gaming: "drill",
  "B2B SaaS": "service",
  [CUSTOM_CATEGORY]: "board",
};
