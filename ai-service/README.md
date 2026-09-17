# MindEase AI Service

A standalone **Python / FastAPI / LangChain** microservice that provides every AI capability in
the MindEase wellness app: a RAG-grounded, multilingual, tool-using chat agent with long-term
vector memory, plus mood analysis, image understanding, and personalized insight generation.

It is fully independent of the Node/Express app — it can be run, tested, and demoed entirely on
its own via the interactive Swagger docs at `/docs`.

## Architecture

```
                         ┌───────────────────────────────────────────┐
                         │              FastAPI app (async)            │
                         │  /ai/chat  /ai/mood  /ai/memories  /ai/meme │
                         │        /ai/wellness   /ai/insights          │
                         └───────────────┬───────────────────────────┘
                                          │
                 ┌────────────────────────┼─────────────────────────┐
                 ▼                        ▼                         ▼
        ┌─────────────────┐     ┌──────────────────┐      ┌──────────────────┐
        │ LangChain agent  │     │  RAG chains       │      │  Vision / JSON    │
        │ (tool-calling)   │     │ (retrieve + gen)  │      │  generation chains │
        │  tools:          │     │  daily tip,        │      │  mood, meme,        │
        │  - search KB     │     │  thought-interrupt │      │  gallery title       │
        │  - recall memory │     └─────────┬─────────┘      └────────────────────┘
        │  - breathing     │               │
        └────────┬─────────┘               │
                 │                          ▼
                 ▼                ┌──────────────────┐
        ┌─────────────────┐        │   Chroma vector   │
        │  Conversation    │        │   DB (embedded)    │
        │  memory:         │◄──────►│  - wellness_kb      │
        │  - short-term    │        │  - user_memory       │
        │    buffer        │        │    (per-user, long-  │
        │  - long-term     │        │     term, filtered)   │
        │    (vector)      │        └──────────────────┘
        └─────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │  LLM provider (async)         │
        │  Gemini 2.5 Flash (default)   │
        │  or OpenAI (LLM_PROVIDER=openai) │
        └─────────────────────────────┘
```

**How each capability is implemented:**

| Capability | Where |
|---|---|
| RAG pipeline / semantic search / embeddings | `app/vectorstore.py`, `app/ingest.py`, `app/chains/wellness_chain.py` — 19 curated wellness documents (`app/knowledge_base/`) are embedded into Chroma and retrieved by similarity search to ground the daily-tip and thought-interruption generations. |
| LangChain agent: reasoning + tool execution | `app/agent.py` — a tool-calling `AgentExecutor` with `search_wellness_knowledge`, `recall_user_memory`, and `suggest_breathing_exercise` tools, used by `/ai/chat` and `/ai/insights/personalized`. |
| Vector DB for retrieval + long-term memory | `app/vectorstore.py` — two Chroma collections: `wellness_kb` (documents) and `user_memory` (per-user embedded conversation history, filtered by `user_id` metadata). |
| Conversational memory, multilingual | `app/memory.py` (short-term buffer + long-term vector recall) + the language-detection instructions in `app/agent.py`'s system prompt, covering 13 Indian languages and 10 global languages. |
| Async, scalable LLM pipelines | Every route is `async def`; LLM calls use `.ainvoke()`/`.astream_events()`; `/ai/chat/stream` streams tokens over Server-Sent Events. |

## Running it standalone

```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env   # then fill in GEMINI_API_KEY
uvicorn app.main:app --reload
```

On startup it automatically embeds `app/knowledge_base/*.md` into the local Chroma store at
`CHROMA_DIR` (default `./chroma_db`) if it hasn't been ingested yet.

Open **http://localhost:8000/docs** for interactive Swagger docs, or try it directly:

```bash
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I keep overthinking everything before I sleep", "user_id": "demo-user"}'

# Ask a follow-up in the same session and the agent will recall context via user_memory:
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Can you remind me what you suggested last time?", "user_id": "demo-user"}'

# Streamed response (Server-Sent Events):
curl -N -X POST http://localhost:8000/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Give me a breathing exercise", "user_id": "demo-user"}'

# Multilingual — replies entirely in Hindi:
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "मुझे बहुत तनाव महसूस हो रहा है", "user_id": "demo-user"}'
```

## Switching LLM providers

Everything is built against LangChain's provider-agnostic `BaseChatModel`/`Embeddings`
interfaces (`app/llm.py`). To switch from Gemini to OpenAI, set in `.env`:

```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

No other code changes are needed — the agent, RAG chains, and vision chains all resolve their
model through `get_chat_model()` / `get_embeddings()`.

## Running with the full app

From the repo root, `docker compose up` starts this service alongside the Node/Express app and
Postgres — see the root `README.md` for details.
