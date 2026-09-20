#!/usr/bin/env node
// Seeds the `questions` table from packages/core/data/questions/*.json.
//
// Uses the service-role key over PostgREST (no extra deps — Node 22 has fetch).
// Idempotent: for every (tech, difficulty) pair present in the files it deletes
// the existing rows, then inserts the file's rows — so re-running replaces a
// batch cleanly without duplicating.
//
// Usage:
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node scripts/seed-questions.mjs
//
// The service-role key bypasses RLS and must never be committed or shipped to a
// client — keep it in your shell/CI secrets only.
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateQuestionSet } from "../packages/core/src/questions.js";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "../packages/core/data/questions");

const url = process.env.SUPABASE_URL;
// Service role only: the anon key can't delete under RLS, so re-seeding with it would duplicate rows.
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function rest(method, path, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { ...headers, Prefer: "return=minimal" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status} ${res.statusText}: ${await res.text()}`);
  }
}

async function loadAll() {
  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json") && !f.startsWith("._"));
  const questions = [];
  for (const file of files) {
    const rows = JSON.parse(await readFile(join(DATA_DIR, file), "utf8"));
    questions.push(...rows);
  }
  return questions;
}

async function main() {
  const questions = await loadAll();
  const errors = validateQuestionSet(questions);
  if (errors.length) {
    console.error(`Refusing to seed — ${errors.length} validation error(s):`);
    for (const e of errors) console.error(`  • ${e}`);
    process.exit(1);
  }

  // Replace each (tech, difficulty) bucket that appears in the files.
  const buckets = new Map();
  for (const q of questions) buckets.set(`${q.tech}|${q.difficulty}`, { tech: q.tech, difficulty: q.difficulty });
  for (const { tech, difficulty } of buckets.values()) {
    await rest("DELETE", `questions?tech=eq.${encodeURIComponent(tech)}&difficulty=eq.${difficulty}`);
  }

  await rest("POST", "questions", questions);
  console.log(`Seeded ${questions.length} questions across ${buckets.size} (tech, difficulty) buckets.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
