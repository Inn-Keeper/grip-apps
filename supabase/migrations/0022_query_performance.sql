-- Query performance: per-statement auth.uid() in RLS, indexes matching the app's
-- reads, and server-side answer_events aggregates so clients stop paging every row.

-- RLS: (select auth.uid()) is evaluated once per statement instead of once per row.
-- Same rules as before.
drop policy "own rows" on profiles;
create policy "own rows" on profiles
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy "own rows" on contacts;
create policy "own rows" on contacts
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy "own rows" on retros;
create policy "own rows" on retros
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy "own rows" on stories;
create policy "own rows" on stories
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy "own rows" on answer_events;
create policy "own rows" on answer_events
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy "own rows" on arch_boards;
create policy "own rows" on arch_boards
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy "own rows" on status_events;
create policy "own rows" on status_events
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy "own rows" on custom_scenarios;
create policy "own rows" on custom_scenarios
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Indexes for the list orderings and the joins/cascades on foreign keys.
create index contacts_user_created on contacts (user_id, created_at);
create index stories_user_created on stories (user_id, created_at);
create index retros_contact on retros (contact_id);
create index status_events_contact on status_events (contact_id);
-- Covers the per-tech stats below; supersedes (user_id, tech).
create index answer_events_user_tech_created on answer_events (user_id, tech, created_at, id);
drop index answer_events_user_tech;
create index answer_events_user_created on answer_events (user_id, created_at);

-- Per-tech totals plus the review inputs: the correct streak ending at the
-- latest answer, and when that answer was given.
create or replace function answer_tech_stats()
returns table (tech text, correct int, wrong int, streak int, last_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  with events as (
    select e.tech, e.correct, e.created_at, e.id
    from answer_events e
    where e.user_id = (select auth.uid())
  ),
  last_wrong as (
    select distinct on (e.tech) e.tech, e.created_at, e.id
    from events e
    where not e.correct
    order by e.tech, e.created_at desc, e.id desc
  )
  select
    e.tech,
    (count(*) filter (where e.correct))::int,
    (count(*) filter (where not e.correct))::int,
    (count(*) filter (
      where e.correct and (w.tech is null or (e.created_at, e.id) > (w.created_at, w.id))
    ))::int,
    max(e.created_at)
  from events e
  left join last_wrong w on w.tech = e.tech
  group by e.tech;
$$;

-- Answers per local day; p_tz is the client's IANA zone so a late-evening
-- session lands on the right day.
create or replace function answer_daily_totals(p_tz text)
returns table (day date, correct int, total int)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (e.created_at at time zone p_tz)::date,
    (count(*) filter (where e.correct))::int,
    count(*)::int
  from answer_events e
  where e.user_id = (select auth.uid())
  group by 1
  order by 1;
$$;

revoke all on function answer_tech_stats() from public, anon;
revoke all on function answer_daily_totals(text) from public, anon;
grant execute on function answer_tech_stats() to authenticated;
grant execute on function answer_daily_totals(text) to authenticated;
