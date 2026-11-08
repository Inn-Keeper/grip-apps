-- The first-run wizard's techs (stack plus the target role's), shown in Prep as
-- "From My Goals". Kept apart from favorite_techs, which the user edits in Profile.
alter table public.profiles add column if not exists goal_techs text[] not null default '{}';
