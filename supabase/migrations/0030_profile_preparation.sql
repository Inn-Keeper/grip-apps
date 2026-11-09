-- Profile "Your preparation": the saved focus, brief, accepted GitHub signals and
-- the active playbook manifest. One row per user. Raw CV, job text and notes are never stored.
create table if not exists public.user_preparation (
  user_id uuid primary key references auth.users (id) on delete cascade,
  goal text not null default 'explore' check (goal in ('technical', 'stories', 'design', 'explore')),
  brief text not null default '' check (char_length(brief) <= 4000),
  github_techs text[] not null default '{}' check (cardinality(github_techs) <= 60),
  github_synced_at timestamptz,
  active_playbook jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_preparation enable row level security;

drop policy if exists "own preparation" on public.user_preparation;
create policy "own preparation" on public.user_preparation
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Saves profile fields and preparation together, or neither. Invoker rights: RLS
-- scopes every statement; the owner always comes from auth.uid(), never the client.
create or replace function public.save_preparation(
  p_target_role text,
  p_goal_techs text[],
  p_favorite_techs text[],
  p_cv_techs text[],
  p_goal text,
  p_brief text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if cardinality(p_goal_techs) > 60 or cardinality(p_favorite_techs) > 60 or cardinality(p_cv_techs) > 60 then
    raise exception 'too many technologies';
  end if;
  insert into profiles (user_id, target_role, goal_techs, favorite_techs, cv_techs)
  values (auth.uid(), nullif(trim(p_target_role), ''), p_goal_techs, p_favorite_techs, p_cv_techs)
  on conflict (user_id) do update
    set target_role = excluded.target_role,
        goal_techs = excluded.goal_techs,
        favorite_techs = excluded.favorite_techs,
        cv_techs = excluded.cv_techs;
  insert into user_preparation (user_id, goal, brief)
  values (auth.uid(), p_goal, coalesce(p_brief, ''))
  on conflict (user_id) do update
    set goal = excluded.goal, brief = excluded.brief, updated_at = now();
end;
$$;

-- Accepting reviewed GitHub suggestions: records them and adds them to the stack.
-- Favourites are never touched. A fetch alone only updates the timestamp (p_accepted empty).
create or replace function public.save_github_signals(p_accepted text[], p_synced_at timestamptz)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if cardinality(p_accepted) > 60 then raise exception 'too many technologies'; end if;
  insert into user_preparation (user_id, github_techs, github_synced_at)
  values (auth.uid(), p_accepted, p_synced_at)
  on conflict (user_id) do update
    set github_techs = (select coalesce(array_agg(distinct t), '{}') from unnest(user_preparation.github_techs || p_accepted) t),
        github_synced_at = coalesce(p_synced_at, user_preparation.github_synced_at),
        updated_at = now();
  if cardinality(p_accepted) > 0 then
    update profiles
    set goal_techs = (select coalesce(array_agg(distinct t), '{}') from unnest(goal_techs || p_accepted) t)
    where user_id = auth.uid();
  end if;
end;
$$;

-- Publishes a generated playbook: creates its scenario, starter board and stories, then
-- swaps the active manifest, all in one transaction. p_generation_id makes retries
-- idempotent; p_expected_generation_id rejects a concurrent replacement.
create or replace function public.publish_preparation_playbook(
  p_generation_id text,
  p_expected_generation_id text,
  p_snapshot jsonb,
  p_label text,
  p_playbook jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_active jsonb;
  v_scenario uuid;
  v_board uuid;
  v_story uuid;
  v_story_ids text[] := '{}';
  v_item jsonb;
  v_manifest jsonb;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if coalesce(p_generation_id, '') = '' or jsonb_typeof(p_snapshot) <> 'object'
     or jsonb_typeof(p_playbook -> 'scenario') <> 'object'
     or jsonb_typeof(p_playbook -> 'stories') <> 'array'
     or jsonb_array_length(p_playbook -> 'stories') > 20 then
    raise exception 'invalid playbook';
  end if;

  insert into user_preparation (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select active_playbook into v_active from user_preparation where user_id = auth.uid() for update;

  if v_active ->> 'generationId' = p_generation_id then return v_active; end if;
  if coalesce(v_active ->> 'generationId', '') <> coalesce(p_expected_generation_id, '') then
    raise exception 'playbook_conflict';
  end if;

  insert into custom_scenarios (user_id, name, brief, checks, playbook)
  values (auth.uid(), p_playbook #>> '{scenario,name}', coalesce(p_playbook #>> '{scenario,brief}', ''),
          coalesce(p_playbook #> '{scenario,checks}', '[]'), p_label)
  returning id into v_scenario;

  if jsonb_typeof(p_playbook -> 'board') = 'object' then
    insert into arch_boards (user_id, title, scenario_id, nodes, edges)
    values (auth.uid(), p_playbook #>> '{board,title}', v_scenario::text,
            coalesce(p_playbook #> '{board,nodes}', '[]'), '[]')
    returning id into v_board;
  end if;

  for v_item in select * from jsonb_array_elements(p_playbook -> 'stories') loop
    insert into stories (user_id, title, competency, situation, task, action, result, scenario_id, is_sample, playbook)
    values (auth.uid(), v_item ->> 'title', v_item ->> 'competency', v_item ->> 'situation', v_item ->> 'task',
            v_item ->> 'action', v_item ->> 'result',
            case when (v_item ->> 'technical')::boolean then v_scenario::text end, true, p_label)
    returning id into v_story;
    v_story_ids := v_story_ids || v_story::text;
  end loop;

  v_manifest := jsonb_build_object(
    'generationId', p_generation_id, 'snapshot', p_snapshot, 'label', p_label,
    'scenarioId', v_scenario::text, 'boardId', v_board::text, 'storyIds', to_jsonb(v_story_ids),
    'createdAt', now());
  update user_preparation set active_playbook = v_manifest, updated_at = now() where user_id = auth.uid();
  return v_manifest;
end;
$$;

-- Reset goals also forgets the preparation (migration 0029 behaviour otherwise unchanged).
create or replace function public.reset_goals()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from arch_boards
  where user_id = auth.uid()
    and scenario_id in (
      select id::text from custom_scenarios where user_id = auth.uid() and playbook is not null
    );
  delete from custom_scenarios where user_id = auth.uid() and playbook is not null;
  delete from stories where user_id = auth.uid() and playbook is not null;
  delete from user_preparation where user_id = auth.uid();
  update profiles
  set goal_techs = '{}', onboarding_completed = false
  where user_id = auth.uid();
end;
$$;
