-- Optional link from a STAR story to the Arch Board scenario of the system behind it.
-- Text, like arch_boards.scenario_id: a built-in scenario key (no row to reference)
-- or a custom_scenarios uuid, so no foreign key.

alter table stories add column scenario_id text;
