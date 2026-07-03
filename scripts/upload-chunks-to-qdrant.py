#!/usr/bin/env python3
"""
Upload JSON chunks to Qdrant vector database
Embeds text using keepitreal/vietnamese-sbert and uploads with metadata
Matches the schema used by ai-svc HybridLegalSearch
"""

import json
import sys
from pathlib import Path
from typing import List, Dict
from uuid import NAMESPACE_URL, uuid5

try:
    from sentence_transformers import SentenceTransformer
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct
except ImportError:
    print("❌ Missing dependencies. Install:")
    print("   pip install sentence-transformers qdrant-client")
    sys.exit(1)

# Paths
ROOT = Path(__file__).resolve().parents[1]
CHUNKS_DIR = ROOT / "data" / "legal-sources" / "chunks"

# Qdrant config (from ai-svc config.py)
QDRANT_URL = "http://45.130.164.249:6333"
QDRANT_API_KEY = "ac22aa199d489086671f902e702242a54de2ded69997c8c7"
QDRANT_COLLECTION = "legal_chunks"
QDRANT_VECTOR_NAME = "dense"  # Named vector
VECTOR_SIZE = 768

# Embedding model (must match ai-svc)
MODEL_NAME = "keepitreal/vietnamese-sbert"


def load_chunks_from_json(json_file: Path) -> List[Dict]:
    """Load chunks from JSON file"""
    with open(json_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def embed_chunks(chunks: List[Dict], model: SentenceTransformer) -> List[Dict]:
    """Embed text using sentence-transformers"""
    texts = [chunk['text'] for chunk in chunks]

    print(f"  🧠 Embedding {len(texts)} chunks...")
    embeddings = model.encode(texts, show_progress_bar=False)

    # Attach embeddings to chunks
    for chunk, embedding in zip(chunks, embeddings):
        chunk['vector'] = embedding.tolist()

    return chunks


def upload_to_qdrant(chunks: List[Dict], client: QdrantClient):
    """Upload chunks to Qdrant collection with named vector"""
    points = []

    for chunk in chunks:
        # Generate UUID for point ID (same as ai-svc)
        point_id = str(uuid5(NAMESPACE_URL, chunk['chunkId']))

        # Create payload (must match LegalChunk.payload())
        payload = {
            "chunkId": chunk['chunkId'],
            "text": chunk['text'],
            "title": chunk['title'],
            "article": chunk['article'],
            "url": chunk['url'],
            "sourceVersion": chunk['sourceVersion'],
            "category": chunk['category'],
        }

        # Create point with NAMED vector
        point = PointStruct(
            id=point_id,
            vector={QDRANT_VECTOR_NAME: chunk['vector']},  # Named vector!
            payload=payload
        )
        points.append(point)

    # Batch upload
    print(f"  📤 Uploading {len(points)} points to Qdrant...")
    client.upsert(
        collection_name=QDRANT_COLLECTION,
        points=points,
        wait=True
    )

    return len(points)


def ensure_collection_exists(client: QdrantClient):
    """Create collection if not exists (with named vector config)"""
    collections = client.get_collections().collections
    collection_names = [c.name for c in collections]

    if QDRANT_COLLECTION not in collection_names:
        print(f"  🔧 Creating collection: {QDRANT_COLLECTION}")
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config={
                QDRANT_VECTOR_NAME: VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
            }
        )
    else:
        print(f"  ✅ Collection exists: {QDRANT_COLLECTION}")


def main():
    print("🚀 Uploading legal chunks to Qdrant\n")

    # Load embedding model
    print(f"📦 Loading embedding model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    print("  ✅ Model loaded\n")

    # Connect to Qdrant
    print(f"🔌 Connecting to Qdrant: {QDRANT_URL}")
    client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
    )

    # Ensure collection exists
    ensure_collection_exists(client)
    print()

    # Find all JSON files
    json_files = list(CHUNKS_DIR.glob("*.json"))

    if not json_files:
        print(f"❌ No JSON files found in {CHUNKS_DIR}")
        return

    print(f"📁 Found {len(json_files)} JSON files\n")

    total_uploaded = 0

    # Process each JSON file
    for json_file in json_files:
        print(f"📄 Processing: {json_file.name}")

        # Load chunks
        chunks = load_chunks_from_json(json_file)
        print(f"  📋 Loaded {len(chunks)} chunks")

        # Embed chunks
        chunks_with_vectors = embed_chunks(chunks, model)

        # Upload to Qdrant
        uploaded = upload_to_qdrant(chunks_with_vectors, client)
        total_uploaded += uploaded

        print(f"  ✅ Uploaded {uploaded} chunks\n")

    # Final stats
    collection_info = client.get_collection(QDRANT_COLLECTION)
    print(f"✅ Done! Total uploaded: {total_uploaded}")
    print(f"📊 Collection stats:")
    print(f"   - Total points: {collection_info.points_count}")


if __name__ == "__main__":
    main()
