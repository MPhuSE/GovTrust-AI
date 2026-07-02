#!/usr/bin/env python3
"""Ingest ALL legal chunks into a (possibly remote) Qdrant collection.

Embeds locally with keepitreal/vietnamese-sbert (768-d) — the canonical model
for legal_chunks — and upserts under the named vector `dense`. Creates the
collection + `category` payload index if missing. Authenticates with
QDRANT_API_KEY when set, so it works against the remote server too.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PayloadSchemaType,
    PointStruct,
    VectorParams,
)
from sentence_transformers import SentenceTransformer


ROOT = Path(__file__).resolve().parents[1]
CHUNKS_DIR = ROOT / "data" / "legal-sources" / "chunks"
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "") or None
COLLECTION = os.getenv("QDRANT_COLLECTION", "legal_chunks")
VECTOR_NAME = os.getenv("QDRANT_VECTOR_NAME", "dense")
VECTOR_SIZE = int(os.getenv("QDRANT_VECTOR_SIZE", "768"))
MODEL_NAME = os.getenv("LEGAL_EMBEDDING_MODEL", "keepitreal/vietnamese-sbert")


def load_chunks() -> list[dict]:
    by_id: dict[str, dict] = {}
    for path in sorted(CHUNKS_DIR.rglob("*.json")):
        with path.open(encoding="utf-8") as file:
            data = json.load(file)
        for payload in data if isinstance(data, list) else [data]:
            chunk_id = payload.get("chunkId")
            text = payload.get("text")
            if chunk_id and text:
                by_id[chunk_id] = payload
    chunks = list(by_id.values())
    if not chunks:
        raise RuntimeError(f"Không tìm thấy legal chunk nào trong {CHUNKS_DIR}")
    return chunks


def ensure_collection(client: QdrantClient) -> None:
    if not client.collection_exists(COLLECTION):
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config={
                VECTOR_NAME: VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
            },
        )
        client.create_payload_index(
            collection_name=COLLECTION,
            field_name="category",
            field_schema=PayloadSchemaType.KEYWORD,
        )
        print(f"Đã tạo collection '{COLLECTION}' (vector '{VECTOR_NAME}', {VECTOR_SIZE}d, COSINE)")
    else:
        print(f"Collection '{COLLECTION}' đã tồn tại — upsert vào collection hiện có")


def main() -> None:
    client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        timeout=120,
    )
    chunks = load_chunks()
    for chunk in chunks:
        chunk["embeddingModel"] = MODEL_NAME

    print(f"Nạp {len(chunks)} chunk → {QDRANT_URL} (model {MODEL_NAME})")
    model = SentenceTransformer(MODEL_NAME, device="cpu")
    dim = model.get_sentence_embedding_dimension()
    if dim != VECTOR_SIZE:
        raise RuntimeError(f"Model trả {dim} chiều, nhưng QDRANT_VECTOR_SIZE={VECTOR_SIZE}")

    vectors = model.encode(
        [chunk["text"] for chunk in chunks],
        normalize_embeddings=True,
        convert_to_numpy=True,
        batch_size=32,
        show_progress_bar=True,
    )

    ensure_collection(client)
    points = [
        PointStruct(
            id=str(uuid5(NAMESPACE_URL, chunk["chunkId"])),
            vector={VECTOR_NAME: vector.tolist()},
            payload=chunk,
        )
        for chunk, vector in zip(chunks, vectors)
    ]
    client.upsert(collection_name=COLLECTION, points=points, wait=True)

    total = client.count(collection_name=COLLECTION, exact=True).count
    print(json.dumps({"upserted": len(points), "totalInCollection": total}, ensure_ascii=False))


if __name__ == "__main__":
    main()
