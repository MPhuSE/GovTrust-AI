"""
Script khởi tạo Qdrant collection và ingest văn bản pháp luật.
Chạy: python -m app.vector_db.qdrant_setup
"""

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PayloadSchemaType
from sentence_transformers import SentenceTransformer
from app.config import settings
import json
import os


def setup_collection():
    client = QdrantClient(url=settings.QDRANT_URL)

    if not client.collection_exists(settings.QDRANT_COLLECTION):
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=settings.QDRANT_VECTOR_SIZE,
                distance=Distance.COSINE,
            ),
        )
        # Payload index để filter nhanh theo category
        client.create_payload_index(
            collection_name=settings.QDRANT_COLLECTION,
            field_name="category",
            field_schema=PayloadSchemaType.KEYWORD,
        )
        print(f"Collection '{settings.QDRANT_COLLECTION}' created.")
    else:
        print(f"Collection '{settings.QDRANT_COLLECTION}' already exists.")


def ingest_legal_sources():
    client = QdrantClient(url=settings.QDRANT_URL)
    embedder = SentenceTransformer("intfloat/multilingual-e5-base")

    chunks_dir = os.path.join(os.path.dirname(__file__), "../../../data/legal-sources/chunks")
    if not os.path.exists(chunks_dir):
        print("No legal chunks found. Skipping ingest.")
        return

    points = []
    for fname in os.listdir(chunks_dir):
        if not fname.endswith(".json"):
            continue
        with open(os.path.join(chunks_dir, fname)) as f:
            chunk = json.load(f)

        vector = embedder.encode(f"passage: {chunk['text']}", normalize_embeddings=True).tolist()
        points.append({
            "id": chunk["chunkId"],
            "vector": vector,
            "payload": {
                "chunkId": chunk["chunkId"],
                "category": chunk["category"],
                "title": chunk["title"],
                "article": chunk.get("article", ""),
                "url": chunk.get("url", ""),
                "sourceVersion": chunk.get("sourceVersion", ""),
                "text": chunk["text"],
            },
        })

    if points:
        client.upsert(collection_name=settings.QDRANT_COLLECTION, points=points)
        print(f"Ingested {len(points)} legal chunks into Qdrant.")


if __name__ == "__main__":
    setup_collection()
    ingest_legal_sources()
