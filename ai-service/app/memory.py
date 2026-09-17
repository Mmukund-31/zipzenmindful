"""Conversational memory, split into the two layers the resume bullets call
out separately:

- Short-term: an in-process per-user message buffer (LangChain
  InMemoryChatMessageHistory) giving the agent immediate turn-by-turn context
  within a session.
- Long-term: every chat turn is embedded and written into the "user_memory"
  Chroma collection, namespaced by user_id via metadata. This is retrievable
  by semantic search much later (a different session, days later), which is
  what makes it "long-term" rather than just a bigger buffer.
"""
from collections import defaultdict
from datetime import datetime, timezone

from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.documents import Document

from .vectorstore import user_memory

_histories: dict[str, InMemoryChatMessageHistory] = defaultdict(InMemoryChatMessageHistory)


def get_session_history(user_id: str) -> InMemoryChatMessageHistory:
    return _histories[user_id]


def remember_long_term(user_id: str, text: str, kind: str = "chat") -> None:
    if not user_id or not text:
        return
    try:
        user_memory().add_documents(
            [
                Document(
                    page_content=text,
                    metadata={
                        "user_id": user_id,
                        "kind": kind,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
            ]
        )
    except Exception:
        # Long-term memory is best-effort — never fail the user-facing request over it.
        pass


def recall_long_term(user_id: str, query: str, k: int = 4) -> list[str]:
    if not user_id:
        return []
    try:
        results = user_memory().similarity_search(query, k=k, filter={"user_id": user_id})
    except Exception:
        return []
    return [doc.page_content for doc in results]
