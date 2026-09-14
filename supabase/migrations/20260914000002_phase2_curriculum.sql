-- EDUBRAIN AI — Phase 2 Curriculum Schema
-- Flexible hierarchy: subject → curriculum → unit → chapter → topic → concept

create table if not exists public.curricula (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  grade_or_level text,
  board_or_standard text,
  language text not null default 'en',
  is_active boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, slug)
);

create table if not exists public.units (
  id uuid primary key default uuid_generate_v4(),
  curriculum_id uuid not null references public.curricula(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (curriculum_id, slug)
);

create table if not exists public.chapters (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid not null references public.units(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (unit_id, slug)
);

create table if not exists public.topics (
  id uuid primary key default uuid_generate_v4(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  estimated_minutes integer,
  created_at timestamptz not null default now(),
  unique (chapter_id, slug)
);

create table if not exists public.concepts (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  name text not null,
  slug text not null,
  definition text,
  explanation text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  sort_order integer not null default 0,
  concept_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, slug)
);

create table if not exists public.concept_examples (
  id uuid primary key default uuid_generate_v4(),
  concept_id uuid not null references public.concepts(id) on delete cascade,
  title text,
  content text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default uuid_generate_v4(),
  concept_id uuid references public.concepts(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  exercise_type text not null check (exercise_type in (
    'mcq', 'multi_select', 'true_false', 'fill_blank',
    'short_answer', 'long_answer', 'numerical', 'coding', 'oral'
  )),
  prompt text not null,
  options jsonb,
  correct_answer jsonb,
  explanation text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  points numeric(6,2) not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  answer jsonb,
  is_correct boolean,
  score numeric(6,2),
  feedback text,
  time_spent_seconds integer,
  created_at timestamptz not null default now()
);

alter table public.mastery
  add column if not exists concept_id uuid references public.concepts(id) on delete set null;

create index if not exists idx_curricula_subject on public.curricula(subject_id);
create index if not exists idx_units_curriculum on public.units(curriculum_id);
create index if not exists idx_chapters_unit on public.chapters(unit_id);
create index if not exists idx_topics_chapter on public.topics(chapter_id);
create index if not exists idx_concepts_topic on public.concepts(topic_id);
create index if not exists idx_exercises_concept on public.exercises(concept_id);
create index if not exists idx_attempts_user on public.attempts(user_id);
create index if not exists idx_mastery_concept_id on public.mastery(concept_id);

create trigger curricula_updated_at before update on public.curricula
  for each row execute procedure public.set_updated_at();
create trigger concepts_updated_at before update on public.concepts
  for each row execute procedure public.set_updated_at();

alter table public.curricula enable row level security;
alter table public.units enable row level security;
alter table public.chapters enable row level security;
alter table public.topics enable row level security;
alter table public.concepts enable row level security;
alter table public.concept_examples enable row level security;
alter table public.exercises enable row level security;
alter table public.attempts enable row level security;

create policy "Authenticated read curricula"
  on public.curricula for select to authenticated using (is_active = true);
create policy "Authenticated read units"
  on public.units for select to authenticated using (true);
create policy "Authenticated read chapters"
  on public.chapters for select to authenticated using (true);
create policy "Authenticated read topics"
  on public.topics for select to authenticated using (true);
create policy "Authenticated read concepts"
  on public.concepts for select to authenticated using (true);
create policy "Authenticated read examples"
  on public.concept_examples for select to authenticated using (true);
create policy "Authenticated read exercises"
  on public.exercises for select to authenticated using (true);

create policy "Users view own attempts"
  on public.attempts for select using (auth.uid() = user_id);
create policy "Users insert own attempts"
  on public.attempts for insert with check (auth.uid() = user_id);

-- Seed sample curriculum: Class XI Physics (demo)
do $$
declare
  subj_id uuid;
  curr_id uuid;
  unit_id uuid;
  chap_id uuid;
  topic_id uuid;
  concept_id uuid;
begin
  select id into subj_id from public.subjects where slug = 'physics' limit 1;
  if subj_id is null then
    return;
  end if;

  insert into public.curricula (subject_id, name, slug, description, grade_or_level, board_or_standard)
  values (subj_id, 'Class XI Physics', 'class-xi-physics', 'Introductory senior secondary physics', 'Class XI', 'CBSE-style demo')
  on conflict (subject_id, slug) do update set name = excluded.name
  returning id into curr_id;

  insert into public.units (curriculum_id, name, slug, description, sort_order)
  values (curr_id, 'Mechanics', 'mechanics', 'Motion, forces, and energy', 1)
  on conflict (curriculum_id, slug) do update set name = excluded.name
  returning id into unit_id;

  insert into public.chapters (unit_id, name, slug, description, sort_order)
  values (unit_id, 'Laws of Motion', 'laws-of-motion', 'Newton''s laws and applications', 1)
  on conflict (unit_id, slug) do update set name = excluded.name
  returning id into chap_id;

  insert into public.topics (chapter_id, name, slug, description, sort_order, estimated_minutes)
  values (chap_id, 'Newton''s First Law', 'newtons-first-law', 'Inertia and equilibrium', 1, 20)
  on conflict (chapter_id, slug) do update set name = excluded.name
  returning id into topic_id;

  insert into public.concepts (topic_id, name, slug, definition, explanation, difficulty, sort_order, concept_key)
  values (
    topic_id,
    'Inertia',
    'inertia',
    'The tendency of an object to resist changes in its state of motion.',
    'An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by a net external force.',
    'beginner',
    1,
    'physics.newtons_first.inertia'
  )
  on conflict (topic_id, slug) do update set definition = excluded.definition
  returning id into concept_id;

  insert into public.concept_examples (concept_id, title, content, sort_order)
  values
    (concept_id, 'Bus sudden stop', 'Passengers lurch forward when a bus stops suddenly because their bodies tend to keep moving.', 1),
    (concept_id, 'Tablecloth trick', 'If you pull a tablecloth quickly, dishes may stay in place due to inertia.', 2);

  insert into public.exercises (concept_id, topic_id, exercise_type, prompt, options, correct_answer, explanation, difficulty)
  values (
    concept_id,
    topic_id,
    'mcq',
    'Newton''s First Law is also known as the law of:',
    '["Gravity", "Inertia", "Acceleration", "Action-reaction"]'::jsonb,
    '"Inertia"'::jsonb,
    'Newton''s First Law describes inertia — resistance to change in motion.',
    'beginner'
  );
end $$;
