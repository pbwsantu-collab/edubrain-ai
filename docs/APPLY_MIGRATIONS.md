# Apply migrations — project `qpihivtitywtoxjedyrk`

## SQL Editor

https://supabase.com/dashboard/project/qpihivtitywtoxjedyrk/sql/new

## Fast path (2 pastes)

1. [ALL_MIGRATIONS_PART1.sql](https://github.com/pbwsantu-collab/edubrain-ai/blob/main/supabase/ALL_MIGRATIONS_PART1.sql) → Raw → copy → Run
2. [ALL_MIGRATIONS_PART2.sql](https://github.com/pbwsantu-collab/edubrain-ai/blob/main/supabase/ALL_MIGRATIONS_PART2.sql) → Raw → copy → Run

## Or six individual files (order matters)

1. `20260914000001_phase1_core.sql`
2. `20260914000002_phase2_curriculum.sql`
3. `20260914000003_phase2_mastery_revision.sql`
4. `20260914000004_phase3_knowledge.sql`
5. `20260914000005_phase3_vector_and_experience.sql`
6. `20260914000006_english_curriculum.sql`

## Frontend

```env
VITE_SUPABASE_URL=https://qpihivtitywtoxjedyrk.supabase.co
VITE_SUPABASE_ANON_KEY=<Project Settings → API → anon public>
```

```bash
cd apps/web && npm install && npm run dev
```

## Optional AI

```bash
supabase link --project-ref qpihivtitywtoxjedyrk
supabase functions deploy ai-chat
supabase functions deploy embed-text
supabase secrets set OPENAI_API_KEY=sk-...
```
