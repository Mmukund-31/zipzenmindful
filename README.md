# ZenMindful — AI-Powered Mental Wellness Platform

MindEase is a full-stack mental wellness app: mood tracking, gratitude journaling, memory/photo
management, wellness challenges, and an AI companion chat — backed by a dedicated **Python /
FastAPI / LangChain** AI microservice implementing retrieval-augmented generation (RAG), a
tool-using LLM agent, vector-database-backed conversational memory, and multilingual support.

## Tech stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui, TanStack Query
**App backend:** Node.js, Express, TypeScript, PostgreSQL (Drizzle ORM)
**AI backend:** Python, FastAPI, LangChain, Chroma (vector database), Gemini / OpenAI LLMs

## Architecture

```
┌─────────────┐      /api/*      ┌──────────────────┐      /ai/*      ┌────────────────────┐
│  React SPA   │ ───────────────► │  Express server    │ ───────────────► │  FastAPI AI service   │
│  (client/)   │ ◄─────────────── │  (server/)          │ ◄─────────────── │  (ai-service/)          │
└─────────────┘                  │  - auth/session      │                  │  - LangChain agent        │
                                  │  - Postgres (Drizzle) │                  │  - RAG (Chroma vector DB)  │
                                  │  - all REST routes    │                  │  - conversational memory     │
                                  └──────────┬───────────┘                  │  - multilingual LLM chains    │
                                             │                              └────────────────────┘
                                             ▼
                                     ┌───────────────┐
                                     │  PostgreSQL     │
                                     │  (users, moods, │
                                     │  memories, etc) │
                                     └───────────────┘
```

The Express app owns everything unrelated to AI (auth, sessions, all Postgres-backed CRUD). Every
AI capability — chat, mood analysis, image/meme understanding, wellness tips, personalized
insights — is delegated over HTTP to the `ai-service` microservice, which is a self-contained
Python codebase you can also run and demo entirely on its own. See **[ai-service/README.md](ai-service/README.md)**
for the AI architecture in detail (RAG pipeline, agent tools, vector DB collections, multilingual
prompting, async streaming).

### AI capabilities at a glance

- **RAG pipeline**: 19 curated wellness documents (breathing techniques, CBT skills, grounding
  exercises, etc.) embedded into a Chroma vector store and retrieved by semantic search to ground
  the daily wellness tip and thought-interruption technique generations.
- **LangChain agent**: a tool-calling agent reasons about whether to search the knowledge base,
  recall the user's own long-term memory, or suggest a breathing exercise before replying in chat.
- **Vector database**: Chroma, with two collections — `wellness_kb` (RAG documents) and
  `user_memory` (per-user embedded conversation history for long-term personalization).
- **Conversational memory**: short-term per-session buffer + long-term vector-backed recall,
  combined for context-aware, personalized replies across sessions.
- **Multilingual**: chat replies in 13 Indian languages and 10 global languages, matching the
  user's message language automatically.
- **Async**: every AI endpoint is asynchronous end-to-end, with a Server-Sent Events streaming
  endpoint (`/ai/chat/stream`) for token-by-token responses.

## Running locally

### Option A — Docker Compose (everything at once)

```bash
cp .env.example .env        # fill in GEMINI_API_KEY
docker compose up --build
```

This starts Postgres, the `ai-service` (FastAPI, port 8000), and the app (Express + built React
client, port 5000).

### Option B — Run services individually

```bash
# 1. AI service
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in GEMINI_API_KEY
uvicorn app.main:app --reload      # http://localhost:8000, docs at /docs

# 2. App (in a separate terminal, from the repo root)
cp .env.example .env        # fill in DATABASE_URL, SESSION_SECRET, GEMINI_API_KEY
npm install
npm run db:push
npm run dev                 # http://localhost:5000
```

The app talks to the AI service via `AI_SERVICE_URL` (defaults to `http://localhost:8000`).

## Project structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for the full file tree, and
[ai-service/README.md](ai-service/README.md) for the AI service's internal architecture.
