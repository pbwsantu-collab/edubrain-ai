# EDUBRAIN AI

**Learn. Remember. Teach. Build. Improve.**

Universal AI Teacher + Self-Improving AI Developer platform.

## Supabase (required for sign-in)

The project ref `qpihivtitywtoxjedyrk` (`https://qpihivtitywtoxjedyrk.supabase.co`) **does not resolve**. Sign-in shows a network error until you point the app at a live project.

1. In the [Supabase dashboard](https://supabase.com/dashboard), resume that project or create a new one.
2. Copy **Project URL** and the **anon** key (Project Settings → API).
3. Create `apps/web/.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

4. Run the SQL migrations — see [`docs/APPLY_MIGRATIONS.md`](docs/APPLY_MIGRATIONS.md).
5. `cd apps/web && npm install && npm run dev`
6. Optional: deploy `ai-chat` + `embed-text` Edge Functions.

On Vercel or Netlify, set the same two variables and redeploy. A rebuild is required; the URL is baked in at build time.

## What works today

| Feature | Status |
|---------|--------|
| Auth (email) + profiles | Needs a live Supabase project |
| Dashboard + mastery + experience panel | ✅ once the database is reachable |
| Teaching chat (Edge AI + local fallback) | ✅ |
| Knowledge notes + .txt/.md upload + RAG | ✅ |
| Vector retrieve when embeddings exist | ✅ |
| Curriculum + MCQ + spaced revision | ✅ |
| English Present Perfect seed | ✅ |
| Browser voice (STT/TTS) | ✅ |
| Coding: inspect public GitHub + read file | ✅ |
| Coding: LLM patch **proposal** (not applied) | ✅ |
| SAFE / ASSISTED / AUTONOMOUS permissions | ✅ |
| Auto-commit / auto-deploy | ❌ by design |

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/SETUP.md`](docs/SETUP.md)
- [`docs/DEPLOY.md`](docs/DEPLOY.md)
- [`docs/APPLY_MIGRATIONS.md`](docs/APPLY_MIGRATIONS.md)
- [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Tech stack

React 19 · TypeScript · Vite · Tailwind · Supabase (Auth, Postgres, RLS, pgvector, Edge Functions) · PWA

## Safety principle

Controlled self-improvement via memory, retrieval, evaluation, and experience — **not** silent model retraining or autonomous deploy.
