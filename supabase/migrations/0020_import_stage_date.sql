-- Ledger import: let an imported contact's first status event carry the date its
-- current stage was reached, so old applications do not all land on import day.

-- Written only by import; null for every existing and hand-added contact.
alter table contacts add column if not exists stage_reached_on date;

create or replace function record_contact_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into status_events (user_id, contact_id, status, created_at)
    values (
      new.user_id, new.id, new.status,
      -- Noon UTC keeps the event on the same calendar day from UTC-11 to UTC+11.
      coalesce((new.stage_reached_on + time '12:00') at time zone 'UTC', now())
    );
  elsif new.status is distinct from old.status then
    insert into status_events (user_id, contact_id, status)
    values (new.user_id, new.id, new.status);
  end if;
  return new;
end;
$$;
