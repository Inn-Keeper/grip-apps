-- "Reset goals" in Profile: generated scenarios are marked with their playbook,
-- like generated stories, so one call can remove everything the wizard made.
alter table public.custom_scenarios add column if not exists playbook text;

-- Scenarios generated before this column: found through their generated stories.
update public.custom_scenarios c
set playbook = s.playbook
from public.stories s
where s.scenario_id = c.id::text
  and s.playbook is not null
  and c.playbook is null;

-- Deletes the wizard's output for the caller, edited stories included, and turns
-- the wizard back on. Invoker rights: RLS still limits every statement to own rows.
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
  update profiles
  set goal_techs = '{}', onboarding_completed = false
  where user_id = auth.uid();
end;
$$;
