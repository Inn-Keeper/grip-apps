-- Release check for migration 0030. Run against a disposable local Supabase DB:
--   psql "$PROFILE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/check-profile-preparation.sql
-- Everything runs inside one transaction that is rolled back.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');

create or replace function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

-- User A saves and publishes.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select save_preparation('SRE', array['go'], array['k8s'], '{}', 'technical', 'brief');
select publish_preparation_playbook('g1', null, '{"version":1}', 'A playbook',
  '{"scenario":{"name":"S","brief":"","checks":[]},"board":{"title":"S","nodes":[]},"stories":[{"title":"T","competency":"c","technical":true}]}');

-- Same generation again: same manifest, no duplicate artifacts.
select publish_preparation_playbook('g1', null, '{"version":1}', 'A playbook',
  '{"scenario":{"name":"S","brief":"","checks":[]},"stories":[{"title":"T","competency":"c","technical":true}]}');
do $$ begin
  assert (select count(*) from custom_scenarios where playbook = 'A playbook') = 1, 'repeat publish duplicated a scenario';
  assert (select count(*) from stories where playbook = 'A playbook') = 1, 'repeat publish duplicated a story';
end $$;

-- A replacement that expected a different active version is rejected.
do $$ begin
  perform publish_preparation_playbook('g2', 'stale', '{"version":1}', 'B', '{"scenario":{"name":"S2","checks":[]},"stories":[]}');
  raise exception 'conflict not detected';
exception when others then
  assert sqlerrm like '%playbook_conflict%', sqlerrm;
end $$;

-- A failed artifact insert (null competency) rolls back and keeps the old manifest.
do $$ begin
  perform publish_preparation_playbook('g3', 'g1', '{"version":1}', 'C', '{"scenario":{"name":"S3","checks":[]},"stories":[{"title":"T"}]}');
  raise exception 'bad story accepted';
exception when not_null_violation then null;
end $$;
do $$ begin
  assert (select active_playbook ->> 'generationId' from user_preparation) = 'g1', 'old manifest lost';
  assert not exists (select 1 from custom_scenarios where name = 'S3'), 'partial publish left a scenario';
end $$;

-- User B sees nothing of A's.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
do $$ begin
  assert (select count(*) from user_preparation) = 0, 'RLS leaked preparation';
end $$;

-- Score reset leaves preparation; reset goals removes it.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select reset_goals();
do $$ begin
  assert (select count(*) from user_preparation) = 0, 'reset goals kept preparation';
end $$;

rollback;
