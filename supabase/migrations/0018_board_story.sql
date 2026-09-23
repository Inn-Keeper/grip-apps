-- Optional link from a saved board to the story it was designed for.
-- Stories are rows, so this one is a real foreign key; deleting a story keeps its boards.

alter table arch_boards
  add column story_id uuid references stories (id) on delete set null;
