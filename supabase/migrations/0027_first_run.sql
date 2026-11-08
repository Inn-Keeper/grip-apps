-- First-run wizard: generated stories stay labelled with their playbook, and stay
-- marked as samples until the user saves an edit.
alter table public.stories add column if not exists is_sample boolean not null default false;
alter table public.stories add column if not exists playbook text;

-- One-time reset: Profile saves used to set this flag, so existing users would never
-- see the wizard. Everyone gets it once; finishing or "Explore first" sets it again.
update public.profiles set onboarding_completed = false;
