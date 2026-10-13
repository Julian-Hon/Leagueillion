begin;

insert into public.questions (prompt, slug, is_active)
values ('Name a champion from Demacia', 'champion-from-demacia', true)
on conflict (slug) do update
set prompt = excluded.prompt,
    is_active = excluded.is_active;

insert into public.question_answers (question_id, canonical_answer, obscurity_tier, resonance_points, scoring_rationale)
select question.id, answer.canonical_answer, answer.obscurity_tier, answer.resonance_points, answer.scoring_rationale
from public.questions as question
cross join (
  values
    ('Garen', 'Familiar', 10, 'Highly recognizable Demacian figure.'),
    ('Lux', 'Familiar', 10, 'Highly recognizable Demacian figure.'),
    ('Jarvan IV', 'Known', 25, 'Prominent but less frequently recalled than Garen or Lux.'),
    ('Sylas', 'Known', 25, 'Widely known, though not usually the first Demacia answer.'),
    ('Fiora', 'Uncommon', 50, 'Direct Demacian association with moderate general recognition.'),
    ('Vayne', 'Uncommon', 50, 'Direct Demacian association with moderate general recognition.'),
    ('Galio', 'Deep Lore', 75, 'A less immediate region association for many players.'),
    ('Sona', 'Deep Lore', 75, 'A less immediate region association for many players.'),
    ('Shyvana', 'Deep Lore', 75, 'A less immediate region association for many players.'),
    ('Quinn', 'Legendary', 100, 'A direct but comparatively less frequently recalled Demacian champion.')
) as answer(canonical_answer, obscurity_tier, resonance_points, scoring_rationale)
where question.slug = 'champion-from-demacia'
on conflict (question_id, canonical_answer) do update
set obscurity_tier = excluded.obscurity_tier,
    resonance_points = excluded.resonance_points,
    scoring_rationale = excluded.scoring_rationale;

insert into public.answer_aliases (question_answer_id, normalized_alias)
select question_answer.id, alias.normalized_alias
from public.question_answers as question_answer
join public.questions as question on question.id = question_answer.question_id
join (
  values
    ('Garen', 'garen'),
    ('Lux', 'lux'),
    ('Lux', 'luxanna'),
    ('Lux', 'luxannacrownguard'),
    ('Jarvan IV', 'jarvan'),
    ('Jarvan IV', 'jarvaniv'),
    ('Jarvan IV', 'jarvan4'),
    ('Sylas', 'sylas'),
    ('Fiora', 'fiora'),
    ('Fiora', 'fioralaurent'),
    ('Vayne', 'vayne'),
    ('Vayne', 'shaunavayne'),
    ('Galio', 'galio'),
    ('Sona', 'sona'),
    ('Sona', 'sonabuvelle'),
    ('Shyvana', 'shyvana'),
    ('Quinn', 'quinn')
) as alias(canonical_answer, normalized_alias)
  on alias.canonical_answer = question_answer.canonical_answer
where question.slug = 'champion-from-demacia'
on conflict (question_answer_id, normalized_alias) do nothing;

commit;
