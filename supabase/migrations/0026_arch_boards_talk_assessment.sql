-- The reasoning assessment behind talk_grade: the grader's section verdicts, evidence,
-- follow-up and the fingerprint of the inputs it graded ({ version, inputs, result }).
-- Nullable and additive: older clients keep reading and writing talk_grade alone, and
-- get_shared_board does not return it, so public links never expose private feedback.
alter table public.arch_boards add column if not exists talk_assessment jsonb;
