-- Completes the three-stop question pack and exposes read-only quiz data to the browser client.
alter table public.questions add column if not exists sort_order integer not null default 0;

insert into public.questions (prompt, slug, is_active, sort_order)
values
  ('Name a champion from Ionia', 'champion-from-ionia', true, 2),
  ('Name a champion from Noxus', 'champion-from-noxus', true, 3)
on conflict (slug) do update
set prompt = excluded.prompt,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

update public.questions set sort_order = 1 where slug = 'champion-from-demacia';

insert into public.question_answers (question_id, canonical_answer, obscurity_tier, resonance_points, scoring_rationale)
select question.id, answer.canonical_answer, answer.obscurity_tier, answer.points, answer.rationale
from public.questions as question
join (
  values
    ('champion-from-ionia', 'Ahri', 'Familiar', 10, 'A highly recognizable Ionian champion.'),
    ('champion-from-ionia', 'Yasuo', 'Familiar', 10, 'A highly recognizable Ionian champion.'),
    ('champion-from-ionia', 'Irelia', 'Known', 25, 'Strongly associated with Ionia.'),
    ('champion-from-ionia', 'Karma', 'Known', 25, 'Strongly associated with Ionia.'),
    ('champion-from-ionia', 'Shen', 'Uncommon', 50, 'A less immediate Ionian answer.'),
    ('champion-from-ionia', 'Kennen', 'Uncommon', 50, 'A less immediate Ionian answer.'),
    ('champion-from-ionia', 'Rakan', 'Deep Lore', 75, 'An Ionian Vastaya who is less commonly recalled.'),
    ('champion-from-ionia', 'Xayah', 'Deep Lore', 75, 'An Ionian Vastaya who is less commonly recalled.'),
    ('champion-from-ionia', 'Varus', 'Legendary', 100, 'A complex but valid association with Ionia.'),
    ('champion-from-noxus', 'Darius', 'Familiar', 10, 'A highly recognizable Noxian champion.'),
    ('champion-from-noxus', 'Katarina', 'Familiar', 10, 'A highly recognizable Noxian champion.'),
    ('champion-from-noxus', 'Draven', 'Known', 25, 'Strongly associated with Noxus.'),
    ('champion-from-noxus', 'LeBlanc', 'Known', 25, 'Strongly associated with Noxus.'),
    ('champion-from-noxus', 'Riven', 'Uncommon', 50, 'A less immediate Noxian answer.'),
    ('champion-from-noxus', 'Talon', 'Uncommon', 50, 'A less immediate Noxian answer.'),
    ('champion-from-noxus', 'Cassiopeia', 'Deep Lore', 75, 'A less commonly recalled member of a Noxian house.'),
    ('champion-from-noxus', 'Sion', 'Deep Lore', 75, 'A less commonly recalled Noxian champion.'),
    ('champion-from-noxus', 'Kled', 'Legendary', 100, 'A direct but comparatively niche Noxian answer.')
) as answer(slug, canonical_answer, obscurity_tier, points, rationale)
  on answer.slug = question.slug
on conflict (question_id, canonical_answer) do update
set obscurity_tier = excluded.obscurity_tier,
    resonance_points = excluded.resonance_points,
    scoring_rationale = excluded.scoring_rationale;

insert into public.answer_aliases (question_answer_id, normalized_alias)
select question_answer.id, regexp_replace(lower(alias.alias), '[^a-z0-9]', '', 'g')
from public.question_answers as question_answer
join public.questions as question on question.id = question_answer.question_id
join (
  values
    ('champion-from-ionia', 'Ahri', 'ahri'), ('champion-from-ionia', 'Yasuo', 'yasuo'),
    ('champion-from-ionia', 'Irelia', 'irelia'), ('champion-from-ionia', 'Karma', 'karma'),
    ('champion-from-ionia', 'Shen', 'shen'), ('champion-from-ionia', 'Kennen', 'kennen'),
    ('champion-from-ionia', 'Rakan', 'rakan'), ('champion-from-ionia', 'Xayah', 'xayah'),
    ('champion-from-ionia', 'Varus', 'varus'), ('champion-from-noxus', 'Darius', 'darius'),
    ('champion-from-noxus', 'Katarina', 'katarina'), ('champion-from-noxus', 'Draven', 'draven'),
    ('champion-from-noxus', 'LeBlanc', 'leblanc'), ('champion-from-noxus', 'LeBlanc', 'le blanc'),
    ('champion-from-noxus', 'Riven', 'riven'), ('champion-from-noxus', 'Talon', 'talon'),
    ('champion-from-noxus', 'Cassiopeia', 'cassiopeia'), ('champion-from-noxus', 'Sion', 'sion'),
    ('champion-from-noxus', 'Kled', 'kled')
) as alias(slug, canonical_answer, alias)
  on alias.slug = question.slug and alias.canonical_answer = question_answer.canonical_answer
on conflict (question_answer_id, normalized_alias) do nothing;

alter table public.questions enable row level security;
alter table public.question_answers enable row level security;
alter table public.answer_aliases enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Public can read active questions" on public.questions;
create policy "Public can read active questions" on public.questions for select to anon using (is_active = true);

drop policy if exists "Public can read quiz answers" on public.question_answers;
create policy "Public can read quiz answers" on public.question_answers for select to anon using (true);

drop policy if exists "Public can read answer aliases" on public.answer_aliases;
create policy "Public can read answer aliases" on public.answer_aliases for select to anon using (true);

grant select on public.questions, public.question_answers, public.answer_aliases to anon;
