"""
Lược đồ collection `legal_chunks` (Qdrant) — CHỐT theo DATABASE_DESIGN.md §3.

| Tham số       | Giá trị                                   |
|---------------|-------------------------------------------|
| Vector size   | 768 (sentence-transformers tiếng Việt)    |
| Distance      | Cosine                                    |
| Payload index | category (keyword) — filter theo nhóm TT  |

Point id của Qdrant phải là uint hoặc UUID. `chunkId` (chuỗi do nhóm đặt, vd
"luat-ho-tich-2014-dieu16-chunk1") được lưu trong payload, đồng thời derive
thành UUIDv5 ổn định để upsert idempotent (ingest lại không tạo trùng).
"""

from __future__ import annotations

import uuid
from enum import Enum

from pydantic import BaseModel, Field
from qdrant_client.models import Distance

# --- Hằng số collection ---
COLLECTION_NAME = "legal_chunks"
VECTOR_SIZE = 768
DISTANCE = Distance.COSINE

# Các trường được đánh index payload để filter nhanh (đều keyword).
# `category` lọc theo nhóm thủ tục; `status` lọc luật còn hiệu lực.
PAYLOAD_INDEX_FIELDS = ("category", "status")

# Giữ alias cũ cho tương thích ngược.
PAYLOAD_INDEX_FIELD = "category"

# Namespace cố định để sinh UUIDv5 từ chunkId (KHÔNG đổi giá trị này về sau,
# nếu đổi thì toàn bộ id point sẽ lệch và ingest cũ thành rác).
_CHUNK_ID_NAMESPACE = uuid.UUID("6b1f3a0e-7c2d-5e4a-9b8c-0d1e2f3a4b5c")


def point_id_for(chunk_id: str) -> str:
    """UUIDv5 ổn định cho 1 chunkId — dùng chung cho ingest & cập nhật status."""
    return str(uuid.uuid5(_CHUNK_ID_NAMESPACE, chunk_id))


class LegalCategory(str, Enum):
    """Nhóm thủ tục — khớp thư mục data/procedures/ và payload.category."""

    HO_TICH = "HO_TICH"
    CU_TRU = "CU_TRU"
    CHUNG_THUC = "CHUNG_THUC"
    CAP_DOI_GIAY_TO = "CAP_DOI_GIAY_TO"
    HO_KINH_DOANH = "HO_KINH_DOANH"


class LegalStatus(str, Enum):
    """
    Vòng đời hiệu lực của một chunk luật.

    Retrieval mặc định CHỈ lấy ACTIVE; bản cũ giữ lại (không xóa) để tra cứu
    lịch sử & audit, nhưng không lọt vào cảnh báo cho hồ sơ mới.
    """

    ACTIVE = "ACTIVE"          # còn hiệu lực
    SUPERSEDED = "SUPERSEDED"  # bị văn bản mới thay thế
    REPEALED = "REPEALED"      # đã hết hiệu lực, không thay thế


class LegalChunk(BaseModel):
    """
    Một chunk văn bản luật trước khi đưa vào Qdrant.

    `text` là nội dung dùng để embed; phần còn lại đi vào payload để citation.
    """

    chunkId: str = Field(..., description="Định danh chunk do nhóm ingest đặt")
    category: LegalCategory
    title: str = Field(..., description="Tên văn bản, vd 'Luật Hộ tịch 2014'")
    article: str = Field(..., description="Điều/khoản, vd 'Điều 16'")
    chapter: str | None = Field(default=None, description="Chương chứa điều, vd 'Chương II'")
    section: str | None = Field(default=None, description="Mục chứa điều, vd 'Mục 1. ĐĂNG KÝ KHAI SINH'")
    sourceVersion: str = Field(default="", description="Phiên bản căn cứ pháp lý")
    text: str = Field(..., min_length=1, description="Nội dung chunk (300-500 từ)")

    # --- Vòng đời hiệu lực (versioning) ---
    status: LegalStatus = Field(
        default=LegalStatus.ACTIVE, description="Trạng thái hiệu lực"
    )
    effectiveDate: str | None = Field(
        default=None, description="Ngày có hiệu lực (ISO YYYY-MM-DD)"
    )
    expiryDate: str | None = Field(
        default=None, description="Ngày hết hiệu lực (null nếu còn)"
    )
    supersededBy: str | None = Field(
        default=None, description="chunkId của bản thay thế (nếu bị thay thế)"
    )

    def point_id(self) -> str:
        """UUIDv5 ổn định từ chunkId → upsert idempotent."""
        return point_id_for(self.chunkId)

    def to_payload(self) -> dict:
        """Payload lưu kèm vector (giữ cả text để trả về khi citation)."""
        return {
            "chunkId": self.chunkId,
            "category": self.category.value,
            "title": self.title,
            "article": self.article,
            "chapter": self.chapter,
            "section": self.section,
            "sourceVersion": self.sourceVersion,
            "text": self.text,
            "status": self.status.value,
            "effectiveDate": self.effectiveDate,
            "expiryDate": self.expiryDate,
            "supersededBy": self.supersededBy,
        }
