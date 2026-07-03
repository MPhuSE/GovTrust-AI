"""
Qwen VL OCR Service - Sử dụng Qwen Vision-Language model cho OCR
Dùng cho các loại giấy tờ không có VNPT API endpoint
"""

import base64
import json
import logging
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class QwenOcrService:
    """Qwen Vision-Language OCR service for documents without VNPT endpoints"""

    def __init__(self, api_key: str, base_url: str = "https://api.shopaikey.com/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.model = "qwen3-vl-plus"

    async def extract(
        self,
        image: bytes,
        document_type: str,
        http_client: httpx.AsyncClient,
    ) -> dict[str, Any]:
        """
        Extract structured data from image using Qwen VL

        Args:
            image: Image bytes
            document_type: Type of document (GIAY_CHUNG_NHAN_QSDD, VAN_BAN_UY_QUYEN_HGD, etc.)
            http_client: Async HTTP client

        Returns:
            Dict with extracted fields
        """
        started = time.perf_counter()
        image_base64 = base64.b64encode(image).decode("utf-8")

        prompt = self._get_prompt(document_type)

        response = await http_client.post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                            }
                        ]
                    }
                ],
                "max_tokens": 1500,
                "temperature": 0.1
            },
            timeout=60.0
        )

        response.raise_for_status()
        result = response.json()
        content = result["choices"][0]["message"]["content"]

        # Parse JSON from response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        extracted = json.loads(content)
        processing_time = int((time.perf_counter() - started) * 1000)

        logger.info(
            f"Qwen OCR extracted {document_type} in {processing_time}ms",
            extra={"document_type": document_type, "processing_time_ms": processing_time}
        )

        return extracted

    def _get_prompt(self, document_type: str) -> str:
        """Get extraction prompt for document type"""

        prompts = {
            "GIAY_CHUNG_NHAN_QSDD": """Đọc Giấy chứng nhận quyền sử dụng đất (sổ đỏ) này và trích xuất thông tin:

Trả về JSON:
{
  "tenChuSoHuu": "Họ tên người được cấp (nhiều người nối bằng dấu phẩy)",
  "soCCCD": "Số CCCD/CMND",
  "diaChiThuongTru": "Địa chỉ thường trú",
  "diaChiNha": "Địa chỉ thửa đất",
  "dienTich": "Diện tích",
  "soGiayChungNhan": "Số giấy chứng nhận",
  "soThua": "Số thửa",
  "soTo": "Số tờ bản đồ"
}

CHỈ trả JSON, KHÔNG giải thích.""",

            "VAN_BAN_UY_QUYEN_HGD": """Đọc văn bản ủy quyền của các thành viên hộ gia đình và trích xuất thông tin:

Trả về JSON:
{
  "tenNguoiDuocUyQuyen": "Họ tên người được ủy quyền",
  "tenHoKinhDoanh": "Tên hộ kinh doanh",
  "ngayUyQuyen": "Ngày ủy quyền (dd/mm/yyyy)",
  "noiCongChung": "Nơi công chứng/chứng thực"
}

CHỈ trả JSON, KHÔNG giải thích.""",

            "VAN_BAN_UY_QUYEN_THU_TUC": """Đọc văn bản ủy quyền thực hiện thủ tục và trích xuất thông tin:

Trả về JSON:
{
  "tenNguoiUyQuyen": "Họ tên người ủy quyền",
  "tenNguoiDuocUyQuyen": "Họ tên người được ủy quyền",
  "noiDung": "Nội dung ủy quyền",
  "ngayUyQuyen": "Ngày ủy quyền (dd/mm/yyyy)"
}

CHỈ trả JSON, KHÔNG giải thích.""",

            "HOP_DONG_CHUYEN_NHUONG": """Đọc hợp đồng chuyển nhượng quyền sử dụng đất và trích xuất thông tin:

Trả về JSON:
{
  "benChuyenNhuong": "Họ tên bên chuyển nhượng",
  "benNhanChuyenNhuong": "Họ tên bên nhận chuyển nhượng",
  "diaChiThuaDat": "Địa chỉ thửa đất",
  "dienTich": "Diện tích chuyển nhượng",
  "giaChuyenNhuong": "Giá chuyển nhượng",
  "ngayKy": "Ngày ký hợp đồng (dd/mm/yyyy)",
  "noiCongChung": "Nơi công chứng"
}

CHỈ trả JSON, KHÔNG giải thích.""",
        }

        return prompts.get(document_type, """Đọc giấy tờ này và trích xuất tất cả thông tin quan trọng dưới dạng JSON. CHỈ trả JSON, KHÔNG giải thích.""")
