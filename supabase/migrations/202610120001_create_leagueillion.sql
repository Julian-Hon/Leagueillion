-- Leagueillion's first content model. Run this migration after creating a Supabase project.
create extension if not exists pgcrypto;

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  slug text not null unique,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.question_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  canonical_answer text not null,
  obscurity_tier text not null,
  resonance_points integer not null check (resonance_points between 0 and 100),
  scoring_rationale text,
  unique (question_id, canonical_answer)
);

create table public.answer_aliases (
  id uuid primary key default gen_random_uuid(),
  question_answer_id uuid not null references public.question_answers(id) on delete cascade,
  normalized_alias text not null,
  unique (question_answer_id, normalized_alias)
);

create index answer_aliases_normalized_alias_idx on public.answer_aliases(normalized_alias);

-- A future Edge Function can write here when a player submits an answer.
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  question_answer_id uuid references public.question_answers(id) on delete set null,
  raw_answer text not null,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now()
);
