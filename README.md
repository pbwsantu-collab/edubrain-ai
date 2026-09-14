# EDUBRAIN AI

**Learn. Remember. Teach. Build. Improve.**

Universal AI Teacher + Self-Improving AI Developer platform.

> A production-grade, long-term AI education and software-development system that teaches any subject, remembers students, speaks and listens, adapts to performance, learns programming technologies, writes/tests/fixes code, and improves through controlled experience — while keeping the underlying foundation model stable.

## Status

**Phase 1 in progress** — Core platform scaffold, authentication, dashboard, AI chat, basic memory, Supabase, responsive PWA.

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
| AI           | Provider abstraction layer          |
| Speech       | STT / TTS provider abstraction      |

## Project Structure

```
edubrain-ai/
├── apps/web/                 # Vite + React PWA
├── packages/
│   ├── shared/               # Shared types & schemas
│   ├── agents/               # Agent definitions
│   ├── core/                 # Permission, evaluation, loops
│   └── providers/            # AI / Speech interfaces
├── supabase/                 # Migrations, Edge Functions
├── docs/                     # Architecture & design docs
└── scripts/
```

## Development Phases

1. **Phase 1** (current) — Auth, dashboard, AI chat, basic memory, PWA
2. **Phase 2** — Curriculum, lessons, assessment, adaptive learning
3. **Phase 3** — Document ingestion, knowledge base, RAG
4. **Phase 4** — Voice (STT + TTS), conversational teaching
5. **Phase 5** — Coding agent, sandbox, test loop
6. **Phase 6** — GitHub integration
7. **Phase 7** — Controlled deployment
8. **Phase 8** — Experience-based self-improvement

## Getting Started (Phase 1)

```bash
# Clone
git clone https://github.com/pbwsantu-collab/edubrain-ai.git
cd edubrain-ai

# Install (from root)
npm install

# Set up environment
cp apps/web/.env.example apps/web/.env.local
# Fill in Supabase URL + anon key

# Run web app
cd apps/web
npm run dev
```

## Non-Negotiable Rules

- Never fabricate APIs or claim tests passed without evidence
- Never expose secrets in frontend
- Never destroy files without authorization
- Always inspect existing architecture before major changes
- Prefer simple, reliable architecture
- Security over autonomy

## License

Proprietary — All rights reserved (for now).
