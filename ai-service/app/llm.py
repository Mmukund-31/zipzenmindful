"""Provider-agnostic LLM + embeddings factory.

Defaults to Gemini (reusing the app's existing GEMINI_API_KEY) but the rest of
the codebase only ever depends on the LangChain BaseChatModel / Embeddings
interfaces, so switching LLM_PROVIDER=openai in .env is a one-line change.
"""
from functools import lru_cache

from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel

from .config import settings


@lru_cache(maxsize=8)
def get_chat_model(temperature: float = 0.7) -> BaseChatModel:
    if settings.llm_provider == "openai":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=settings.openai_chat_model,
            temperature=temperature,
            api_key=settings.openai_api_key,
        )

    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model=settings.gemini_chat_model,
        temperature=temperature,
        google_api_key=settings.gemini_api_key,
    )


@lru_cache(maxsize=1)
def get_embeddings() -> Embeddings:
    if settings.llm_provider == "openai":
        from langchain_openai import OpenAIEmbeddings

        return OpenAIEmbeddings(
            model=settings.openai_embedding_model,
            api_key=settings.openai_api_key,
        )

    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    return GoogleGenerativeAIEmbeddings(
        model=settings.gemini_embedding_model,
        google_api_key=settings.gemini_api_key,
    )
