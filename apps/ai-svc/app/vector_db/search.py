"""
LegalSearchService — tìm kiếm văn bản pháp luật trên Qdrant.
Hỗ trợ dense search (embedding) + filter theo category.
"""

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
from app.config import settings
from dataclasses import dataclass


@dataclass
class LegalChunk:
    chunk_id: str
    text: str
    title: str
    article: str
    url: str
    source_version: str
    category: str
    score: float


class LegalSearchService:
    def __init__(self):
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collection = settings.QDRANT_COLLECTION
        self.embedder = SentenceTransformer("intfloat/multilingual-e5-base")

    def search(
        self,
        query: str,
        category: str | None = None,
        top_k: int = 5,
    ) -> list[LegalChunk]:
        """Tìm kiếm dense embedding, filter theo category nếu có."""
        query_vector = self.embedder.encode(f"query: {query}", normalize_embeddings=True).tolist()

        search_filter = None
        if category:
            search_filter = Filter(
                must=[FieldCondition(key="category", match=MatchValue(value=category))]
            )

        results = self.client.search(
            collection_name=self.collection,
            query_vector=query_vector,
            query_filter=search_filter,
            limit=top_k,
            with_payload=True,
        )

        return [
            LegalChunk(
                chunk_id=r.payload.get("chunkId", ""),
                text=r.payload.get("text", ""),
                title=r.payload.get("title", ""),
                article=r.payload.get("article", ""),
                url=r.payload.get("url", ""),
                source_version=r.payload.get("sourceVersion", ""),
                category=r.payload.get("category", ""),
                score=r.score,
            )
            for r in results
        ]
