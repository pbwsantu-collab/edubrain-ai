-- EDUBRAIN AI — Phase 2b: spaced revision + mastery helpers

create table if not exists public.revision_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  concept_id uuid references public.concepts(id) on delete cascade,
  concept_key text not null,
  ease_factor numeric(4,2) not null default 2.50,
  interval_days integer not null default 1,
  repetitions integer not null default 0,
  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, concept_key)
);

create index if not exists idx_revision_user_next
  on public.revision_items(user_id, next_review_at);

create trigger revision_items_updated_at before update on public.revision_items
  for each row execute procedure public.set_updated_at();

alter table public.revision_items enable row level security;

create policy "Users view own revision"
  on public.revision_items for select using (auth.uid() = user_id);
create policy "Users insert own revision"
  on public.revision_items for insert with check (auth.uid() = user_id);
create policy "Users update own revision"
  on public.revision_items for update using (auth.uid() = user_id);
create policy "Users delete own revision"
  on public.revision_items for delete using (auth.uid() = user_id);

-- Seed additional curricula: Math + Chemistry demos
do $$
declare
  math_id uuid;
  chem_id uuid;
  curr_id uuid;
  unit_id uuid;
  chap_id uuid;
  topic_id uuid;
  concept_id uuid;
begin
  select id into math_id from public.subjects where slug = 'mathematics' limit 1;
  select id into chem_id from public.subjects where slug = 'chemistry' limit 1;

  if math_id is not null then
    insert into public.curricula (subject_id, name, slug, description, grade_or_level, board_or_standard)
    values (math_id, 'Grade 6 Fractions', 'grade-6-fractions', 'Core fraction concepts for middle school', 'Grade 6', 'General')
    on conflict (subject_id, slug) do update set name = excluded.name
    returning id into curr_id;

    insert into public.units (curriculum_id, name, slug, description, sort_order)
    values (curr_id, 'Understanding Fractions', 'understanding-fractions', 'Parts of a whole', 1)
    on conflict (curriculum_id, slug) do update set name = excluded.name
    returning id into unit_id;

    insert into public.chapters (unit_id, name, slug, description, sort_order)
    values (unit_id, 'Basics', 'basics', 'Numerator, denominator, and simple comparison', 1)
    on conflict (unit_id, slug) do update set name = excluded.name
    returning id into chap_id;

    insert into public.topics (chapter_id, name, slug, description, sort_order, estimated_minutes)
    values (chap_id, 'What is a Fraction?', 'what-is-a-fraction', 'Definition and representation', 1, 15)
    on conflict (chapter_id, slug) do update set name = excluded.name
    returning id into topic_id;

    insert into public.concepts (topic_id, name, slug, definition, explanation, difficulty, sort_order, concept_key)
    values (
      topic_id,
      'Numerator and Denominator',
      'numerator-denominator',
      'In a fraction a/b, a is the numerator (parts taken) and b is the denominator (equal parts in the whole).',
      'If a pizza is cut into 8 equal slices and you take 3, the fraction is 3/8. The numerator 3 counts selected parts; the denominator 8 is the total equal parts.',
      'beginner',
      1,
      'math.fractions.numerator_denominator'
    )
    on conflict (topic_id, slug) do update set definition = excluded.definition
    returning id into concept_id;

    insert into public.concept_examples (concept_id, title, content, sort_order)
    values
      (concept_id, 'Chocolate bar', 'A bar divided into 4 equal pieces; you eat 1 → fraction 1/4.', 1),
      (concept_id, 'Class attendance', '12 students present out of 30 → 12/30 of the class is present.', 2);

    insert into public.exercises (concept_id, topic_id, exercise_type, prompt, options, correct_answer, explanation, difficulty)
    values (
      concept_id,
      topic_id,
      'mcq',
      'In the fraction 5/9, which number is the denominator?',
      '["5", "9", "14", "45"]'::jsonb,
      '"9"'::jsonb,
      'The denominator is the bottom number — the total equal parts.',
      'beginner'
    );
  end if;

  if chem_id is not null then
    insert into public.curricula (subject_id, name, slug, description, grade_or_level, board_or_standard)
    values (chem_id, 'Intro Chemistry: Atoms', 'intro-atoms', 'Atomic structure for beginners', 'Class IX–X', 'General')
    on conflict (subject_id, slug) do update set name = excluded.name
    returning id into curr_id;

    insert into public.units (curriculum_id, name, slug, description, sort_order)
    values (curr_id, 'Atomic Structure', 'atomic-structure', 'Particles inside the atom', 1)
    on conflict (curriculum_id, slug) do update set name = excluded.name
    returning id into unit_id;

    insert into public.chapters (unit_id, name, slug, description, sort_order)
    values (unit_id, 'Subatomic Particles', 'subatomic-particles', 'Protons, neutrons, electrons', 1)
    on conflict (unit_id, slug) do update set name = excluded.name
    returning id into chap_id;

    insert into public.topics (chapter_id, name, slug, description, sort_order, estimated_minutes)
    values (chap_id, 'Protons and Electrons', 'protons-electrons', 'Charge and location', 1, 20)
    on conflict (chapter_id, slug) do update set name = excluded.name
    returning id into topic_id;

    insert into public.concepts (topic_id, name, slug, definition, explanation, difficulty, sort_order, concept_key)
    values (
      topic_id,
      'Proton',
      'proton',
      'A positively charged particle found in the nucleus of an atom.',
      'Protons determine the atomic number. Hydrogen has 1 proton; carbon has 6. Electrons orbit outside the nucleus and carry negative charge.',
      'beginner',
      1,
      'chem.atoms.proton'
    )
    on conflict (topic_id, slug) do update set definition = excluded.definition
    returning id into concept_id;

    insert into public.concept_examples (concept_id, title, content, sort_order)
    values
      (concept_id, 'Hydrogen', 'The simplest atom: 1 proton in the nucleus and 1 electron outside.', 1);

    insert into public.exercises (concept_id, topic_id, exercise_type, prompt, options, correct_answer, explanation, difficulty)
    values (
      concept_id,
      topic_id,
      'mcq',
      'What is the charge of a proton?',
      '["Negative", "Positive", "Neutral", "It depends"]'::jsonb,
      '"Positive"'::jsonb,
      'Protons are positively charged; electrons are negative; neutrons are neutral.',
      'beginner'
    );
  end if;
end $$;
