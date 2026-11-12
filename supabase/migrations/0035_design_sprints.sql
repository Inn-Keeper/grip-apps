-- Skeleton sprint log: one row per finished 10-minute sprint on the Arch Board.
-- `missed` holds the labels of the design checks the diagram did not cover.
create table if not exists public.design_sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scenario_id text not null check (char_length(scenario_id) <= 120),
  seconds int not null check (seconds between 0 and 600),
  ran_out boolean not null default false,
  hit int not null check (hit >= 0),
  total int not null check (total >= hit),
  missed text[] not null default '{}' check (cardinality(missed) <= 60),
  created_at timestamptz not null default now()
);

alter table public.design_sprints enable row level security;

drop policy if exists "own design sprints" on public.design_sprints;
create policy "own design sprints" on public.design_sprints
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create index if not exists design_sprints_user_created_idx on public.design_sprints (user_id, created_at);
