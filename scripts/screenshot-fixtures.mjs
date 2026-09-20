// Sample data for the README screenshots. The capture script serves these rows
// instead of letting the app reach Supabase, so every screen shows a populated,
// error-free state without touching a real account.
//
// Shapes are the database rows (snake_case), not the UI models — the app's own
// mapping layer runs on top, the same as in production.

const USER_ID = "00000000-0000-4000-8000-000000000001";

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString();
const dayOnly = (n) => daysAgo(n).slice(0, 10);

export const profile = {
  user_id: USER_ID,
  email: "demo@grip.local",
  display_name: "Demo User",
  avatar_url: null,
  headline: "Senior Frontend Engineer",
  target_role: "Staff Engineer",
  location: "Stockholm, Sweden",
  portfolio_url: "https://example.com",
  github_url: "https://github.com/example",
  linkedin_url: "https://linkedin.com/in/example",
  timezone: "Europe/Stockholm",
  onboarding_completed: true,
  xp: 740,
  created_at: daysAgo(90),
  updated_at: daysAgo(1),
};

export const contacts = [
  {
    id: "c1", user_id: USER_ID, name: "Northwind Labs", status: "Interviewing",
    role: "Senior Frontend Engineer", link: "https://example.com/jobs/northwind",
    note: "Third round is a system design session on their checkout flow.",
    date: dayOnly(21), next_action: "Prepare the design round", next_action_date: dayOnly(-2),
    posting_techs: ["React", "TypeScript", "GraphQL"], created_at: daysAgo(21), retros: [],
  },
  {
    id: "c2", user_id: USER_ID, name: "Harbor Analytics", status: "Applied",
    role: "Staff Engineer", link: "https://example.com/jobs/harbor",
    note: "Referred by a former colleague on the data platform team.",
    date: dayOnly(9), next_action: "Follow up with the recruiter", next_action_date: dayOnly(1),
    posting_techs: ["TypeScript", "PostgreSQL", "Kubernetes"], created_at: daysAgo(9), retros: [],
  },
  {
    id: "c3", user_id: USER_ID, name: "ペンギン Studio", status: "Offer",
    role: "Frontend Lead", link: "https://example.com/jobs/penguin",
    note: "Offer received. Comparing scope and remote policy before answering.",
    date: dayOnly(34), next_action: "Answer by Friday", next_action_date: dayOnly(-1),
    posting_techs: ["React Native", "Expo"], created_at: daysAgo(34), retros: [],
  },
  {
    id: "c4", user_id: USER_ID, name: "Vector Freight", status: "Contacted",
    role: "Platform Engineer", link: null,
    note: "Cold outreach from their hiring manager on LinkedIn.",
    date: dayOnly(4), next_action: "Reply with availability", next_action_date: dayOnly(2),
    posting_techs: ["Go", "AWS"], created_at: daysAgo(4), retros: [],
  },
  {
    id: "c5", user_id: USER_ID, name: "Bright Meridian", status: "Rejected",
    role: "Senior Engineer", link: null,
    note: "Rejected after the take-home. Feedback: wanted deeper caching detail.",
    date: dayOnly(52), next_action: null, next_action_date: null,
    posting_techs: ["Vue", "Redis"], created_at: daysAgo(52),
    retros: [{
      id: "r1", contact_id: "c5", round: "Take-home",
      questions: "Design a rate limiter for a public API.",
      went_well: "Clear write-up, tests covered the edge cases.",
      to_improve: "Should have justified the cache eviction policy out loud.",
      created_at: daysAgo(50),
    }],
  },
];

export const stories = [
  {
    id: "s1", user_id: USER_ID, title: "Rescuing a stalled checkout rewrite", competency: "Delivery",
    situation: "A six-month checkout rewrite was two sprints from launch with no working end-to-end path.",
    task: "I took over delivery and had to ship something payable before the holiday freeze.",
    action: "Cut scope to one payment provider, put the rest behind flags, and set a daily working-build rule.",
    result: "Shipped eight days before the freeze; conversion held and the remaining providers landed in January.",
    created_at: daysAgo(40),
  },
  {
    id: "s2", user_id: USER_ID, title: "Disagreeing with a principal engineer", competency: "Conflict",
    situation: "A proposed event-sourced rewrite would have taken three quarters for a team of four.",
    task: "I thought the cost outweighed the benefit but had to keep the working relationship intact.",
    action: "Wrote up both designs with real numbers, then asked to trial the cheaper path for one quarter.",
    result: "The trial met the latency target; we kept the simpler design and the rewrite was dropped.",
    created_at: daysAgo(26),
  },
  {
    id: "s3", user_id: USER_ID, title: "Onboarding three juniors in one quarter", competency: "Mentoring",
    situation: "The team tripled in size while our onboarding was a stale wiki page.",
    task: "Get three new engineers shipping without stalling the roadmap.",
    action: "Paired daily for two weeks, rewrote setup docs from their questions, gave each a small owned surface.",
    result: "All three shipped to production in under three weeks; setup time dropped from two days to two hours.",
    created_at: daysAgo(12),
  },
];

