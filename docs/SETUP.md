# EDUBRAIN AI — Setup Guide

## 1. Clone & install

```bash
git clone https://github.com/pbwsantu-collab/edubrain-ai.git
cd edubrain-ai
npm install
```

## 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run migrations in order:

   - `supabase/migrations/20260914000001_phase1_core.sql`
   - `supabase/migrations/20260914000002_phase2_curriculum.sql`
   - `supabase/migrations/20260914000003_phase2_mastery_revision.sql`
   - `supabase/migrations/20260914000004_phase3_knowledge.sql`
   - `supabase/migrations/20260914000005_phase3_vector_and_experience.sql`

3. Confirm tables exist.
4. Copy **Project URL** and **anon public** key from Settings → API.

## 3. Frontend env

```bash
cp apps/web/.env.example apps/web/.env.local
```

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Run the app

```bash
cd apps/web
npm run dev
```

## 5. Optional: real AI (Edge Function)

```bash
supabase functions deploy ai-chat
supabase secrets set OPENAI_API_KEY=sk-...
```

## 6. Deploy frontend (Vercel)

- Import the GitHub repo on Vercel
- Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## 7. Security notes

- API keys only as Supabase secrets — never in `VITE_*`
- RLS on all student data tables
- Coding agent never deploys without confirmation
