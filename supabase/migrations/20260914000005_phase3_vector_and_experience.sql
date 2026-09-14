-- EDUBRAIN AI — Phase 3b vector search RPC + Phase 8 experience memory foundation

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
