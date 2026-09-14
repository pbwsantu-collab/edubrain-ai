-- EDUBRAIN AI — Phase 1 Core Schema
-- Auth profiles, subjects, conversations, messages, mastery
-- Enable extensions

create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin', 'developer')),
  preferred_language text not null default 'en',
  ui_language text not null default 'en',
  voice_settings jsonb,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Student profiles
create table if not exists public.student_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  grade_or_level text,
  goals text[],
  learning_preferences jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subjects
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Conversations
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text,
  mode text not null default 'teaching',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Mastery (basic concept tracking)
create table if not exists public.mastery (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  concept_key text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  score numeric(4,3) not null default 0 check (score >= 0 and score <= 1),
  confidence numeric(4,3) not null default 0 check (confidence >= 0 and confidence <= 1),
  evidence_count integer not null default 0,
  last_assessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, concept_key)
);

-- Indexes
create index if not exists idx_conversations_user on public.conversations(user_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_mastery_user on public.mastery(user_id);
create index if not exists idx_subjects_slug on public.subjects(slug);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'student'
  );
  insert into public.student_profiles (user_id)
  values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger student_profiles_updated_at before update on public.student_profiles
  for each row execute procedure public.set_updated_at();
create trigger conversations_updated_at before update on public.conversations
  for each row execute procedure public.set_updated_at();
create trigger mastery_updated_at before update on public.mastery
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.mastery enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Student profiles
create policy "Users can view own student profile"
  on public.student_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own student profile"
  on public.student_profiles for update
  using (auth.uid() = user_id);

-- Subjects are readable by authenticated users
create policy "Authenticated users can read subjects"
  on public.subjects for select
  to authenticated
  using (is_active = true);

-- Conversations
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

-- Messages (via conversation ownership)
create policy "Users can view messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in own conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- Mastery
create policy "Users can view own mastery"
  on public.mastery for select
  using (auth.uid() = user_id);

create policy "Users can insert own mastery"
  on public.mastery for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mastery"
  on public.mastery for update
  using (auth.uid() = user_id);

-- Seed subjects
insert into public.subjects (name, slug, description, icon) values
  ('Mathematics', 'mathematics', 'Numbers, algebra, geometry, and more', '🔢'),
  ('Physics', 'physics', 'Motion, energy, forces, and the universe', '⚛️'),
  ('Chemistry', 'chemistry', 'Matter, reactions, and the periodic table', '🧪'),
  ('Biology', 'biology', 'Life, cells, ecosystems, and the human body', '🧬'),
  ('English', 'english', 'Grammar, writing, and literature', '📘'),
  ('Bengali', 'bengali', 'বাংলা ভাষা ও সাহিত্য', '🇩🇧'),
  ('Computer Science', 'computer-science', 'Programming, algorithms, and systems', '💻'),
  ('History', 'history', 'Past events and civilizations', '📜'),
  ('Geography', 'geography', 'Earth, maps, and environments', '🌍'),
  ('Economics', 'economics', 'Markets, resources, and decision-making', '📈')
on conflict (slug) do nothing;
