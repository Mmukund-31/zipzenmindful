from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .ingest import ingest_knowledge_base
from .routers import chat, insights, memories, meme, mood, wellness


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Best-effort: an invalid/missing LLM API key shouldn't take down the whole service on boot —
    # let it start so /health is reachable, and surface the failure per-request instead.
    try:
        ingested = ingest_knowledge_base()
        if ingested:
            print(f"[startup] Ingested {ingested} wellness knowledge base documents into Chroma.")
        else:
            print("[startup] Wellness knowledge base already populated, skipping ingestion.")
    except Exception as error:  # noqa: BLE001
        print(f"[startup] Knowledge base ingestion failed, continuing without it: {error}")
    yield


app = FastAPI(
    title="MindEase AI Service",
    description=(
        "LangChain + FastAPI microservice powering MindEase's RAG pipelines, tool-calling agent, "
        "vector-backed conversational memory, and multilingual LLM responses."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

origins = ["*"] if settings.cors_origins == "*" else [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(mood.router)
app.include_router(memories.router)
app.include_router(meme.router)
app.include_router(wellness.router)
app.include_router(insights.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "llm_provider": settings.llm_provider}
