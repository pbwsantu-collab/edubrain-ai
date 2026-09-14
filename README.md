# EDUBRAIN AI

**Learn. Remember. Teach. Build. Improve.**

Universal AI Teacher + Self-Improving AI Developer platform.

## Status

| Phase | Status |
|-------|--------|
| **0 Architecture** | Complete |
| **1 Core platform** | Complete |
| **2 Teaching engine** | MVP complete |
| **3 Knowledge** | RAG keyword + vector RPC; note ingestion |
| **4 Voice** | Browser mic + TTS on Teach |
| **5 Coding** | Plan UI (SAFE/ASSISTED/AUTONOMOUS) |
| **8 Experience** | experience_events + attempt logging |
| 6–7 GitHub / Deploy execution | Planned |

See [`docs/ROADMAP.md`](docs/ROADMAP.md) and [`docs/SETUP.md`](docs/SETUP.md).

## What works today

- Email auth + profiles (Supabase)
- Teaching chat (Edge Function AI + local fallback)
- Curriculum (Physics / Math / Chemistry demos)
- Concept pages + MCQ + mastery + spaced revision
- Dashboard recommendations
- Knowledge notes + keyword RAG into teacher
- Browser voice (mic + speak)
- Coding agent plan UI with permission modes
- Experience event logging on practice attempts
- PWA shell + Vercel config

## Quick start

```bash
git clone https://github.com/pbwsantu-collab/edubrain-ai.git
cd edubrain-ai && npm install
# Run all SQL migrations in Supabase SQL editor (docs/SETUP.md)
cp apps/web/.env.example apps/web/.env.local
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
cd apps/web && npm run dev
```

## Repo

https://github.com/pbwsantu-collab/edubrain-ai
