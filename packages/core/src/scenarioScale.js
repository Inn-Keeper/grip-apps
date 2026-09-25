// Scale givens for every scenario — the numbers an interviewer hands you when
// you ask "what's the traffic?". Peak QPS and storage are NOT here: they're
// derived in estimation.js, so the answer can never contradict the question.
//
// Columns: [ dau, actionsPerUserPerDay, writesPerUserPerDay, payloadKb, retentionDays ]
//
//   dau                   daily active users (or devices/tenants/services)
//   actionsPerUserPerDay  every request, reads included — drives QPS
//   writesPerUserPerDay   only the subset that persists — drives storage
//   payloadKb             stored bytes per write
//   retentionDays         how long it's kept (2555 ≈ 7y financial, 3650 = 10y)
//
// Figures are realistic-order, not any real company's. Order of magnitude is
// what's being trained, so 8M vs 9M DAU is noise — 8M vs 800M is the lesson.

/** @type {Record<string, [number, number, number, number, number]>} */
const TABLE = {
  // ── Commerce ────────────────────────────────────────────────────────────
  catalog: [8_000_000, 60, 0.02, 4, 1825],
  flashsale: [2_000_000, 40, 1, 2, 2555],
  "cart-checkout": [5_000_000, 25, 3, 3, 2555],
  "inventory-sync": [50_000, 500, 400, 1, 1095],
  "search-suggest": [10_000_000, 120, 0.5, 1, 365],
  reviews: [6_000_000, 20, 0.3, 8, 3650],
  "promo-codes": [4_000_000, 10, 1, 1, 1095],
  "order-tracking": [3_000_000, 30, 2, 2, 1095],
  "recs-widget": [9_000_000, 50, 0.1, 2, 365],
  "subscription-billing": [2_000_000, 2, 1, 4, 2555],

  // ── Fintech ─────────────────────────────────────────────────────────────
  payment: [3_000_000, 8, 3, 4, 2555],
  ledger: [3_000_000, 10, 6, 1, 3650],
  "fraud-screening": [3_000_000, 8, 3, 6, 1825],
  payouts: [200_000, 5, 3, 3, 2555],
  kyc: [40_000, 12, 4, 250, 2555],
  "fx-rates": [5_000_000, 60, 0.05, 0.5, 730],
  invoicing: [500_000, 6, 2, 60, 2555],
  "wallet-topup": [2_000_000, 6, 2, 2, 2555],
  chargebacks: [100_000, 8, 3, 20, 2555],
  "spend-insights": [4_000_000, 15, 0.2, 3, 1095],

  // ── Social ──────────────────────────────────────────────────────────────
  feed: [50_000_000, 80, 2, 2, 1825],
  "follower-graph": [40_000_000, 60, 0.5, 0.2, 3650],
  notifications: [60_000_000, 30, 12, 1, 90],
  "profile-pages": [30_000_000, 25, 0.1, 5, 3650],
  trending: [25_000_000, 40, 1, 0.5, 30],
  comments: [20_000_000, 35, 3, 1.5, 3650],
  reactions: [60_000_000, 60, 20, 0.1, 1825],
  moderation: [20_000_000, 10, 4, 3, 1095],
  "media-tagging": [15_000_000, 12, 2, 1, 1825],
  "people-search": [20_000_000, 15, 0.05, 1, 365],

  // ── Realtime ────────────────────────────────────────────────────────────
  chat: [30_000_000, 200, 60, 1, 1825],
  presence: [30_000_000, 400, 100, 0.2, 7],
  "live-auction": [500_000, 150, 40, 0.5, 2555],
  "live-scores": [8_000_000, 300, 0.5, 0.5, 365],
  "collab-docs": [3_000_000, 500, 200, 0.3, 1825],
  "push-gateway": [40_000_000, 20, 15, 1, 30],
  "support-chat": [300_000, 120, 40, 1.5, 1095],
  "stock-ticker": [1_000_000, 900, 0.2, 0.3, 730],
  "multiplayer-lobby": [5_000_000, 100, 20, 0.5, 90],
  "courier-stream": [200_000, 900, 700, 0.2, 365],

  // ── Content & Media ─────────────────────────────────────────────────────
  "media-upload": [3_000_000, 8, 1.5, 6000, 1825],
  "video-playback": [20_000_000, 15, 0.2, 3, 365],
  "image-resize": [12_000_000, 40, 3, 400, 730],
  "podcast-feeds": [4_000_000, 12, 0.05, 2, 1825],
  "live-ingest": [50_000, 60, 30, 8000, 90],
  "blog-platform": [800_000, 20, 0.5, 30, 3650],
  "news-home": [15_000_000, 25, 0.05, 10, 3650],
  "ugc-gallery": [6_000_000, 30, 2, 2500, 1825],
  subtitles: [200_000, 6, 2, 40, 1825],
  downloads: [2_000_000, 5, 0.2, 1, 1095],
  "ott-platform": [3_000_000, 40, 0.5, 2, 365],
  "playback-bff": [3_000_000, 6, 1, 1, 365],
  "qoe-telemetry": [3_000_000, 200, 200, 0.5, 30],
  "ad-live": [1_000_000, 300, 20, 1, 90],

  // ── Data & Analytics ────────────────────────────────────────────────────
  clickstream: [40_000_000, 250, 250, 0.5, 400],
  "ab-testing": [30_000_000, 60, 1, 0.3, 730],
  "metrics-dash": [100_000, 200, 2, 1, 400],
  "log-pipeline": [50_000, 20_000, 20_000, 0.5, 30],
  "recs-precompute": [30_000_000, 20, 5, 1, 180],
  "search-indexing": [5_000_000, 30, 10, 3, 730],
  "gdpr-wipe": [30_000_000, 0.01, 0.01, 2, 2555],
  "nightly-reports": [200_000, 5, 2, 50, 1095],
  "anomaly-detect": [20_000, 5000, 100, 0.5, 180],
  "data-export": [100_000, 3, 1, 20_000, 30],

  // ── Infrastructure ──────────────────────────────────────────────────────
  "url-shortener": [20_000_000, 30, 0.3, 0.5, 3650],
  "rate-limited-api": [500_000, 2000, 200, 1, 90],
  "api-keys": [200_000, 20, 0.5, 1, 2555],
  "webhook-ingest": [100_000, 400, 350, 3, 365],
  "feature-flags": [2_000_000, 300, 0.05, 0.5, 730],
  "sso-login": [5_000_000, 4, 2, 1, 730],
  "session-store": [20_000_000, 60, 8, 2, 30],
  "status-page": [3_000_000, 6, 0.01, 2, 1825],
  "file-transfer": [300_000, 40, 20, 5000, 365],
  "tenant-gateway": [400_000, 800, 60, 1, 180],

  // ── Mobility & Logistics ────────────────────────────────────────────────
  "ride-dispatch": [3_000_000, 60, 15, 2, 1825],
  "parcel-tracking": [20_000_000, 15, 4, 1, 1095],
  "fleet-telemetry": [300_000, 2000, 2000, 0.3, 400],
  "eta-service": [5_000_000, 80, 1, 0.5, 90],
  "surge-pricing": [3_000_000, 40, 0.5, 0.3, 730],
  "slot-booking": [4_000_000, 10, 2, 1.5, 1095],
  "route-cache": [5_000_000, 50, 0.5, 5, 90],
  "driver-onboarding": [30_000, 15, 5, 300, 2555],
  "geofence-alerts": [500_000, 600, 30, 0.4, 365],
  "warehouse-scans": [80_000, 900, 850, 0.3, 1095],

  // ── Gaming ──────────────────────────────────────────────────────────────
  leaderboard: [15_000_000, 80, 12, 0.2, 400],
  matchmaking: [8_000_000, 40, 8, 0.5, 180],
  "game-telemetry": [12_000_000, 500, 500, 0.3, 180],
  "daily-rewards": [20_000_000, 4, 2, 0.5, 730],
  "ingame-store": [10_000_000, 15, 1, 2, 2555],
  "anti-cheat": [12_000_000, 300, 60, 0.5, 365],
  "save-sync": [8_000_000, 25, 10, 250, 1825],
  tournaments: [2_000_000, 30, 5, 1, 1095],
  "lobby-chat": [6_000_000, 150, 50, 0.4, 90],
  "season-progress": [15_000_000, 30, 10, 1, 400],

  // ── B2B SaaS ────────────────────────────────────────────────────────────
  "audit-log": [300_000, 60, 25, 1.5, 2555],
  "usage-metering": [200_000, 800, 700, 0.5, 1095],
  "bulk-import": [50_000, 5, 3, 8000, 365],
  "job-scheduler": [80_000, 200, 120, 2, 400],
  "doc-search": [400_000, 40, 3, 20, 1825],
  "scim-sync": [60_000, 30, 15, 2, 1095],
  "email-campaigns": [40_000, 500, 400, 1, 730],
  "tenant-billing": [100_000, 8, 3, 15, 2555],
  "crm-sync": [80_000, 300, 200, 4, 1095],
  "tenant-analytics": [250_000, 60, 2, 2, 1095],
};

/** @type {Record<string, import("./estimation.js").ScenarioScale>} */
export const SCENARIO_SCALE = Object.fromEntries(
  Object.entries(TABLE).map(([id, [dau, actionsPerUserPerDay, writesPerUserPerDay, payloadKb, retentionDays]]) => [
    id,
    { dau, actionsPerUserPerDay, writesPerUserPerDay, payloadKb, retentionDays },
  ])
);