// A believable practice history: strong on the day-to-day stack, weaker where
// the Signal panel should point you next.
const TECH_ACCURACY = [
  ["React", 24, 3], ["TypeScript", 21, 4], ["JavaScript", 18, 2], ["CSS", 12, 5],
  ["Node.js", 14, 6], ["PostgreSQL", 9, 8], ["Kubernetes", 4, 11], ["Redis", 6, 7],
];

export const answerEvents = TECH_ACCURACY.flatMap(([tech, correct, wrong], techIndex) =>
  Array.from({ length: correct + wrong }, (_, i) => ({
    id: `${tech}-${i}`,
    user_id: USER_ID,
    tech,
    correct: i < correct,
    source: "card",
    difficulty: ["easy", "mid", "high", "ultra"][i % 4],
    created_at: daysAgo(30 - Math.floor((i / (correct + wrong)) * 29) + techIndex * 0.01),
  }))
);

export const statusEvents = [
  { id: "e1", user_id: USER_ID, contact_id: "c1", status: "Contacted", created_at: daysAgo(21) },
  { id: "e2", user_id: USER_ID, contact_id: "c1", status: "Applied", created_at: daysAgo(18) },
  { id: "e3", user_id: USER_ID, contact_id: "c1", status: "Interviewing", created_at: daysAgo(11) },
  { id: "e4", user_id: USER_ID, contact_id: "c2", status: "Contacted", created_at: daysAgo(9) },
  { id: "e5", user_id: USER_ID, contact_id: "c2", status: "Applied", created_at: daysAgo(6) },
  { id: "e6", user_id: USER_ID, contact_id: "c3", status: "Interviewing", created_at: daysAgo(20) },
  { id: "e7", user_id: USER_ID, contact_id: "c3", status: "Offer", created_at: daysAgo(3) },
];

// Scores every check of the "catalog" scenario and stays under its budget of 11,
// so the board shows a finished design rather than an empty canvas.
const catalogNodes = [
  { id: "n1", type: "client", x: 80, y: 150 },
  { id: "n2", type: "cdn", x: 330, y: 40 },
  { id: "n3", type: "lb", x: 330, y: 260 },
  { id: "n4", type: "service", x: 590, y: 260, replicas: 3 },
  { id: "n5", type: "cache", x: 850, y: 150 },
  { id: "n6", type: "sql", x: 850, y: 370, partitionKey: "product_id", replicas: 2 },
  { id: "n7", type: "monitor", x: 590, y: 40 },
];

const catalogEdges = [
  { id: "e1", from: "n1", to: "n2", mode: "sync", protocol: "HTTP" },
  { id: "e2", from: "n1", to: "n3", mode: "sync", protocol: "HTTP" },
  { id: "e3", from: "n3", to: "n4", mode: "sync", protocol: "HTTP" },
  { id: "e4", from: "n4", to: "n5", mode: "sync", protocol: "TCP" },
  { id: "e5", from: "n4", to: "n6", mode: "sync", protocol: "TCP" },
];

export const boards = [
  {
    id: "b1", user_id: USER_ID, title: "Product catalog — CDN + read cache",
    scenario_id: "catalog", nodes: catalogNodes, edges: catalogEdges,
    talk_track: {
      sections: {
        requirements: "8M DAU browsing a catalog, read-heavy at roughly 60 reads per user per day. Writes are rare and editorial. Target p95 under 200ms worldwide, availability over reads matters more than write freshness.",
        estimates: "8M × 60 = 480M reads/day ≈ 5.6k req/s average, ~17k at peak. Writes are 0.02/user/day at 4KB, so storage over five years stays in the low terabytes.",
        api: "GET /products/{id} and GET /categories/{slug}/products, both cacheable and paginated. Writes go through an editorial endpoint that invalidates by product id.",
        data: "Products partitioned by product_id, two replicas for read scale. Cache holds rendered product payloads keyed by id and locale.",
        bottleneck: "The database under read fan-out. The CDN absorbs static assets and the Redis cache absorbs hot product reads, so only misses reach Postgres.",
        tradeoffs: "Cached reads mean editorial changes can lag by the TTL. We accept that for catalog data and invalidate explicitly on publish, rather than paying for strongly consistent reads at this scale.",
      },
      rating: null,
    },
    talk_grade: 82, share_token: null, created_at: daysAgo(6), updated_at: daysAgo(1),
  },
  {
    id: "b2", user_id: USER_ID, title: "Ride matching — first pass",
    scenario_id: "rides", nodes: [], edges: [],
    talk_track: { sections: {}, rating: null }, talk_grade: null,
    share_token: null, created_at: daysAgo(15), updated_at: daysAgo(15),
  },
];

export const velocity = {
  stages: [
    { fromStage: "CONTACTED", toStage: "APPLIED", avgDays: 3.2, transitions: 12 },
    { fromStage: "APPLIED", toStage: "INTERVIEWING", avgDays: 8.6, transitions: 7 },
    { fromStage: "INTERVIEWING", toStage: "OFFER", avgDays: 11.4, transitions: 3 },
  ],
};

export const customScenarios = [];
