# EDUBRAIN AI — Development Roadmap

## Phase 0 — Architecture ✅
- Complete architecture document
- Folder structure
- Database schema design
- Agent architecture
- Memory architecture
- Provider abstraction
- Permission model
- This roadmap

## Phase 1 — Core Platform (largely complete)
- [x] Monorepo scaffold
- [x] Vite + React + TypeScript + Tailwind
- [x] PWA manifest + service worker
- [x] Supabase client + types
- [x] Auth (email/password) + profile auto-create
- [x] Dashboard shell
- [x] Teaching chat UI + local teacher fallback
- [x] Conversation + message persistence
- [x] Basic mastery table
- [x] Subjects seed
- [x] RLS policies
- [x] AI Edge Function (OpenAI/Anthropic) + client fallback
- [ ] Deploy preview
- [ ] E2E verification with live Supabase project

## Phase 2 — Teaching Engine (started)
- [x] Curriculum hierarchy schema (curricula → units → chapters → topics → concepts)
- [x] Exercises + attempts tables
- [x] Sample Class XI Physics seed
- [x] Curriculum list UI
- [ ] Curriculum detail / topic view
- [ ] Lesson player + exercise UI
- [ ] Mastery tracking UI
- [ ] Adaptive recommendations
- [ ] Spaced revision schedule

## Phase 3 — Knowledge
- PDF / document ingestion
- Chunking + embeddings
- Semantic search (RAG)
- Source tracking

## Phase 4 — Voice
- STT provider
- TTS provider
- Conversational teaching with mic/speaker
- Mixed-language (English + Bengali)

## Phase 5 — Coding Agent
- Repository inspection
- Code generation + modification
- Sandbox execution
- Build / test loop
- Controlled repair cycles

## Phase 6 — GitHub
- Connect repos
- Branches, commits, PRs
- Permission levels

## Phase 7 — Deployment
- Preview deployments
- Production deploy with approval
- Rollback

## Phase 8 — Self-Improvement
- Experience memory
- Evaluation loops
- Adaptive strategies from past outcomes
