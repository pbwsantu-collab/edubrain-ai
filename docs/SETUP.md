# EDUBRAIN AI — Setup Guide

## 1. Clone & install

```bash
git clone https://github.com/pbwsantu-collab/edubrain-ai.git
cd edubrain-ai && npm install
```

## 2. Supabase migrations (SQL Editor, in order)

- `20260914000001_phase1_core.sql`
- `20260914000002_phase2_curriculum.sql`
- `20260914000003_phase2_mastery_revision.sql`
- `20260914000004_phase3_knowledge.sql`
- `20260914000005_phase3_vector_and_experience.sql`
- `20260914000006_english_curriculum.sql`

## 3. Frontend env

```bash
cp apps/web/.env.example apps/web/.env.local
```

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Run

```bash
cd apps/web && npm run dev
```

## 5. Edge Functions (optional)

```bash
supabase functions deploy ai-chat
supabase functions deploy embed-text
supabase secrets set OPENAI_API_KEY=sk-...
```

## Deploy

See [`docs/DEPLOY.md`](DEPLOY.md).
