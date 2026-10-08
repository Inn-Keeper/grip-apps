-- record_answer: p_difficulty may be null (cards without a tier). Declaring the
-- default makes the generated client types accept null. Body is unchanged; grants carry over.

create or replace function record_answer(
  p_request_id text,
  p_tech text,
  p_correct boolean,
  p_source text,
  p_difficulty text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  xp_points int;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_request_id is null or btrim(p_request_id) = '' then
    raise exception 'Request id is required' using errcode = '23514';
  end if;

  insert into answer_events (user_id, tech, correct, source, difficulty, request_id)
  values (current_user_id, p_tech, p_correct, p_source, p_difficulty, p_request_id)
  on conflict (user_id, request_id) where request_id is not null do nothing;

  if not found or not p_correct then
    return;
  end if;

  xp_points := case p_difficulty
    when 'easy' then 5
    when 'high' then 20
    when 'ultra' then 40
    else 10
  end;

  insert into profiles (user_id, xp)
  values (current_user_id, xp_points)
  on conflict (user_id) do update set xp = profiles.xp + excluded.xp;
end;
$$;
