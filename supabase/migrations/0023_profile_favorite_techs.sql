-- Add favorite_techs column to profiles table
alter table profiles
  add column if not exists favorite_techs text[] not null default '{}';