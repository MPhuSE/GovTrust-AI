"""
Vector DB (Qdrant) cho LawGuard — chỉ mục ngữ nghĩa văn bản pháp luật.

Đây là lớp PHÁI SINH (rebuild được từ nguồn luật), KHÔNG phải nguồn sự thật.
Nguồn sự thật nghiệp vụ là MongoDB (do NestJS sở hữu).

Export gọn cho nơi khác dùng:
    from app.vector_db import LegalChunk, EmbeddingService, LegalSearchService
"""

from app.vector_db.schema import (
    COLLECTION_NAME,
    DISTANCE,
    VECTOR_SIZE,
    LegalChunk,
    LegalCategory,
    LegalStatus,
    point_id_for,
)
from app.vector_db.embeddings import EmbeddingService, get_embedding_service
from app.vector_db.client import get_qdrant_client
from app.vector_db.search import LegalSearchService, SearchResult

__all__ = [
    "COLLECTION_NAME",
    "VECTOR_SIZE",
    "DISTANCE",
    "LegalChunk",
    "LegalCategory",
    "LegalStatus",
    "point_id_for",
    "EmbeddingService",
    "get_embedding_service",
    "get_qdrant_client",
    "LegalSearchService",
    "SearchResult",
]
