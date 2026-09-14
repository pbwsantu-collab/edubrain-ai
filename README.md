# EDUBRAIN AI

**Learn. Remember. Teach. Build. Improve.**

Universal AI Teacher + Self-Improving AI Developer platform.

## Live setup (your Supabase)

| Item | Value |
|------|--------|
| Project | `edubrain-ai` |
| Ref | `qpihivtitywtoxjedyrk` |
| Region | Mumbai (`ap-south-1`) |
| URL | `https://qpihivtitywtoxjedyrk.supabase.co` |

1. Run SQL migrations — see [`docs/APPLY_MIGRATIONS.md`](docs/APPLY_MIGRATIONS.md)
2. Create `apps/web/.env.local` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
3. `cd apps/web && npm install && npm run dev`
4. Optional: deploy `ai-chat` + `embed-text` Edge Functions

## What works today

| Feature | Status |
|---------|--------|
| Auth (email) + profiles | ✅ |
| Dashboard + mastery + experience panel | ✅ |
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
