from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


AI_SVC_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Cấu hình ai-svc; mọi API key chỉ được đọc từ environment."""

    model_config = SettingsConfigDict(
        env_file=(str(REPO_ROOT / ".env"), str(AI_SVC_DIR / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    AI_SVC_PORT: int = 8000
    AI_SVC_GRPC_URL: str = "0.0.0.0:50051"

    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "legal_chunks"
    QDRANT_VECTOR_SIZE: int = 768
    LEGAL_CHUNKS_DIR: str = "data/legal-sources/chunks"

    # api: OpenAI-compatible endpoint (default); local requires requirements-local.txt.
    EMBEDDING_PROVIDER: str = "api"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_API_URL: str = "https://api.openai.com/v1/embeddings"
    EMBEDDING_API_KEY: str = ""
    EMBEDDING_DIMENSIONS: int | None = 768

    HYBRID_DENSE_WEIGHT: float = 0.6
    HYBRID_LEXICAL_WEIGHT: float = 0.4
    HYBRID_RRF_K: int = 60
    LAWGARD_REFERENCE_THRESHOLD: float = 0.55

    # Optional OpenAI-compatible chat endpoint for grounded Vietnamese answers.
    LLM_API_URL: str = "https://api.openai.com/v1/chat/completions"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = ""
    LLM_TIMEOUT_SECONDS: float = 45.0

    VNPT_EKYC_BASE_URL: str = ""
    VNPT_EKYC_TOKEN_ID: str = ""
    VNPT_EKYC_TOKEN_KEY: str = ""
    VNPT_EKYC_ACCESS_TOKEN: str = ""

    # SmartReader: bóc tách văn bản hành chính (giấy khai sinh...), bộ key riêng eKYC.
    VNPT_SMARTREADER_BASE_URL: str = ""
    VNPT_SMARTREADER_TOKEN_ID: str = ""
    VNPT_SMARTREADER_TOKEN_KEY: str = ""
    VNPT_SMARTREADER_ACCESS_TOKEN: str = ""

    VNPT_SMARTBOT_BASE_URL: str = ""
    VNPT_SMARTBOT_API_KEY: str = ""

    @field_validator("EMBEDDING_DIMENSIONS", mode="before")
    @classmethod
    def empty_dimension_is_none(cls, value):
        return None if value == "" else value

    @property
    def legal_chunks_path(self) -> Path:
        configured = Path(self.LEGAL_CHUNKS_DIR)
        if configured.is_absolute():
            return configured
        cwd_candidate = Path.cwd() / configured
        if cwd_candidate.exists():
            return cwd_candidate
        return REPO_ROOT / configured

    @property
    def grpc_bind(self) -> str:
        value = self.AI_SVC_GRPC_URL.strip()
        if value.startswith("grpc://"):
            return value.removeprefix("grpc://")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
