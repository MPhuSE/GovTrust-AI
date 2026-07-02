#!/usr/bin/env python3
"""Remove land-law points and upsert current MVP legal chunks into Qdrant."""

from __future__ import annotations

import json
import os
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

# Force Transformers to use PyTorch; host environments may also have Keras 3.
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")

from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, FilterSelector, MatchValue, PointStruct
from sentence_transformers import SentenceTransformer


ROOT = Path(__file__).resolve().parents[1]
CHUNKS_DIR = ROOT / "data" / "legal-sources" / "chunks"
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION = os.getenv("QDRANT_COLLECTION", "legal_chunks")
# Existing legal_chunks vectors were built with this 768-dimensional model.
MODEL_NAME = os.getenv("LEGAL_EMBEDDING_MODEL", "keepitreal/vietnamese-sbert")


def count_category(client: QdrantClient, category: str) -> int:
    result = client.count(
        collection_name=COLLECTION,
        count_filter=Filter(
            must=[FieldCondition(key="category", match=MatchValue(value=category))]
        ),
        exact=True,
    )
    return int(result.count)


def load_household_business_chunks() -> list[dict]:
    chunks_by_id: dict[str, dict] = {}
    for path in sorted(CHUNKS_DIR.rglob("*.json")):
        with path.open(encoding="utf-8") as file:
            data = json.load(file)
        records = data if isinstance(data, list) else [data]
        for payload in records:
            if payload.get("category") == "HO_KINH_DOANH":
                chunks_by_id[payload["chunkId"]] = payload
    chunks = list(chunks_by_id.values())
    if not chunks:
        raise RuntimeError("Không tìm thấy legal chunk HO_KINH_DOANH để ingest")
    return chunks


def main() -> None:
    client = QdrantClient(url=QDRANT_URL, timeout=60, check_compatibility=False)
    chunks = load_household_business_chunks()
    for chunk in chunks:
        chunk["embeddingModel"] = MODEL_NAME
    model = SentenceTransformer(MODEL_NAME, device="cpu")
    dimension = model.get_embedding_dimension()
    if dimension != 768:
        raise RuntimeError(f"Embedding model trả {dimension} chiều, cần đúng 768")
    vectors = model.encode(
        [chunk["text"] for chunk in chunks],
        normalize_embeddings=True,
        convert_to_numpy=True,
        batch_size=32,
        show_progress_bar=False,
    )
    vector_config = client.get_collection(COLLECTION).config.params.vectors
    vector_name = next(iter(vector_config)) if isinstance(vector_config, dict) else None
    points = [
        PointStruct(
            id=str(uuid5(NAMESPACE_URL, chunk["chunkId"])),
            vector={vector_name: vector.tolist()} if vector_name else vector.tolist(),
            payload=chunk,
        )
        for chunk, vector in zip(chunks, vectors)
    ]

    # Prepare and validate embeddings before mutating the collection.
    before_land = count_category(client, "DAT_DAI")
    before_household_business = count_category(client, "HO_KINH_DOANH")
    client.delete(
        collection_name=COLLECTION,
        points_selector=FilterSelector(
            filter=Filter(
                must=[FieldCondition(key="category", match=MatchValue(value="DAT_DAI"))]
            )
        ),
        wait=True,
    )
    client.delete(
        collection_name=COLLECTION,
        points_selector=FilterSelector(
            filter=Filter(
                must=[
                    FieldCondition(
                        key="category", match=MatchValue(value="HO_KINH_DOANH")
                    )
                ]
            )
        ),
        wait=True,
    )
    client.upsert(collection_name=COLLECTION, points=points, wait=True)

    print(
        json.dumps(
            {
                "deletedDatDai": before_land,
                "remainingDatDai": count_category(client, "DAT_DAI"),
                "replacedHoKinhDoanh": before_household_business,
                "upsertedHoKinhDoanh": len(points),
                "totalHoKinhDoanh": count_category(client, "HO_KINH_DOANH"),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
