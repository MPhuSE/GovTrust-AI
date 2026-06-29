"""
Factory tạo QdrantClient dùng chung (đọc cấu hình từ settings).

Tách riêng để dễ mock trong test và đổi backend (local/cloud) qua env.
"""

from __future__ import annotations

from functools import lru_cache

from qdrant_client import QdrantClient

from app.config import get_settings


@lru_cache
def get_qdrant_client() -> QdrantClient:
    """QdrantClient singleton từ QDRANT_URL (hoặc host/port) + API key (nếu có)."""
    settings = get_settings()
    return QdrantClient(
        url=settings.resolved_qdrant_url,
        api_key=settings.qdrant_api_key or None,
        prefer_grpc=False,
        timeout=30.0,
        # Bỏ cảnh báo lệch phiên bản client/server (chỉ cần server >= 1.10 để có
        # query_points). Image trong docker-compose đã pin v1.12.4.
        check_compatibility=False,
    )
