"""
Ingest văn bản luật vào Qdrant `legal_chunks`.

Chạy:
    python -m app.vector_db.ingest                       # nguồn mặc định
    python -m app.vector_db.ingest path/to/chunks.json   # nguồn chỉ định

Định dạng nguồn: file JSON (mảng) hoặc JSONL (mỗi dòng 1 object), hoặc 1 thư
mục chứa các file .json/.jsonl. Mỗi object khớp LegalChunk:
    { "chunkId", "category", "title", "article", "url", "sourceVersion", "text" }

BẢO MẬT: chỉ pipeline ingest (do nhóm kiểm soát) mới được upsert — người dùng
KHÔNG BAO GIỜ ghi vào Qdrant (chống RAG injection).
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

from qdrant_client.models import PointStruct
from pydantic import ValidationError

from app.vector_db.client import get_qdrant_client
from app.vector_db.embeddings import get_embedding_service
from app.vector_db.schema import COLLECTION_NAME, LegalChunk

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("ingest")

# Nguồn mặc định: data/legal-sources/chunks/ ở gốc repo.
_DEFAULT_SOURCE = (
    Path(__file__).resolve().parents[4] / "data" / "legal-sources" / "chunks"
)


def _iter_records(source: Path):
    """Đọc record từ file/thư mục .json (mảng) hoặc .jsonl (từng dòng)."""
    files: list[Path]
    if source.is_dir():
        files = sorted([*source.glob("*.json"), *source.glob("*.jsonl")])
    else:
        files = [source]

    if not files:
        raise FileNotFoundError(f"Không tìm thấy file nguồn tại: {source}")

    for fp in files:
        text = fp.read_text(encoding="utf-8").strip()
        if not text:
            continue
        if fp.suffix == ".jsonl":
            for line in text.splitlines():
                line = line.strip()
                if line:
                    yield json.loads(line)
        else:
            data = json.loads(text)
            if isinstance(data, list):
                yield from data
            else:
                yield data


def load_chunks(source: Path) -> list[LegalChunk]:
    """Parse + validate tất cả chunk từ nguồn."""
    chunks: list[LegalChunk] = []
    for i, rec in enumerate(_iter_records(source)):
        try:
            chunks.append(LegalChunk(**rec))
        except ValidationError as e:
            logger.error("Record #%d không hợp lệ, bỏ qua: %s", i, e)
    return chunks


def ingest(source: Path | None = None, batch_size: int = 64) -> int:
    """Embed + upsert chunk vào Qdrant. Trả về số chunk đã ingest."""
    source = source or _DEFAULT_SOURCE
    client = get_qdrant_client()

    if not client.collection_exists(COLLECTION_NAME):
        raise RuntimeError(
            f"Collection '{COLLECTION_NAME}' chưa tồn tại. "
            f"Chạy `python -m app.vector_db.qdrant_setup` trước."
        )

    chunks = load_chunks(source)
    if not chunks:
        logger.warning("Không có chunk nào để ingest từ %s", source)
        return 0

    logger.info("Đang embed %d chunk...", len(chunks))
    embedder = get_embedding_service()
    vectors = embedder.embed_batch([c.text for c in chunks])

    points = [
        PointStruct(id=c.point_id(), vector=v, payload=c.to_payload())
        for c, v in zip(chunks, vectors)
    ]

    for start in range(0, len(points), batch_size):
        batch = points[start : start + batch_size]
        client.upsert(collection_name=COLLECTION_NAME, points=batch, wait=True)
        logger.info("Upsert %d/%d", min(start + batch_size, len(points)), len(points))

    total = client.get_collection(COLLECTION_NAME).points_count
    logger.info("Hoàn tất ingest %d chunk. Tổng points_count=%s", len(points), total)
    return len(points)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest legal chunks vào Qdrant")
    parser.add_argument(
        "source",
        nargs="?",
        default=None,
        help="File/thư mục JSON hoặc JSONL (mặc định: data/legal-sources/chunks/)",
    )
    args = parser.parse_args()
    ingest(Path(args.source) if args.source else None)


if __name__ == "__main__":
    main()
