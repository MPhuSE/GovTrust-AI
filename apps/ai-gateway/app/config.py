"""
Cấu hình AI Gateway — đọc từ biến môi trường / file .env.

Chỉ chứa những gì vector DB (LawGuard) cần ở giai đoạn này. Các khóa VNPT,
Redis... sẽ được bổ sung khi triển khai OCR/CrossCheck.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- App ---
    ai_gateway_port: int = 8000

    # --- Qdrant ---
    # Ưu tiên QDRANT_URL; nếu trống sẽ ghép từ host/port.
    qdrant_url: str | None = None
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: str | None = None

    # --- Embedding ---
    embedding_model: str = "keepitreal/vietnamese-sbert"
    embedding_device: str = "cpu"

    # --- RAG ---
    rag_top_k: int = 5
    rag_score_threshold: float = 0.5

    @property
    def resolved_qdrant_url(self) -> str:
        """URL Qdrant cuối cùng (ưu tiên QDRANT_URL, fallback host:port)."""
        if self.qdrant_url:
            return self.qdrant_url.rstrip("/")
        return f"http://{self.qdrant_host}:{self.qdrant_port}"


@lru_cache
def get_settings() -> Settings:
    """Singleton settings (cache để không parse .env nhiều lần)."""
    return Settings()
