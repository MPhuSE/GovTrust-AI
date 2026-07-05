import asyncio
import json
import logging
import re
from dataclasses import dataclass, replace
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    NamedVector,
    PayloadSchemaType,
    PointStruct,
    VectorParams,
)
from rank_bm25 import BM25Okapi

from app.config import Settings
from app.services.embedding import EmbeddingService
from app.text import VietnameseTextProcessor


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class LegalChunk:
    chunk_id: str
    text: str
    title: str
    article: str
    url: str
    source_version: str
    category: str
    score: float = 0.0

    @classmethod
    def from_dict(cls, data: dict) -> "LegalChunk":
        return cls(
            chunk_id=str(data.get("chunkId", "")),
            text=str(data.get("text", "")),
            title=str(data.get("title", "")),
            article=str(data.get("article", "")),
            url=str(data.get("url", "")),
            source_version=str(data.get("sourceVersion", "")),
            category=str(data.get("category", "")),
        )

    def payload(self) -> dict:
        return {
            "chunkId": self.chunk_id,
            "text": self.text,
            "title": self.title,
            "article": self.article,
            "url": self.url,
            "sourceVersion": self.source_version,
            "category": self.category,
        }


class HybridLegalSearch:
    """Dense Qdrant + BM25 tiếng Việt, hợp nhất bằng weighted RRF."""

    def __init__(self, settings: Settings, embeddings: EmbeddingService):
        self.settings = settings
        self.embeddings = embeddings
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY or None,
            timeout=10,
        )
        self.documents: list[LegalChunk] = []
        self.by_id: dict[str, LegalChunk] = {}
        self.tokenized_documents: list[list[str]] = []
        self.bm25: BM25Okapi | None = None
        self.dense_ready = False
        # canonical category key -> giá trị category thật đang lưu trong Qdrant.
        # Data ingest không nhất quán (DAT_DAI, HO_TICH vs "CƯ TRÚ"), còn caller
        # gửi "ĐẤT ĐAI" / "HỘ TỊCH"... nên phải resolve về đúng giá trị đã lưu.
        self._category_lookup: dict[str, str] = {}

    @staticmethod
    def _canon_category(value: str) -> str:
        """Fold dấu + slug hóa: 'ĐẤT ĐAI' == 'DAT_DAI' == 'dat dai' -> 'DAT_DAI'."""
        folded = VietnameseTextProcessor.fold_accents(value).upper()
        return re.sub(r"[^A-Z0-9]+", "_", folded).strip("_")

    def _resolve_category(self, category: str | None) -> str | None:
        """Ánh xạ category caller gửi về đúng giá trị Qdrant đang lưu (cho dense filter)."""
        if not category:
            return None
        return self._category_lookup.get(self._canon_category(category), category)

    async def initialize(self) -> None:
        self.documents = await asyncio.to_thread(self._load_documents, self.settings.legal_chunks_path)
        self.by_id = {doc.chunk_id: doc for doc in self.documents}
        # Lookup canonical -> giá trị category thật. Ưu tiên category trong Qdrant vì
        # collection chứa nhiều category hơn JSON local (HO_KINH_DOANH, CƯ TRÚ không có
        # file local) — nếu chỉ dựa vào JSON, filter cho các category đó sẽ không khớp.
        self._category_lookup = {
            self._canon_category(doc.category): doc.category
            for doc in self.documents
            if doc.category
        }
        qdrant_categories = await asyncio.to_thread(self._load_qdrant_categories)
        for value in qdrant_categories:
            self._category_lookup[self._canon_category(value)] = value
        if qdrant_categories:
            logger.info("Category lookup từ Qdrant: %s", sorted(qdrant_categories))
        if self.documents:
            self.tokenized_documents = [
                VietnameseTextProcessor.tokens(doc.text) for doc in self.documents
            ]
            self.bm25 = BM25Okapi(self.tokenized_documents)
        else:
            logger.warning("Không tìm thấy legal chunks tại %s", self.settings.legal_chunks_path)
            return

        try:
            await asyncio.to_thread(self._ensure_collection)
            if not self.settings.QDRANT_INGEST_ON_STARTUP:
                info = await asyncio.to_thread(
                    self.client.get_collection,
                    self.settings.QDRANT_COLLECTION,
                )
                self.dense_ready = bool(info.points_count)
                logger.info(
                    "Using existing Qdrant collection with %s points",
                    info.points_count,
                )
                return

            vectors = await self.embeddings.embed([doc.text for doc in self.documents], "passage")
            points = [
                PointStruct(
                    id=str(uuid5(NAMESPACE_URL, doc.chunk_id)),
                    vector={self.settings.QDRANT_VECTOR_NAME: vector},
                    payload=doc.payload(),
                )
                for doc, vector in zip(self.documents, vectors)
            ]
            await asyncio.to_thread(
                self.client.upsert,
                collection_name=self.settings.QDRANT_COLLECTION,
                points=points,
                wait=True,
            )
            self.dense_ready = True
            logger.info("Ingested %d legal chunks into Qdrant", len(points))
        except Exception as exc:
            # Lexical retrieval vẫn chạy; không trộn hash vector vào collection cũ.
            self.dense_ready = False
            logger.warning("Dense retrieval chưa sẵn sàng, dùng BM25: %s", exc)

    async def search(
        self,
        query: str,
        category: str | None = None,
        top_k: int = 5,
    ) -> list[LegalChunk]:
        query = VietnameseTextProcessor.normalize(query)
        candidate_limit = max(top_k * 4, 12)

        dense_ids: list[str] = []
        if self.dense_ready:
            try:
                dense_ids = await self._dense_search(query, category, candidate_limit)
            except Exception as exc:
                logger.warning("Dense search lỗi, tiếp tục bằng BM25: %s", exc)

        lexical_ids = await asyncio.to_thread(
            self._lexical_search, query, category, candidate_limit
        )
        return self._rrf(dense_ids, lexical_ids, top_k)

    async def fetch_by_article(
        self,
        article_num: str,
        category: str | None = None,
        doc_hint: str | None = None,
    ) -> LegalChunk | None:
        """Lấy CHÍNH XÁC 1 điều luật theo số điều (deterministic, không semantic).
        Role text trong checklist thường ghi sẵn căn cứ (vd 'Đ.85 NĐ 168/2025') —
        đây là tín hiệu mạnh hơn hẳn RAG mờ. `doc_hint` (vd '168/2025') để chọn đúng
        văn bản khi nhiều luật cùng có 'Điều 85'. Trả None nếu không tìm thấy → caller
        fallback sang semantic search."""
        target = f"Điều {article_num}"
        conditions = [FieldCondition(key="article", match=MatchValue(value=target))]
        resolved = self._resolve_category(category)
        if resolved:
            conditions.append(
                FieldCondition(key="category", match=MatchValue(value=resolved))
            )
        try:
            points, _ = await asyncio.to_thread(
                self.client.scroll,
                collection_name=self.settings.QDRANT_COLLECTION,
                scroll_filter=Filter(must=conditions),
                limit=16,
                with_payload=True,
                with_vectors=False,
            )
        except Exception as exc:
            logger.warning("fetch_by_article lỗi (Điều %s): %s", article_num, exc)
            return None
        chunks = [LegalChunk.from_dict(p.payload) for p in points if p.payload]
        if not chunks:
            return None
        # Ưu tiên đúng văn bản (doc_hint) trước khi chọn chunk.
        if doc_hint:
            preferred = [c for c in chunks if doc_hint in c.title]
            if preferred:
                chunks = preferred
        # Cùng 1 điều có thể có nhiều chunk: 1 chunk mở đầu đúng "Điều N. <tiêu đề>"
        # (nội dung đầy đủ) và các mảnh vỡ ranh giới (đuôi điều trước bị dán nhầm nhãn,
        # mở đầu giữa câu như "Điều N của Luật này..."). Chọn chunk mở đầu chuẩn nhất.
        heading = re.compile(rf"^\s*Điều\s+{re.escape(article_num)}\s*\.")
        best = max(
            chunks,
            key=lambda c: (
                1 if heading.match(c.text or "") else 0,   # mở đầu đúng tiêu đề điều
                len(c.text or ""),                          # nội dung dài hơn = đầy đủ hơn
            ),
        )
        return replace(best, score=1.0)

    async def ingest(self, records: list[dict]) -> int:
        """Embed and upsert legal chunks while keeping BM25 state in sync."""
        documents = [LegalChunk.from_dict(record) for record in records]
        if not documents or any(not doc.chunk_id or not doc.text for doc in documents):
            raise ValueError("Mỗi chunk phải có chunkId và text")

        await asyncio.to_thread(self._ensure_collection)
        vectors = await self.embeddings.embed([doc.text for doc in documents], "passage")
        points = [
            PointStruct(
                id=str(uuid5(NAMESPACE_URL, doc.chunk_id)),
                vector={self.settings.QDRANT_VECTOR_NAME: vector},
                payload=doc.payload(),
            )
            for doc, vector in zip(documents, vectors)
        ]
        await asyncio.to_thread(
            self.client.upsert,
            collection_name=self.settings.QDRANT_COLLECTION,
            points=points,
            wait=True,
        )

        merged = {doc.chunk_id: doc for doc in self.documents}
        merged.update({doc.chunk_id: doc for doc in documents})
        self.documents = list(merged.values())
        self.by_id = merged
        self.tokenized_documents = [
            VietnameseTextProcessor.tokens(doc.text) for doc in self.documents
        ]
        self.bm25 = BM25Okapi(self.tokenized_documents)
        self.dense_ready = True
        return len(points)

    async def _dense_search(self, query: str, category: str | None, limit: int) -> list[str]:
        vector = await self.embeddings.embed_one(query, "query")
        query_filter = None
        resolved = self._resolve_category(category)
        if resolved:
            query_filter = Filter(
                must=[FieldCondition(key="category", match=MatchValue(value=resolved))]
            )
        results = await asyncio.to_thread(
            self.client.search,
            collection_name=self.settings.QDRANT_COLLECTION,
            query_vector=NamedVector(
                name=self.settings.QDRANT_VECTOR_NAME,
                vector=vector,
            ),
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
        )
        ids: list[str] = []
        for item in results:
            if not item.payload:
                continue
            chunk_id = str(item.payload.get("chunkId", ""))
            if not chunk_id:
                continue
            # Qdrant chứa nhiều chunk hơn JSON local (vd HO_KINH_DOANH, CƯ TRÚ
            # không có file local) — dựng LegalChunk từ payload để _rrf resolve được,
            # nếu không chunk sẽ bị loại vì không có trong self.by_id.
            if chunk_id not in self.by_id:
                self.by_id[chunk_id] = LegalChunk.from_dict(item.payload)
            ids.append(chunk_id)
        return ids

    def _lexical_search(self, query: str, category: str | None, limit: int) -> list[str]:
        if not self.bm25:
            return []
        query_tokens = VietnameseTextProcessor.tokens(query)
        query_set = set(query_tokens)
        scores = self.bm25.get_scores(query_tokens)
        overlap = [len(query_set.intersection(tokens)) for tokens in self.tokenized_documents]
        ranked = sorted(
            range(len(scores)),
            key=lambda index: (float(scores[index]), overlap[index]),
            reverse=True,
        )
        want_category = self._canon_category(category) if category else None
        output: list[str] = []
        for index in ranked:
            # BM25 IDF có thể âm khi corpus cực nhỏ (demo chỉ có 1 chunk).
            if overlap[index] == 0:
                continue
            doc = self.documents[index]
            if want_category and self._canon_category(doc.category) != want_category:
                continue
            output.append(doc.chunk_id)
            if len(output) >= limit:
                break
        return output

    def _rrf(self, dense_ids: list[str], lexical_ids: list[str], top_k: int) -> list[LegalChunk]:
        k = self.settings.HYBRID_RRF_K
        dense_weight = self.settings.HYBRID_DENSE_WEIGHT
        lexical_weight = self.settings.HYBRID_LEXICAL_WEIGHT
        scores: dict[str, float] = {}

        for rank, chunk_id in enumerate(dense_ids, start=1):
            scores[chunk_id] = scores.get(chunk_id, 0.0) + dense_weight / (k + rank)
        for rank, chunk_id in enumerate(lexical_ids, start=1):
            scores[chunk_id] = scores.get(chunk_id, 0.0) + lexical_weight / (k + rank)

        max_score = (dense_weight + lexical_weight) / (k + 1)
        ranked = sorted(scores, key=lambda chunk_id: scores[chunk_id], reverse=True)[:top_k]
        return [
            replace(
                self.by_id[chunk_id],
                score=round(scores[chunk_id] / max_score, 3),
            )
            for chunk_id in ranked
            if chunk_id in self.by_id
        ]

    def _load_qdrant_categories(self) -> set[str]:
        """Lấy tập giá trị category thật đang lưu trong Qdrant (facet, fallback scroll)."""
        name = self.settings.QDRANT_COLLECTION
        try:
            if not self.client.collection_exists(name):
                return set()
            result = self.client.facet(collection_name=name, key="category", limit=100)
            values = {str(hit.value) for hit in result.hits if hit.value is not None}
            if values:
                return values
        except Exception as exc:
            logger.warning("Facet category thất bại, fallback scroll: %s", exc)

        # Fallback: scroll payload nếu server không hỗ trợ facet.
        values = set()
        try:
            offset = None
            for _ in range(20):  # tối đa 20 trang × 256 điểm
                points, offset = self.client.scroll(
                    collection_name=name,
                    limit=256,
                    with_payload=["category"],
                    with_vectors=False,
                    offset=offset,
                )
                for point in points:
                    category = (point.payload or {}).get("category")
                    if category:
                        values.add(str(category))
                if offset is None:
                    break
        except Exception as exc:
            logger.warning("Scroll category thất bại: %s", exc)
        return values

    def _ensure_collection(self) -> None:
        name = self.settings.QDRANT_COLLECTION
        if not self.client.collection_exists(name):
            self.client.create_collection(
                collection_name=name,
                vectors_config={
                    self.settings.QDRANT_VECTOR_NAME: VectorParams(
                        size=self.settings.QDRANT_VECTOR_SIZE,
                        distance=Distance.COSINE,
                    )
                },
            )
            self.client.create_payload_index(
                collection_name=name,
                field_name="category",
                field_schema=PayloadSchemaType.KEYWORD,
            )

    @staticmethod
    def _load_documents(directory: Path) -> list[LegalChunk]:
        if not directory.exists():
            return []
        documents: list[LegalChunk] = []
        for path in sorted(directory.rglob("*.json")):
            with path.open(encoding="utf-8") as file:
                data = json.load(file)
            records = data if isinstance(data, list) else [data]
            for record in records:
                doc = LegalChunk.from_dict(record)
                if doc.chunk_id and doc.text:
                    documents.append(doc)
        return documents
