# EDUBRAIN AI — Deploy Guide

## Prerequisites

1. Supabase project with all migrations applied (`docs/SETUP.md`)
2. GitHub repo: https://github.com/pbwsantu-collab/edubrain-ai
3. (Optional) OpenAI key for `ai-chat` and `embed-text` Edge Functions

## 1. Supabase Edge Functions

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

supabase functions deploy ai-chat
supabase functions deploy embed-text

supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set AI_MODEL=gpt-4o-mini
supabase secrets set EMBEDDING_MODEL=text-embedding-3-small
```

## 2. Frontend on Vercel

1. [vercel.com](https://vercel.com) → **Add New Project**
2. Import `pbwsantu-collab/edubrain-ai`
3. Framework: Vite (via `vercel.json`)
4. Env:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |

5. Deploy

## 3. Verify checklist

- [ ] Login / sign up
- [ ] Teach (Edge Function or local fallback)
- [ ] Curriculum after migrations
- [ ] Knowledge note + optional embeddings
- [ ] Coding → Inspect public GitHub URL
- [ ] RLS isolation between users

## 4. Netlify alternative

- Base: `apps/web`
- Build: `npm install && npm run build`
- Publish: `dist`
- Same `VITE_*` vars
- SPA: `/* /index.html 200`

## 5. Security

- Never put OpenAI keys in `VITE_*`
- Edge secrets only in Supabase
- Coding agent never silent-deploys
