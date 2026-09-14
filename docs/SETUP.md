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

3. Confirm tables exist (profiles, subjects, curricula, concepts, exercises, revision_items, …).
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

Open http://localhost:5173 — sign up, then try **Teach**, **Curriculum**, and practice MCQs.

Without an AI provider, the local heuristic teacher still responds.

## 5. Optional: real AI (Edge Function)

```bash
supabase functions deploy ai-chat
supabase secrets set OPENAI_API_KEY=sk-...
# or ANTHROPIC_API_KEY
```

## 6. Deploy frontend (Vercel)

- Import the GitHub repo on Vercel
- Root uses `vercel.json` (builds `apps/web`)
- Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## 7. Security notes

- API keys only as Supabase secrets — never in `VITE_*`
- RLS on all student data tables
- Edge Function verifies JWT before calling providers
