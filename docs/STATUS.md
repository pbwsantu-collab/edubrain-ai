# EDUBRAIN AI — Status (2026-09-14)

## Platform completion

| Scope | Estimate |
|-------|----------|
| Education MVP (teach, curriculum, mastery, notes) | ~75–80% |
| Knowledge / RAG | ~85% |
| Coding agent (inspect/read/propose only) | ~45–50% |
| Full master vision | ~50–55% |

## Your live backend

- Supabase ref: `qpihivtitywtoxjedyrk`
- URL: `https://qpihivtitywtoxjedyrk.supabase.co`
- **Required:** run migrations (see APPLY_MIGRATIONS.md) + `.env.local`

## Recent code

- Coding: experience events on inspect + LLM patch
- Coding: **Copy** on patch proposal
- Settings: default permission mode
- Knowledge: txt/md upload + embeddings pipeline
- Teacher: vector RAG prefer + source labels (local)
- Teacher: lesson experience logging (local; pull latest TeachingPage)

## Blocked without your action

SQL schema on Supabase, Edge Function secrets, local/Vercel env vars.

## Explicitly not done

PDF parse, apply-patch, sandbox test runner, GitHub OAuth write, auto-deploy.
