-- A free board has no scenario, so it carries its own brief for the AI grader. Nullable: scenario boards leave it empty.
alter table public.arch_boards add column if not exists brief text;
