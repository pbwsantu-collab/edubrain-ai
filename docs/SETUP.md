# EDUBRAIN AI — Setup Guide (Phase 1)

## 1. Clone & install

```bash
git clone https://github.com/pbwsantu-collab/edubrain-ai.git
cd edubrain-ai
npm install
```

## 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the full contents of:

   `supabase/migrations/20260914000001_phase1_core.sql`

3. Confirm tables: `profiles`, `student_profiles`, `subjects`, `conversations`, `messages`, `mastery`.
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

Open http://localhost:5173 — sign up, then open **Teach**.

Without an AI provider, the local heuristic teacher still responds.

## 5. Optional: real AI (Edge Function)

```bash
# Install Supabase CLI, link project, then:
supabase functions deploy ai-chat

# Set one provider secret (never put these in the frontend):
supabase secrets set OPENAI_API_KEY=sk-...
# or
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Optional:
supabase secrets set AI_PROVIDER=openai
supabase secrets set AI_MODEL=gpt-4o-mini
```

The Teaching page calls `ai-chat` first; if the function is missing or unconfigured, it falls back to the local teacher automatically.

## 6. Security notes

- API keys only as Supabase secrets / server env — never in `VITE_*`.
- RLS is enabled on all Phase 1 tables; students only see their own data.
- The Edge Function verifies JWT before calling any provider.
