from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    llm_provider: str = "gemini"  # "gemini" | "openai"

    gemini_api_key: str | None = None
    gemini_chat_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "models/gemini-embedding-001"

    openai_api_key: str | None = None
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    chroma_dir: str = "./chroma_db"
    cors_origins: str = "*"


settings = Settings()
