"""
Đánh dấu một chunk luật là hết hiệu lực / bị thay thế (KHÔNG xóa).

Dùng khi luật cập nhật: bản cũ chuyển sang SUPERSEDED/REPEALED để retrieval
mặc định (status=ACTIVE) bỏ qua, nhưng vẫn giữ lại trong Qdrant để tra cứu
lịch sử & audit.

Chạy:
    # Bị thay thế bởi văn bản mới
    python -m app.vector_db.mark_superseded luat-cu-tru-2006-dieu20-chunk1 \
        --by luat-cu-tru-2020-dieu20-chunk1 --expiry 2021-07-01

    # Hết hiệu lực, không có bản thay thế
    python -m app.vector_db.mark_superseded <chunkId> --status REPEALED --expiry 2025-01-01

Quy trình cập nhật luật khuyến nghị:
    1. Thêm file chunk bản mới (chunkId có version mới) → `python -m app.vector_db.ingest`
    2. Đánh dấu bản cũ bằng script này
"""

from __future__ import annotations

import argparse
import logging

from app.vector_db.client import get_qdrant_client
from app.vector_db.schema import COLLECTION_NAME, LegalStatus, point_id_for

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("mark_superseded")


def mark(
    chunk_id: str,
    status: LegalStatus = LegalStatus.SUPERSEDED,
    superseded_by: str | None = None,
    expiry_date: str | None = None,
) -> None:
    """Cập nhật status/supersededBy/expiryDate của 1 point (theo chunkId)."""
    client = get_qdrant_client()
    pid = point_id_for(chunk_id)

    # Xác nhận point tồn tại để báo lỗi rõ ràng thay vì âm thầm no-op.
    found = client.retrieve(collection_name=COLLECTION_NAME, ids=[pid])
    if not found:
        raise RuntimeError(
            f"Không tìm thấy chunk '{chunk_id}' trong '{COLLECTION_NAME}'. "
            f"Đã ingest đúng chunkId chưa?"
        )

    payload = {"status": status.value}
    if superseded_by is not None:
        payload["supersededBy"] = superseded_by
    if expiry_date is not None:
        payload["expiryDate"] = expiry_date

    # set_payload chỉ ghi đè các key truyền vào, giữ nguyên vector + field khác.
    client.set_payload(
        collection_name=COLLECTION_NAME, payload=payload, points=[pid], wait=True
    )
    logger.info("Đã cập nhật '%s' → status=%s %s", chunk_id, status.value, payload)


def main() -> None:
    parser = argparse.ArgumentParser(description="Đánh dấu chunk luật hết hiệu lực")
    parser.add_argument("chunk_id", help="chunkId bản cũ cần đánh dấu")
    parser.add_argument(
        "--status",
        choices=[LegalStatus.SUPERSEDED.value, LegalStatus.REPEALED.value],
        default=LegalStatus.SUPERSEDED.value,
        help="SUPERSEDED (bị thay thế) hoặc REPEALED (hết hiệu lực)",
    )
    parser.add_argument("--by", dest="superseded_by", help="chunkId bản thay thế")
    parser.add_argument("--expiry", dest="expiry_date", help="Ngày hết hiệu lực YYYY-MM-DD")
    args = parser.parse_args()

    mark(
        chunk_id=args.chunk_id,
        status=LegalStatus(args.status),
        superseded_by=args.superseded_by,
        expiry_date=args.expiry_date,
    )


if __name__ == "__main__":
    main()
