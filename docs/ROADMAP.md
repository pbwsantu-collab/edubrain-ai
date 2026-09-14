# EDUBRAIN AI — Development Roadmap

## Phase 0 — Architecture ✅
## Phase 1 — Core Platform (complete)
## Phase 2 — Teaching Engine (MVP complete)

## Phase 3 — Knowledge (in progress)
- [x] knowledge_documents + knowledge_chunks (pgvector-ready)
- [x] Note ingestion UI
- [x] Knowledge page in nav
- [x] Keyword RAG retrieval injected into teacher
- [x] Vector search RPC (match_knowledge_chunks)
- [ ] Embedding generation Edge Function
- [ ] Source citations in answers
- [ ] PDF upload + parsing

## Phase 4 — Voice (started)
- [x] Browser STT (Web Speech API)
- [x] Browser TTS (speechSynthesis)
- [x] Mic + speak controls on Teaching page
- [ ] Mixed-language voice prefs
- [ ] Cloud STT/TTS provider abstraction

## Phase 5 — Coding Agent (scaffold)
- [x] Permission model + planCodingTask scaffold
- [x] Coding page UI (plan under SAFE/ASSISTED/AUTONOMOUS)
- [ ] Repository inspection UI
- [ ] Code generation + modification
- [ ] Sandbox execution
- [ ] Build / test loop

## Phase 6 — GitHub
- Connect repos, branches, commits, PRs, permission levels

## Phase 7 — Deployment
- Preview / production deploy with approval + rollback

## Phase 8 — Self-Improvement (started)
- [x] experience_events table + recordExperience helper
- [x] Log practice attempts as experience
- [ ] Evaluation loops
- [ ] Adaptive strategies from past outcomes
