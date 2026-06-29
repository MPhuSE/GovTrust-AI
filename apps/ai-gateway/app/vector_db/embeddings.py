"""
Embedding service — sinh vector 768 chiều cho text tiếng Việt.

Model mặc định `keepitreal/vietnamese-sbert` (PhoBERT base → 768d). Model được
load LAZY (chỉ khi gọi embed lần đầu) để import module không kéo nặng torch,
và để `qdrant_setup`/test có thể chạy phần không cần model.

Vector được normalize (L2) — khớp với distance Cosine của collection.
"""

from __future__ import annotations

import os

# Ép transformers chỉ dùng PyTorch, bỏ qua TensorFlow/Keras (tránh xung đột
# Keras 3 nếu môi trường có sẵn TF). Phải set TRƯỚC khi import sentence_transformers.
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")

from functools import lru_cache
from typing import TYPE_CHECKING

from app.config import get_settings
from app.vector_db.schema import VECTOR_SIZE

if TYPE_CHECKING:  # tránh import nặng lúc type-check / import module
    from sentence_transformers import SentenceTransformer


class EmbeddingService:
    """Bọc SentenceTransformer, đảm bảo output đúng VECTOR_SIZE."""

    def __init__(self, model_name: str | None = None, device: str | None = None):
        settings = get_settings()
        self.model_name = model_name or settings.embedding_model
        self.device = device or settings.embedding_device
        self._model: "SentenceTransformer | None" = None

    @property
    def model(self) -> "SentenceTransformer":
        """Load model lần đầu khi cần (lazy)."""
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self.model_name, device=self.device)
            dim = self._model.get_sentence_embedding_dimension()
            if dim != VECTOR_SIZE:
                raise ValueError(
                    f"Model '{self.model_name}' sinh vector {dim} chiều, "
                    f"nhưng collection cấu hình {VECTOR_SIZE}. "
                    f"Đổi EMBEDDING_MODEL hoặc VECTOR_SIZE cho khớp."
                )
        return self._model

    def embed_text(self, text: str) -> list[float]:
        """Embed 1 câu/đoạn → list[float] (đã normalize)."""
        vec = self.model.encode(
            text, normalize_embeddings=True, convert_to_numpy=True
        )
        return vec.tolist()

    def embed_batch(self, texts: list[str], batch_size: int = 32) -> list[list[float]]:
        """Embed nhiều đoạn (nhanh hơn gọi từng cái) → list các vector."""
        if not texts:
            return []
        vecs = self.model.encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=len(texts) > 64,
        )
        return [v.tolist() for v in vecs]


@lru_cache
def get_embedding_service() -> EmbeddingService:
    """Singleton embedding service (1 lần load model cho cả process)."""
    return EmbeddingService()
