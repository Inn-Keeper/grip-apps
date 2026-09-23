-- One board per story: a story tells one design, improved in place rather than redrawn.
-- Existing duplicates keep their most recently updated board linked; the rest are unlinked, not deleted.

update arch_boards b
set story_id = null
where b.story_id is not null
  and exists (
    select 1 from arch_boards o
    where o.story_id = b.story_id
      and (o.updated_at, o.id) > (b.updated_at, b.id)
  );

create unique index arch_boards_one_per_story on arch_boards (story_id) where story_id is not null;
