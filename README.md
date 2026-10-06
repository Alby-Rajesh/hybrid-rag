# Ask your documents: hybrid RAG on Groq

Upload PDFs or notes, ask a question, and get an answer grounded in your documents with citations. Every question is retrieved two ways and fused, and the UI shows why each passage was picked.

## Architecture

```
Upload  → extract text (unpdf) → sentence chunks (900 chars, 150 overlap)
        → Gemini embeddings (768d) → Supabase: content + tsvector + pgvector

Question → keyword match  (Postgres full-text, OR of terms) ─┐
         → embed question → cosine similarity (pgvector HNSW) ─┴→ Reciprocal Rank Fusion
         → top 6 passages → Groq LLM → answer with [n] citations
```

| Layer | Choice |
| --- | --- |
| App and hosting | Next.js 15 App Router on Vercel |
| Database | Supabase Postgres with pgvector and full-text search |
| Embeddings | Gemini `gemini-embedding-001` (Groq has no embedding models) |
| LLM | Groq `openai/gpt-oss-120b` |

## Project structure

```
src/
  app/
    api/chat/route.ts      question → hybrid search → grounded answer
    api/ingest/route.ts    file upload → chunk → embed → store
    layout.tsx
    page.tsx
    globals.css
  components/
    AskForm.tsx
    Evidence.tsx
    UploadPanel.tsx
  lib/
    answer.ts              prompt and LLM call
    chunk.ts               sentence-aware chunking
    client.ts              browser fetch helpers
    db.ts                  Supabase client
    embed.ts               Gemini embeddings with retry
    env.ts
    extract.ts             PDF and text extraction
    groq.ts
    http.ts                route wrapper, validation, admin check
    ingest.ts
    retrieve.ts            hybrid search
  types/index.ts
supabase/schema.sql        table, indexes, hybrid_search function
```

## Step by step

### 1. Get the keys

- Groq: https://console.groq.com/keys
- Gemini: https://aistudio.google.com/apikey
- Supabase: create a free project at https://supabase.com/dashboard, then copy the Project URL and the `service_role` key from Project Settings → API.

### 2. Create the database

In Supabase, open SQL Editor → New query, paste `supabase/schema.sql`, and run it.

### 3. Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local`, then open http://localhost:3000. `ADMIN_KEY` is any secret you choose; it protects uploads.

### 4. Push to GitHub

```bash
git init
git add .
git commit -m "Hybrid RAG with Groq"
git branch -M main
git remote add origin https://github.com/<you>/hybrid-rag.git
git push -u origin main
```

`.env.local` is ignored by git. Never commit keys.

### 5. Deploy on Vercel

1. Go to https://vercel.com/new and import the repository.
2. Under Environment Variables, add every key from `.env.example`.
3. Click Deploy.

To change a key later, edit it in Project → Settings → Environment Variables and redeploy.

### 6. Test the API

```bash
curl -X POST https://<your-app>.vercel.app/api/ingest \
  -H "x-admin-key: <ADMIN_KEY>" -F "files=@policy.pdf"

curl -X POST https://<your-app>.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"How many leave days can I carry over?"}'
```

## Limits to know

- Vercel caps request bodies at about 4.5 MB, so upload large PDFs one at a time.
- The Gemini free tier has per-minute token limits. Embedding retries with backoff, but very large uploads can still take a while or fail. A paid tier or another provider in `lib/embed.ts` removes this.
- Groq model IDs change. Check https://console.groq.com/docs/models and set `GROQ_MODEL`.

## Ideas to extend

- Stream answers token by token.
- Rerank the fused results with an LLM or cross-encoder.
- Add an eval set and measure recall@k and answer faithfulness.
- Per-user libraries with Supabase Auth.
