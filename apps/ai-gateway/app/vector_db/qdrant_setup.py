"""
Khởi tạo collection `legal_chunks` trên Qdrant (idempotent).

Chạy:
    python -m app.vector_db.qdrant_setup            # tạo nếu chưa có
    python -m app.vector_db.qdrant_setup --force    # xóa & tạo lại (mất data!)

Việc tạo collection chỉ cần qdrant-client, KHÔNG load embedding model.
"""

from __future__ import annotations

import argparse
import logging

from qdrant_client.models import PayloadSchemaType, VectorParams

from app.vector_db.client import get_qdrant_client
from app.vector_db.schema import (
    COLLECTION_NAME,
    DISTANCE,
    PAYLOAD_INDEX_FIELDS,
    VECTOR_SIZE,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("qdrant_setup")


def setup_collection(force: bool = False) -> None:
    """Tạo collection + payload index. Idempotent; --force để recreate."""
    client = get_qdrant_client()
    exists = client.collection_exists(COLLECTION_NAME)

    if exists and force:
        logger.warning("Xóa collection '%s' (force)...", COLLECTION_NAME)
        client.delete_collection(COLLECTION_NAME)
        exists = False

    if exists:
        logger.info("Collection '%s' đã tồn tại — bỏ qua tạo mới.", COLLECTION_NAME)
    else:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=DISTANCE),
        )
        logger.info(
            "Đã tạo collection '%s' (size=%d, distance=%s).",
            COLLECTION_NAME,
            VECTOR_SIZE,
            DISTANCE,
        )

    # Payload index keyword cho category + status — idempotent, gọi lại không sao.
    for field in PAYLOAD_INDEX_FIELDS:
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name=field,
            field_schema=PayloadSchemaType.KEYWORD,
        )
        logger.info("Đã đảm bảo payload index trên '%s'.", field)

    info = client.get_collection(COLLECTION_NAME)
    logger.info("Hoàn tất. points_count=%s", info.points_count)


def main() -> None:
    parser = argparse.ArgumentParser(description="Setup Qdrant legal_chunks collection")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Xóa và tạo lại collection (mất toàn bộ data hiện có)",
    )
    args = parser.parse_args()
    setup_collection(force=args.force)


if __name__ == "__main__":
    main()
