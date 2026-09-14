-- ========== 20260914000004_phase3_knowledge.sql ==========

-- EDUBRAIN AI — Phase 3 Knowledge (documents + chunks)

create table if not exists public.knowledge_documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  source_type text not null default 'note',
  source_url text,
  status text not null default 'ready',
  is_public boolean not null default false,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_index integer not null default 0,
  content text not null,
  token_count integer,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists idx_knowledge_docs_user on public.knowledge_documents(user_id);
create index if not exists idx_knowledge_chunks_doc on public.knowledge_chunks(document_id);

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

create policy "Users manage own knowledge docs"
  on public.knowledge_documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users read public knowledge docs"
  on public.knowledge_documents for select
  using (is_public = true or auth.uid() = user_id);

create policy "Users manage chunks of own docs"
  on public.knowledge_chunks for all
  using (
    exists (
      select 1 from public.knowledge_documents d
      where d.id = knowledge_chunks.document_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.knowledge_documents d
      where d.id = knowledge_chunks.document_id and d.user_id = auth.uid()
    )
  );

create policy "Users read chunks of public docs"
  on public.knowledge_chunks for select
  using (
    exists (
      select 1 from public.knowledge_documents d
      where d.id = knowledge_chunks.document_id and (d.is_public = true or d.user_id = auth.uid())
    )
  );

-- ========== 20260914000005_phase3_vector_and_experience.sql ==========

create extension if not exists vector;

create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  filter_user_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    c.document_id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks c
  inner join public.knowledge_documents d on d.id = c.document_id
  where c.embedding is not null
    and d.status = 'ready'
    and (
      filter_user_id is null
      or d.user_id = filter_user_id
      or d.is_public = true
    )
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;

grant execute on function public.match_knowledge_chunks(vector, int, uuid) to authenticated;
grant execute on function public.match_knowledge_chunks(vector, int, uuid) to service_role;

create table if not exists public.experience_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  agent text not null,
  event_type text not null,
  summary text not null,
  success boolean,
  score numeric(6,3),
  context jsonb not null default '{}'::jsonb,
  lessons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_experience_user on public.experience_events(user_id, created_at desc);
create index if not exists idx_experience_agent on public.experience_events(agent, event_type);

alter table public.experience_events enable row level security;

create policy "Users view own experience"
  on public.experience_events for select
  using (auth.uid() = user_id);

create policy "Users insert own experience"
  on public.experience_events for insert
  with check (auth.uid() = user_id);

-- ========== 20260914000006_english_curriculum.sql ==========

do $$
declare
  subj_id uuid;
  curr_id uuid;
  unit_id uuid;
  chap_id uuid;
  topic_id uuid;
  concept_id uuid;
begin
  select id into subj_id from public.subjects where slug = 'english' limit 1;
  if subj_id is null then
    insert into public.subjects (name, slug, description, icon, is_active)
    values ('English', 'english', 'Language and grammar', '📚', true)
    on conflict (slug) do update set name = excluded.name
    returning id into subj_id;
    if subj_id is null then
      select id into subj_id from public.subjects where slug = 'english' limit 1;
    end if;
  end if;
  if subj_id is null then return; end if;

  insert into public.curricula (subject_id, name, slug, description, grade_or_level, board_or_standard)
  values (subj_id, 'English Grammar Basics', 'english-grammar-basics', 'Core tenses for learners', 'General', 'General')
  on conflict (subject_id, slug) do update set name = excluded.name
  returning id into curr_id;

  insert into public.units (curriculum_id, name, slug, description, sort_order)
  values (curr_id, 'Verb Tenses', 'verb-tenses', 'Present and past forms', 1)
  on conflict (curriculum_id, slug) do update set name = excluded.name
  returning id into unit_id;

  insert into public.chapters (unit_id, name, slug, description, sort_order)
  values (unit_id, 'Present Perfect', 'present-perfect', 'Have/has + past participle', 1)
  on conflict (unit_id, slug) do update set name = excluded.name
  returning id into chap_id;

  insert into public.topics (chapter_id, name, slug, description, sort_order, estimated_minutes)
  values (chap_id, 'Form and Use', 'form-and-use', 'Structure and common uses', 1, 20)
  on conflict (chapter_id, slug) do update set name = excluded.name
  returning id into topic_id;

  insert into public.concepts (topic_id, name, slug, definition, explanation, difficulty, sort_order, concept_key)
  values (
    topic_id,
    'Present Perfect Form',
    'present-perfect-form',
    'have/has + past participle (e.g. I have finished).',
    'Use present perfect for past actions with a link to the present: experience, unfinished time, or result now.',
    'beginner',
    1,
    'english.present_perfect.form'
  )
  on conflict (topic_id, slug) do update set definition = excluded.definition
  returning id into concept_id;

  insert into public.concept_examples (concept_id, title, content, sort_order)
  values
    (concept_id, 'Experience', 'I have visited Paris. (at some time in my life)', 1),
    (concept_id, 'Result now', 'He has lost his keys. (so he cannot open the door now)', 2);

  insert into public.exercises (concept_id, topic_id, exercise_type, prompt, options, correct_answer, explanation, difficulty)
  values (
    concept_id,
    topic_id,
    'mcq',
    'Choose the correct present perfect form:',
    '["I go to school yesterday", "I have gone to school today", "I going to school", "I did went"]'::jsonb,
    '"I have gone to school today"'::jsonb,
    'Present perfect uses have/has + past participle.',
    'beginner'
  );
end $$;
