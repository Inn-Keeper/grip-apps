-- Existing demo visitors still have the pre-0031/0032 seed: tag their seeded
-- stories as samples and clear the seeded role if they haven't finished setup.

update public.stories s
set is_sample = true
from auth.users u
where s.user_id = u.id
  and u.is_anonymous
  and not s.is_sample
  and s.title in ('Untangled a flaky release pipeline', 'Disagreed on a data model, then aligned');

update public.profiles p
set target_role = null
from auth.users u
where p.user_id = u.id
  and u.is_anonymous
  and not p.onboarding_completed
  and p.target_role = 'Senior Frontend Engineer';
