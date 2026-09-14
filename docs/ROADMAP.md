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

## Phase 2 — Teaching Engine (complete for MVP)
- [x] Curriculum hierarchy schema
- [x] Exercises + attempts tables
- [x] Sample Class XI Physics seed
- [x] Curriculum list + detail UI
- [x] Concept learn page + MCQ + mastery update
- [x] Adaptive recommendations (weak + due)
- [x] Spaced revision (SM-2 style)
- [x] Math + Chem seeds
- [x] Mastery panel on dashboard

## Phase 3 — Knowledge (started)
- [x] knowledge_documents + knowledge_chunks schema (pgvector-ready)
- [x] Note ingestion UI (text notes → chunks)
- [x] Knowledge page in nav
- [ ] PDF upload + parsing
- [ ] Embedding pipeline
- [ ] Semantic search (RAG) in teacher agent
- [ ] Source citations in answers

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
