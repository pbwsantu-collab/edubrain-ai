# EDUBRAIN AI

**Learn. Remember. Teach. Build. Improve.**

Universal AI Teacher + Self-Improving AI Developer platform.

> A production-grade, long-term AI education and software-development system that teaches any subject, remembers students, speaks and listens, adapts to performance, learns programming technologies, writes/tests/fixes code, and improves through controlled experience — while keeping the underlying foundation model stable.

## Status

**Phase 1 largely complete** — Auth, dashboard, teaching chat, Supabase schema, AI Edge Function + local fallback, PWA shell. See [docs/SETUP.md](docs/SETUP.md).

## Architecture Overview

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design.

### Core Components

- **Orchestrator** — central decision engine
- **Specialized Agents** — Teacher, Research, Memory, Coding, Evaluation
- **Memory** — Structured (Postgres) + Semantic (pgvector)
- **Provider Abstraction** — AI / STT / TTS / Embeddings (multi-provider)
- **Permission System** — SAFE / ASSISTED / AUTONOMOUS modes
- **Supabase** — Auth, Postgres, RLS, Storage, Edge Functions

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React 19 + TypeScript + Vite + Tailwind |
| PWA          | Vite PWA plugin + Service Worker    |
| Backend/Data | Supabase (Auth, Postgres, pgvector) |
| State        | Zustand + TanStack Query            |
| AI           | Provider abstraction + Edge Function |
| Speech       | STT / TTS provider abstraction      |

## Getting Started

See **[docs/SETUP.md](docs/SETUP.md)** for full instructions.

```bash
git clone https://github.com/pbwsantu-collab/edubrain-ai.git
cd edubrain-ai
npm install
cp apps/web/.env.example apps/web/.env.local
# Add Supabase URL + anon key, run migration SQL
cd apps/web && npm run dev
```

## License

Proprietary — All rights reserved (for now).
