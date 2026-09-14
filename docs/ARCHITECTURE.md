# EDUBRAIN AI — Architecture

**Version:** 0.1.0 (Phase 0 / Phase 1 start)  
**Last updated:** 2026-09-14

## Vision

A persistent, adaptive, tool-using AI system that:

- Teaches any academic subject
- Remembers students and learning history
- Speaks and listens
- Adapts to performance
- Learns programming technologies from documentation
- Writes, tests, fixes, and improves code
- Works with GitHub and Supabase
- Improves through controlled experience (not model retraining)

## High-Level Flow

```
USER
 ↓
ORCHESTRATOR
 ↓
MEMORY + KNOWLEDGE
 ↓
SPECIALIZED AGENTS
 ↓
TOOLS
 ↓
OBSERVATION
 ↓
EVALUATION
 ↓
MEMORY UPDATE
```

## Major Components

### 1. Orchestrator
Central brain that determines intent, selects agents/tools, checks permissions, retrieves memory, and decides when an operation is complete.

### 2. Specialized Agents
- **Teacher Agent** — explain, question, adapt, assess, revise
- **Research / Knowledge Agent** — ingest PDFs/docs, extract concepts, source tracking
- **Memory Agent** — structured + semantic memory read/write
- **Coding Agent** — plan → write → test → fix loop
- **Evaluation Agent** — score teaching quality and code quality

### 3. Memory System
- **Structured** (PostgreSQL): profiles, mastery, scores, progress, permissions
- **Semantic** (pgvector): conversations, explanations, documents, experiences
- **Experience Memory**: what worked / failed for future adaptation

### 4. Provider Abstraction
Interfaces so AI, STT, TTS, and Embedding providers can be swapped without rewriting the application.

### 5. Permission System
- SAFE MODE
- ASSISTED MODE
- AUTONOMOUS DEVELOPMENT MODE

Risky actions (file write, commit, deploy, delete) require explicit authorization.

### 6. Adaptive Learning Engine
Assess → Identify weakness → Teach → Practice → Evaluate → Revise → Reassess → Advance  
Mastery scores with confidence/evidence. Spaced repetition.

## Technology Stack

- Frontend: React + TypeScript + Vite + Tailwind + PWA
- Backend/Data: Supabase (Auth, Postgres, RLS, Storage, Edge Functions, Realtime)
- Vectors: pgvector + HNSW
- State: Zustand + TanStack Query
- Monorepo: npm workspaces

## Folder Structure

See root README.

## Development Strategy

Build in strict phases. Each phase must be functional, tested, documented, and committed before the next begins.

## Non-Negotiable Engineering Rules

1. Do not fabricate APIs.
2. Do not invent documentation.
3. Do not claim a test passed unless it actually passed.
4. Do not claim deployment succeeded unless verified.
5. Do not expose API secrets.
6. Do not destroy user files without authorization.
7. Do not overwrite an existing project blindly.
8. Always inspect the existing architecture before major changes.
9. Keep changes modular.
10. Write tests for critical functionality.
11. Keep detailed error messages.
12. Make rollback possible.
13. Prefer simple reliable architecture over unnecessary complexity.
14. Never sacrifice security for autonomous behavior.
15. Never treat model output as automatically trustworthy.
