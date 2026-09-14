# Apply migrations to your Supabase project

## 1. Open SQL Editor

Dashboard → your project → **SQL** → **New query**

For project ref `qpihivtitywtoxjedyrk`:
https://supabase.com/dashboard/project/qpihivtitywtoxjedyrk/sql/new

## 2. Run SQL (choose one)

**Option A — one file**

Open [`supabase/ALL_MIGRATIONS.sql`](../supabase/ALL_MIGRATIONS.sql) on GitHub → raw → copy all → paste → **Run**.

**Option B — six files in order**

1. `20260914000001_phase1_core.sql`
2. `20260914000002_phase2_curriculum.sql`
3. `20260914000003_phase2_mastery_revision.sql`
4. `20260914000004_phase3_knowledge.sql`
5. `20260914000005_phase3_vector_and_experience.sql`
6. `20260914000006_english_curriculum.sql`

Most statements use `if not exists` / `on conflict`. Safe to re-run if a step partially failed.

## 3. Frontend env

`apps/web/.env.local`:

```env
VITE_SUPABASE_URL=https://qpihivtitywtoxjedyrk.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get the anon key: Project Settings → API.

## 4. Run locally

```bash
cd apps/web && npm install && npm run dev
```

## 5. Optional AI

```bash
supabase link --project-ref qpihivtitywtoxjedyrk
supabase functions deploy ai-chat
supabase functions deploy embed-text
supabase secrets set OPENAI_API_KEY=sk-...
```

## 6. Auth

Authentication → Providers → enable **Email**.
