# EDUBRAIN AI

**Learn. Remember. Teach. Build. Improve.**

Universal AI Teacher + Self-Improving AI Developer platform.

> A production-grade, long-term AI education and software-development system that teaches any subject, remembers students, speaks and listens, adapts to performance, learns programming technologies, writes/tests/fixes code, and improves through controlled experience — while keeping the underlying foundation model stable.

## Status

| Phase | Status |
|-------|--------|
| **0 Architecture** | Complete |
| **1 Core platform** | Complete (auth, dashboard, teaching chat, AI proxy, PWA) |
| **2 Teaching engine** | MVP complete (curriculum, MCQ, mastery, spaced revision) |
| **3 Knowledge** | Started (docs schema, note ingestion UI) |
| 4–8 Voice, Coding, GitHub, Deploy, Self-improve | Planned |

See [`docs/ROADMAP.md`](docs/ROADMAP.md) and [`docs/SETUP.md`](docs/SETUP.md).

## What works today

- Email auth + profiles (Supabase)
- Teaching chat with Edge Function AI + local fallback
- Curriculum tree: Physics / Math / Chemistry demo content
- Concept pages with definition, examples, MCQ practice
- Mastery scores + SM-2 style spaced revision
- Dashboard recommendations (weak + due)
- Knowledge notes (text → chunks; embeddings next)
- PWA shell + Vercel config

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

- **Orchestrator** + specialized agents
- **Memory** — Postgres + pgvector
- **Provider abstraction** — AI / STT / TTS / embeddings
- **Permissions** — SAFE / ASSISTED / AUTONOMOUS

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite + Tailwind |
| PWA | Vite PWA plugin |
| Backend | Supabase (Auth, Postgres, pgvector, Edge Functions) |
| State | Zustand |

## Quick start

```bash
git clone https://github.com/pbwsantu-collab/edubrain-ai.git
cd edubrain-ai && npm install
# Run SQL migrations in Supabase SQL editor (see docs/SETUP.md)
cp apps/web/.env.example apps/web/.env.local
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
cd apps/web && npm run dev
```

## Repo

https://github.com/pbwsantu-collab/edubrain-ai
