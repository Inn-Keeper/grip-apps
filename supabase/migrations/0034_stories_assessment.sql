-- The AI grade of a STAR story: { version, inputs, result }, where inputs are the
-- story fields it graded so an edit marks it stale. Nullable and additive.
alter table public.stories add column if not exists assessment jsonb;
