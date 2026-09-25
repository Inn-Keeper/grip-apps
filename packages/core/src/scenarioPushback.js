// One hard follow-up per scenario — the question a good interviewer asks once
// your diagram is on the board. Node-level probes live in pushback.js; these
// are the ones only this problem can ask.
//
// Each targets the specific thing the scenario makes tempting to hand-wave.

/** @type {Record<string, string>} */
export const SCENARIO_PUSHBACK = {
  // ── Commerce ────────────────────────────────────────────────────────────
  catalog: "A merchandiser edits a price. How long until every shopper sees it, and who is upset by that number?",
  flashsale: "Ten thousand people hold the last hundred tickets in their carts. Who actually gets them, and when do the rest find out?",
  "cart-checkout": "A user checks out on their phone and their laptop at the same moment. What stops two orders?",
  "inventory-sync": "The warehouse feed goes silent for six hours. Do you keep selling, and what do you tell the customer?",
  "search-suggest": "A brand-new product is listed. How long before it appears in autocomplete, and is that acceptable?",
  reviews: "Moderation is backed up by two hours. Does the reviewer see their own review in the meantime?",
  "promo-codes": "A code capped at 100 uses gets 5,000 simultaneous redemptions. Where exactly is that count serialized?",
  "order-tracking": "The carrier replays a week of webhooks by mistake. What does the customer's tracking page show?",
  "recs-widget": "The recommendation service is down. What renders in that slot, and what does it cost you to get it wrong?",
  "subscription-billing": "The renewal job dies a third of the way through. How do you resume without double-charging anyone?",

  // ── Fintech ─────────────────────────────────────────────────────────────
  payment: "The provider charges the card, then your service crashes before writing the record. How do you find out, and how do you fix it?",
  ledger: "Prove to me that this ledger balances. What query would you run, and how long does it take at a billion rows?",
  "fraud-screening": "Your model takes 400ms and the checkout budget is 200ms. What do you cut?",
  payouts: "A payout batch partially fails at 3am. Who is paid, who isn't, and how does the retry not pay anyone twice?",
  kyc: "A document review takes two days. Where does the user's application live in the meantime, and what can they do?",
  "fx-rates": "The rate feed is stale by 90 seconds during a spike. Do you quote it, hold it, or refuse the trade?",
  invoicing: "An invoice is regenerated after a correction. Which version is the legal one, and can you still produce last year's?",
  "wallet-topup": "The bank confirms a top-up twice. What in your design makes the second one a no-op?",
  chargebacks: "A chargeback arrives for an order from 14 months ago. Is that data still online, and how fast can you produce evidence?",
  "spend-insights": "The categorisation model gets it wrong. How does a user correct it, and does that correction stick?",

  // ── Social ──────────────────────────────────────────────────────────────
  feed: "An account with 40 million followers posts. Walk me through what happens in the next ten seconds.",
  "follower-graph": "Someone follows and unfollows the same account repeatedly. What does that do to your caches?",
  notifications: "A user has the app open on three devices. How many buzzes do they get, and how do the other two clear?",
  "profile-pages": "A profile goes viral and gets a million hits a minute. What breaks first, and what do you cache?",
  trending: "Explain how a coordinated group of a thousand accounts can't manufacture a trend.",
  comments: "A thread hits 200,000 comments. How do you paginate that without an offset scan?",
  reactions: "Two people like the same post in the same millisecond. Where does the counter actually get incremented?",
  moderation: "Something illegal is posted. How fast can it be gone everywhere, including caches and CDN?",
  "media-tagging": "The tagging pipeline is six hours behind. Does the photo publish anyway?",
  "people-search": "Someone deletes their account. How long until they stop appearing in search results?",

  // ── Realtime ────────────────────────────────────────────────────────────
  chat: "A user's phone drops off for ten minutes. When it reconnects, how do they get exactly the messages they missed?",
  presence: "Fifty thousand users disconnect at once when a mobile network drops. How does your presence state avoid lying?",
  "live-auction": "Two bids arrive within a millisecond of each other from different regions. Who wins, and how do you prove it?",
  "live-scores": "The score is wrong for eight seconds. Which is worse here: being stale or being inconsistent between users?",
  "collab-docs": "Two people type in the same paragraph offline, then both reconnect. What does the document say?",
  "push-gateway": "APNs is degraded for twenty minutes. What happens to the notifications queued behind it?",
  "support-chat": "An agent's connection drops mid-conversation. Does the customer notice, and where does the transcript live?",
  "stock-ticker": "You cannot push 900 updates a second to a browser. What do you actually send?",
  "multiplayer-lobby": "The host of a lobby disconnects. Who becomes host, and what happens to players mid-join?",
  "courier-stream": "A courier drives through a tunnel and buffers ten minutes of GPS. What do you do with that burst on reconnect?",

  // ── Content & Media ─────────────────────────────────────────────────────
  "media-upload": "A 4GB upload fails at 95%. What does the retry actually re-send?",
  "video-playback": "A user pays for premium and shares their credentials with forty people. What in this design notices?",
  "image-resize": "The same image is requested in twelve sizes simultaneously, none cached. What stops twelve resize jobs?",
  "podcast-feeds": "An episode is pulled for legal reasons. How long until it stops being downloadable everywhere?",
  "live-ingest": "The broadcaster's uplink drops for eight seconds mid-stream. What do viewers see?",
  "blog-platform": "Two editors save the same draft at once. Whose version survives, and how does the other find out?",
  "news-home": "A story breaks and traffic goes up 50x in ninety seconds. What do you serve while the origin catches up?",
  "ugc-gallery": "Storage grows 27TB a day. What's your tiering plan, and when does old content stop being instantly available?",
  subtitles: "Transcription takes twelve minutes for a ten-minute video. Does the video publish before subtitles exist?",
  downloads: "A release goes out and a million clients pull 2GB at once. How do you not pay for all of that bandwidth?",
  "ott-platform": "Two million viewers press play in the minute before kickoff. Which component melts first, and what did you pre-warm?",
  "playback-bff": "The ad config dependency takes three seconds to answer. Does the viewer wait, get no ads, or get a default?",
  "qoe-telemetry": "A viewer calls support saying the match froze. What do you type to find their session, and how old can that data be?",
  "ad-live": "The break marker arrives two seconds late. What do viewers see at the start and end of the break?",

  // ── Data & Analytics ────────────────────────────────────────────────────
  clickstream: "You are dropping 2% of events under load. Is that acceptable, and how would you even know?",
  "ab-testing": "A user clears cookies mid-experiment. Which variant do they get, and what does that do to your results?",
  "metrics-dash": "A dashboard query scans a year of data. How do you stop one analyst from taking the cluster down?",
  "log-pipeline": "Logging volume triples during an incident, exactly when you need it most. What gives?",
  "recs-precompute": "The nightly job overruns into business hours. Do you serve yesterday's recommendations or wait?",
  "search-indexing": "The index and the source of truth disagree. How do you detect that, and how do you repair it?",
  "gdpr-wipe": "A user requests deletion. Name every place their data lives, including backups and derived tables.",
  "nightly-reports": "The report is wrong and finance already sent it out. How do you regenerate a report as of last Tuesday?",
  "anomaly-detect": "Your alerting fires 200 times in an hour during an outage. What did you get wrong?",
  "data-export": "A tenant exports 20GB. Where does that file live, who can reach it, and when does it disappear?",

  // ── Infrastructure ──────────────────────────────────────────────────────
  "url-shortener": "How long is your key, and show me the arithmetic that says you won't collide.",
  "rate-limited-api": "Your limiter runs on ten instances. How do they agree on one client's count without a round trip each time?",
  "api-keys": "A key leaks into a public repo. What is the blast radius, and how fast can you kill it?",
  "webhook-ingest": "A partner sends the same webhook four times because you were slow to 200. How do you not process it four times?",
  "feature-flags": "The flag service is unreachable at app start. What value does every flag take, and who decided that?",
  "sso-login": "The identity provider is down. Is anyone able to log in, and should they be?",
  "session-store": "The session store restarts and loses everything. What does that look like to 20 million users?",
  "status-page": "Your status page is hosted on the infrastructure that just went down. Now what?",
  "file-transfer": "A transfer resumes from a different IP three days later. How do you know it's the same upload and still trust it?",
  "tenant-gateway": "One tenant sends 100x their usual traffic. Prove the other tenants don't notice.",

  // ── Mobility & Logistics ────────────────────────────────────────────────
  "ride-dispatch": "Two riders request the same driver simultaneously. Where is that decision made, and how long does it hold?",
  "parcel-tracking": "A parcel is scanned as delivered before it's scanned as out-for-delivery. What does the customer see?",
  "fleet-telemetry": "You're ingesting 600k points a second and the database can't keep up. What do you drop or downsample first?",
  "eta-service": "Your ETA is wrong by ten minutes during traffic. Is it better to be fast and wrong or slow and right here?",
  "surge-pricing": "A rider is quoted a price, then surge changes before they confirm. Which price do they pay?",
  "slot-booking": "The last delivery slot is offered to fifty people browsing at once. Who gets it, and when do the others find out?",
  "route-cache": "A road closes. How does a cached route know it's now wrong?",
  "driver-onboarding": "A driver's background check comes back a week later. What could they do in the meantime?",
  "geofence-alerts": "A vehicle sits exactly on a fence boundary with GPS jitter. How do you not send forty alerts?",
  "warehouse-scans": "The scanner network drops for an hour during peak. What do the handheld devices do with those scans?",

  // ── Gaming ──────────────────────────────────────────────────────────────
  leaderboard: "A player wants their rank out of 15 million. How do you answer that in under 50ms?",
  matchmaking: "A high-skill player at 3am has nobody to match with. How long do they wait, and what do you relax first?",
  "game-telemetry": "You're taking 6 million events a second at launch. What's your plan for the first hour after release?",
  "daily-rewards": "A player changes their device timezone to claim twice. What stops them?",
  "ingame-store": "A purchase succeeds but the item never arrives. How does the player get it without a support ticket?",
  "anti-cheat": "You ban a player and they're innocent. What in this pipeline lets you prove it either way?",
  "save-sync": "A player plays offline on two devices, then both sync. Which save wins, and who decides?",
  tournaments: "A player disconnects mid-bracket. Does the bracket wait, forfeit them, or substitute?",
  "lobby-chat": "Chat has to be moderated but can't be slow. Where does moderation sit relative to delivery?",
  "season-progress": "The season ends at midnight in every timezone at once. What does that do to your write load?",

  // ── B2B SaaS ────────────────────────────────────────────────────────────
  "audit-log": "An auditor asks for every action by one user across three years. How long does that query take?",
  "usage-metering": "You under-count usage by 3% and bill on it. How would you ever find out?",
  "bulk-import": "A tenant uploads a 40MB CSV with errors on row 30,000. What happens to rows 1 through 29,999?",
  "job-scheduler": "A job scheduled for 02:00 daily fails to start. Does it run late, get skipped, or double-run tomorrow?",
  "doc-search": "Tenant A must never see tenant B's documents. Where in this design is that actually enforced?",
  "scim-sync": "An employee is deprovisioned in the IdP. How long until they lose access here, and is that fast enough?",
  "email-campaigns": "A campaign to 2 million recipients is halfway sent when someone hits stop. What happens?",
  "tenant-billing": "A customer disputes an invoice from eight months ago. Can you reconstruct exactly how it was calculated?",
  "crm-sync": "The same contact is edited in both systems within a second. Which write wins, and who resolves it?",
  "tenant-analytics": "A tenant's dashboard query is slow because another tenant has 1000x the data. What do you do?",
};
