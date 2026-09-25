# Question bank

Source of truth for the tiered quiz `questions` table. One JSON file per
category; each entry is one question:

```json
{
  "tech": "TypeScript",
  "category": "Languages",
  "difficulty": "easy",
  "prompt": "…",
  "options": ["correct answer", "distractor", "distractor", "distractor"],
  "correct": 0,
  "explanation": "Why the right answer is right."
}
```

## Conventions

- **`correct` is the index into `options`.** By convention the right answer is
  authored at index `0`; options are shuffled at runtime by `shuffleOptions()`
  in `packages/core/src/quiz.js`, so order on screen is randomized.
- **Exactly 4 options**, all non-empty.
- **`difficulty`** ∈ `easy` (☀️ Clear Skies) · `mid` (🍃 Tailwind) · `high` (🌬️
  Headwind) · `ultra` (⛈️ Thunderstorm). See `packages/core/src/difficulty.js`.
- **No duplicate prompt** within the same technology, even across difficulty
  tiers.

`validateQuestionSet()` (`packages/core/src/questions.js`) checks structure and
duplicates in both the content test (`__tests__/questions-data.test.js`) and the
seed script. The content test also checks for generic padding and conspicuous
answer-length patterns. These checks do not establish factual correctness;
answers and distractors still need subject-matter review.

## Adding / growing a batch

Add entries to the matching category file in reviewable per-tech batches, then
run the content tests from the repository root:

```bash
pnpm --filter @grip/core test
```

To update the live question table, set `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` in the repository root `.env` (see `.env.example`),
then run `pnpm seed:questions`. Keep the service-role key out of client env
files and git. The seed script deletes every `(tech, difficulty)` bucket in the
JSON files, then inserts all questions. It is repeatable, but the delete and
insert are separate requests: if insertion fails, the deleted rows are not
restored automatically.

## Coverage status

The JSON source contains **5,440 questions** across 54 technologies, 11
categories and four difficulty tiers. Most `(tech, difficulty)` buckets have 25
questions; eight have 30. This describes the files, not the current contents
of the live database.

| Category          | File                   | Techs | Questions |
| ----------------- | ---------------------- | ----: | --------: |
| Languages         | `languages.json`       |     8 |       820 |
| Frontend & Mobile | `frontend-mobile.json` |    11 |     1,120 |
| Backend           | `backend.json`         |     6 |       600 |
| Cloud & DevOps    | `cloud-devops.json`    |     6 |       600 |
| Monitoring        | `monitoring.json`      |     5 |       500 |
| AI Tooling        | `ai-tooling.json`      |     3 |       300 |
| Testing           | `testing.json`         |     4 |       400 |
| Mobile Delivery   | `mobile-delivery.json` |     1 |       100 |
| Databases & CRM   | `databases-crm.json`   |     8 |       800 |
| Engineering       | `engineering.json`     |     1 |       100 |
| Streaming         | `streaming.json`       |     1 |       100 |
