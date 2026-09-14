-- EDUBRAIN AI — Phase 3 Knowledge (documents + chunks for RAG)

create extension if not exists vector;

create table if not exists public.knowledge_documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  source_type text not null check (source_type in (
    'pdf', 'text', 'markdown', 'web', 'note', 'curriculum'
  )),
  source_url text,
  storage_path text,
  mime_type text,
  status text not null default 'pending' check (status in (
    'pending', 'processing', 'ready', 'failed'
  )),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists idx_knowledge_docs_user on public.knowledge_documents(user_id);
create index if not exists idx_knowledge_chunks_doc on public.knowledge_chunks(document_id);

create trigger knowledge_documents_updated_at before update on public.knowledge_documents
  for each row execute procedure public.set_updated_at();

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

create policy "Users view own knowledge docs"
  on public.knowledge_documents for select
  using (auth.uid() = user_id or (is_public = true and status = 'ready'));

create policy "Users insert own knowledge docs"
  on public.knowledge_documents for insert
  with check (auth.uid() = user_id);

create policy "Users update own knowledge docs"
  on public.knowledge_documents for update
  using (auth.uid() = user_id);

create policy "Users delete own knowledge docs"
  on public.knowledge_documents for delete
  using (auth.uid() = user_id);

create policy "Users view chunks of accessible docs"
  on public.knowledge_chunks for select
  using (
    exists (
      select 1 from public.knowledge_documents d
      where d.id = document_id
        and (d.user_id = auth.uid() or (d.is_public = true and d.status = 'ready'))
    )
  );

create policy "Users insert chunks for own docs"
  on public.knowledge_chunks for insert
  with check (
    exists (
      select 1 from public.knowledge_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );
