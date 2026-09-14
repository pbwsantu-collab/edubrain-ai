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

## Phase 1 — Core Platform (complete)
- [x] Monorepo scaffold
- [x] Vite + React + TypeScript + Tailwind
- [x] PWA manifest + service worker
- [x] Supabase client + types
- [x] Auth + profile
- [x] Dashboard shell
- [x] Teaching chat + AI Edge Function + local fallback
- [x] Conversation persistence
- [x] Mastery table + subjects seed
- [x] RLS policies

## Phase 2 — Teaching Engine (MVP complete)
- [x] Curriculum hierarchy
- [x] Exercises + attempts
- [x] Physics / Math / Chem seeds
- [x] Concept learn + MCQ + mastery
- [x] Adaptive recommendations
- [x] Spaced revision (SM-2)
- [x] Mastery panel on dashboard

## Phase 3 — Knowledge (in progress)
- [x] knowledge_documents + knowledge_chunks (pgvector-ready)
- [x] Note ingestion UI
- [x] Knowledge page in nav
- [x] Keyword RAG retrieval injected into teacher
- [ ] PDF upload + parsing
- [ ] Embedding pipeline (vector search RPC)
- [ ] Source citations in answers

## Phase 4 — Voice (started)
- [x] Browser STT (Web Speech API)
- [x] Browser TTS (speechSynthesis)
- [x] Mic + speak controls on Teaching page
- [ ] Mixed-language voice prefs
- [ ] Cloud STT/TTS provider abstraction

## Phase 5 — Coding Agent (scaffold)
- [x] Permission model + planCodingTask scaffold
- [ ] Repository inspection UI
- [ ] Code generation + modification
- [ ] Sandbox execution
- [ ] Build / test loop

## Phase 6 — GitHub
- Connect repos, branches, commits, PRs, permission levels

## Phase 7 — Deployment
- Preview / production deploy with approval + rollback

## Phase 8 — Self-Improvement
- Experience memory, evaluation loops, adaptive strategies
