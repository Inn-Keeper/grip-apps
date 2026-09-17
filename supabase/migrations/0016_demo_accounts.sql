-- Demo mode: visitors can try Grip through Supabase anonymous sign-in.
-- Each new anonymous user gets sample rows so every screen has something to
-- show. Rows stay with the account if the visitor later links GitHub.
-- Stale anonymous users are removed by a Supabase Cron job configured in the
-- dashboard (not here); every user table cascades on auth.users delete.

create or replace function seed_demo_data(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  acme_id uuid;
  globex_id uuid;
begin
  insert into profiles (user_id, xp, display_name, target_role)
  values (uid, 180, 'Demo visitor', 'Senior Frontend Engineer')
  on conflict (user_id) do update
    set xp = excluded.xp,
        display_name = coalesce(profiles.display_name, excluded.display_name),
        target_role = coalesce(profiles.target_role, excluded.target_role);

  -- Pipeline: the status trigger records each stage change for the funnel.
  insert into contacts (user_id, name, status, role, note, date, next_action, next_action_date, posting_techs)
  values (uid, 'Acme Corp', 'Applied', 'Senior Frontend Engineer', 'Referral from a former teammate.',
          current_date - 12, 'Prepare system design round', current_date + 2, array['React', 'TypeScript', 'GraphQL (Relay)'])
  returning id into acme_id;
  update contacts set status = 'Interviewing', date = current_date - 5 where id = acme_id;

  insert into contacts (user_id, name, status, role, note, date, posting_techs)
  values (uid, 'Globex', 'Applied', 'Full-stack Engineer', 'Applied through the careers page.',
          current_date - 3, array['Node.js', 'PostgreSQL', 'Docker'])
  returning id into globex_id;

  insert into retros (user_id, contact_id, round, questions, went_well, to_improve, date, struggled_techs)
  values (uid, acme_id, 'Technical screen', 'State management trade-offs; debounce vs throttle.',
          'Explained React rendering clearly.', 'Be crisper on GraphQL caching.', current_date - 5,
          array['GraphQL (Relay)']);

  insert into stories (user_id, title, competency, situation, task, action, result) values
    (uid, 'Untangled a flaky release pipeline', 'Delivery',
     'Releases failed one in three times because of flaky end-to-end tests.',
     'Get releases reliable again without pausing feature work.',
     'Quarantined flaky specs, added retries with reporting, and fixed the top five root causes.',
     'Release failures dropped from 33% to 4% within a month.'),
    (uid, 'Disagreed on a data model, then aligned', 'Conflict',
     'A teammate and I wanted different schemas for a new billing feature.',
     'Pick a design both of us could support before the sprint started.',
     'Wrote a one-page comparison with query examples and asked for a 20-minute review.',
     'We shipped the hybrid design and it has not needed a migration since.');

  insert into arch_boards (user_id, title, scenario_id, nodes, edges)
  values (uid, 'Catalog read path (sample)', 'catalog',
    '[{"id":"n1","type":"client","x":40,"y":160},
      {"id":"n2","type":"cdn","x":220,"y":60},
      {"id":"n3","type":"lb","x":220,"y":260},
      {"id":"n4","type":"service","x":400,"y":260},
      {"id":"n5","type":"cache","x":580,"y":180},
      {"id":"n6","type":"sql","x":580,"y":340}]'::jsonb,
    '[{"id":"e1","from":"n1","to":"n2","mode":"sync"},
      {"id":"e2","from":"n1","to":"n3","mode":"sync"},
      {"id":"e3","from":"n3","to":"n4","mode":"sync"},
      {"id":"e4","from":"n4","to":"n5","mode":"sync"},
      {"id":"e5","from":"n4","to":"n6","mode":"sync"}]'::jsonb);

  -- Answer history spread over past days: a mix of due and upcoming reviews
  -- and an accuracy trend for the chart.
  insert into answer_events (user_id, tech, correct, source, difficulty, created_at) values
    (uid, 'React', true, 'card', 'mid', now() - interval '6 days'),
    (uid, 'React', true, 'drill', 'mid', now() - interval '3 days'),
    (uid, 'TypeScript', false, 'card', 'mid', now() - interval '5 days'),
    (uid, 'TypeScript', true, 'drill', 'mid', now() - interval '2 days'),
    (uid, 'GraphQL (Relay)', false, 'drill', 'mid', now() - interval '2 days'),
    (uid, 'PostgreSQL', true, 'card', 'easy', now() - interval '4 days'),
    (uid, 'Docker', true, 'card', 'mid', now() - interval '1 day'),
    (uid, 'Node.js', false, 'drill', 'high', now() - interval '1 day'),
    (uid, 'Node.js', true, 'drill', 'high', now() - interval '12 hours');
end;
$$;

revoke all on function seed_demo_data(uuid) from public, anon, authenticated;

create or replace function seed_demo_for_anonymous_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_anonymous then
    perform seed_demo_data(new.id);
  end if;
  return new;
end;
$$;

-- Named to sort after auth_users_create_profile, so the profile row exists first.
create trigger auth_users_seed_demo
  after insert on auth.users
  for each row execute function seed_demo_for_anonymous_user();

-- Public share links are for real accounts only.
create or replace function set_board_sharing(board_id uuid, enable boolean)
returns uuid
language plpgsql
security invoker
as $$
declare
  token uuid;
begin
  if enable and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Sign in to share boards' using errcode = '42501';
  end if;

  update arch_boards
  set share_token = case when enable then coalesce(share_token, gen_random_uuid()) end
  where id = board_id
  returning share_token into token;
  return token;
end;
$$;
