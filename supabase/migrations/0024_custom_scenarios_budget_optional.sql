-- Cost and budget left the Arch Board; the app stops writing budget. The column stays for old rows.
alter table public.custom_scenarios alter column budget drop not null;
