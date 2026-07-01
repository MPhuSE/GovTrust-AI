import asyncio
import importlib
import logging
from typing import Literal

import httpx

from app.config import Settings
from app.text import VietnameseTextProcessor


logger = logging.getLogger(__name__)
EmbeddingKind = Literal["query", "passage"]


class EmbeddingService:
    """Một embedding space duy nhất cho ingest và search; không fallback chéo model."""

    def __init__(self, settings: Settings, http: httpx.AsyncClient):
        self.settings = settings
        self.http = http
        self._model = None
        self._model_lock = asyncio.Lock()

    @property
    def model_name(self) -> str:
        return self.settings.EMBEDDING_MODEL

    @property
    def dimension(self) -> int:
        return self.settings.QDRANT_VECTOR_SIZE

    async def embed(self, texts: list[str], kind: EmbeddingKind) -> list[list[float]]:
        if not texts:
            return []
        normalized = [VietnameseTextProcessor.normalize(text) for text in texts]
        provider = self.settings.EMBEDDING_PROVIDER.lower()

        if provider in {"api", "openai"}:
            vectors = await self._embed_api(normalized, kind)
        elif provider == "local":
            vectors = await self._embed_local(normalized, kind)
        else:
            raise ValueError(f"EMBEDDING_PROVIDER không hỗ trợ: {provider}")

        for vector in vectors:
            if len(vector) != self.dimension:
                raise ValueError(
                    "Embedding dimension không khớp Qdrant: "
                    f"model trả {len(vector)}, QDRANT_VECTOR_SIZE={self.dimension}."
                )
        return vectors

    async def embed_one(self, text: str, kind: EmbeddingKind) -> list[float]:
        return (await self.embed([text], kind))[0]

    def _prefix(self, text: str, kind: EmbeddingKind) -> str:
        # Multilingual E5 được huấn luyện với prefix query:/passage:.
        if "e5" in self.model_name.lower():
            return f"{kind}: {text}"
        return text

    async def _embed_local(self, texts: list[str], kind: EmbeddingKind) -> list[list[float]]:
        if self._model is None:
            async with self._model_lock:
                if self._model is None:
                    try:
                        sentence_transformers = importlib.import_module("sentence_transformers")
                    except ModuleNotFoundError as exc:
                        raise RuntimeError(
                            "Local embeddings chưa được cài. Dùng requirements-local.txt "
                            "hoặc đặt EMBEDDING_PROVIDER=api."
                        ) from exc

                    logger.info("Loading local embedding model %s", self.model_name)
                    self._model = await asyncio.to_thread(
                        sentence_transformers.SentenceTransformer,
                        self.model_name,
                    )

        prepared = [self._prefix(text, kind) for text in texts]
        encoded = await asyncio.to_thread(
            self._model.encode,
            prepared,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return encoded.tolist()

    async def _embed_api(self, texts: list[str], kind: EmbeddingKind) -> list[list[float]]:
        if not self.settings.EMBEDDING_API_KEY:
            raise ValueError("Thiếu EMBEDDING_API_KEY cho EMBEDDING_PROVIDER=api")

        payload: dict = {
            "model": self.model_name,
            "input": [self._prefix(text, kind) for text in texts],
        }
        if self.settings.EMBEDDING_DIMENSIONS:
            payload["dimensions"] = self.settings.EMBEDDING_DIMENSIONS

        response = await self.http.post(
            self.settings.EMBEDDING_API_URL,
            headers={"Authorization": f"Bearer {self.settings.EMBEDDING_API_KEY}"},
            json=payload,
        )
        response.raise_for_status()
        data = response.json().get("data", [])
        if len(data) != len(texts):
            raise RuntimeError("Embedding API trả số vector không khớp input")
        return [item["embedding"] for item in sorted(data, key=lambda item: item["index"])]
