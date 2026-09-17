"""Chroma vector store access.

Two collections back the two vector-DB use cases the app demonstrates:
- "wellness_kb": the RAG knowledge base of coping techniques (semantic search
  over curated documents).
- "user_memory": long-term conversational memory — embedded chat turns,
  moods, and captured memories, retrievable per-user for personalization.
"""
import os
from functools import lru_cache

from langchain_chroma import Chroma

from .config import settings
from .llm import get_embeddings


@lru_cache(maxsize=8)
def get_vectorstore(collection_name: str) -> Chroma:
    persist_dir = os.path.join(settings.chroma_dir, collection_name)
    os.makedirs(persist_dir, exist_ok=True)
    return Chroma(
        collection_name=collection_name,
        embedding_function=get_embeddings(),
        persist_directory=persist_dir,
    )


def wellness_kb() -> Chroma:
    return get_vectorstore("wellness_kb")


def user_memory() -> Chroma:
    return get_vectorstore("user_memory")
