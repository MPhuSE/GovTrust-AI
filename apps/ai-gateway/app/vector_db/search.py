"""
Truy xuất ngữ nghĩa (RAG retrieval) trên `legal_chunks`.

Dùng bởi LawGuard: embed query → search top-k (lọc theo category) → trả về
chunk kèm điểm tương đồng để tạo cảnh báo có citation.

CLI thử nhanh:
    python -m app.vector_db.search "giấy chứng sinh khi đăng ký khai sinh" HO_TICH
"""

from __future__ import annotations

import argparse
import logging

from pydantic import BaseModel
from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.config import get_settings
from app.vector_db.client import get_qdrant_client
from app.vector_db.embeddings import get_embedding_service
from app.vector_db.schema import (
    COLLECTION_NAME,
    LegalCategory,
    LegalStatus,
)

logger = logging.getLogger("search")


class SearchResult(BaseModel):
    """1 chunk khớp + điểm tương đồng (cosine, càng cao càng liên quan)."""

    chunkId: str
    score: float
    title: str
    article: str
    sourceVersion: str
    category: str
    text: str
    status: str = "ACTIVE"
    effectiveDate: str | None = None


class LegalSearchService:
    """Bọc embed + qdrant.search cho LawGuard."""

    def __init__(self):
        self._client = get_qdrant_client()
        self._embedder = get_embedding_service()
        self._settings = get_settings()

    def search(
        self,
        query: str,
        category: LegalCategory | str | None = None,
        top_k: int | None = None,
        score_threshold: float | None = None,
        status: LegalStatus | str | None = LegalStatus.ACTIVE,
    ) -> list[SearchResult]:
        """
        Tìm chunk liên quan tới `query`.

        - category: lọc theo nhóm thủ tục (tận dụng payload index keyword).
        - status: mặc định CHỈ lấy luật còn hiệu lực (ACTIVE). Truyền None để
          tra cứu cả bản đã thay thế/hết hiệu lực (audit lịch sử).
        - top_k / score_threshold: mặc định lấy từ settings (RAG_*).
        """
        top_k = top_k or self._settings.rag_top_k
        threshold = (
            score_threshold
            if score_threshold is not None
            else self._settings.rag_score_threshold
        )

        query_vector = self._embedder.embed_text(query)

        conditions: list[FieldCondition] = []
        if category is not None:
            value = category.value if isinstance(category, LegalCategory) else category
            conditions.append(
                FieldCondition(key="category", match=MatchValue(value=value))
            )
        if status is not None:
            value = status.value if isinstance(status, LegalStatus) else status
            conditions.append(
                FieldCondition(key="status", match=MatchValue(value=value))
            )
        query_filter = Filter(must=conditions) if conditions else None

        hits = self._client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            query_filter=query_filter,
            limit=top_k,
            score_threshold=threshold,
            with_payload=True,
        ).points

        results: list[SearchResult] = []
        for h in hits:
            p = h.payload or {}
            results.append(
                SearchResult(
                    chunkId=p.get("chunkId", str(h.id)),
                    score=h.score,
                    title=p.get("title", ""),
                    article=p.get("article", ""),
                    sourceVersion=p.get("sourceVersion", ""),
                    category=p.get("category", ""),
                    text=p.get("text", ""),
                    status=p.get("status", "ACTIVE"),
                    effectiveDate=p.get("effectiveDate"),
                )
            )
        return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Thử search legal_chunks")
    parser.add_argument("query", help="Câu truy vấn")
    parser.add_argument(
        "category", nargs="?", default=None, help="Nhóm thủ tục, vd HO_TICH"
    )
    args = parser.parse_args()

    service = LegalSearchService()
    results = service.search(args.query, category=args.category)
    if not results:
        print("(Không có kết quả vượt ngưỡng)")
        return
    for r in results:
        print(f"[{r.score:.3f}] {r.title} — {r.article}")
        print(f"        {r.text[:120]}...")


if __name__ == "__main__":
    main()
