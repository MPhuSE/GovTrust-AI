"""
Qwen VL OCR Service - Sử dụng Qwen Vision-Language model cho OCR
Dùng cho các loại giấy tờ không có VNPT API endpoint
"""

import base64
import json
import logging
import re
import time
from typing import Any

import httpx

from app.services.preprocess import is_pdf, pdf_to_images

logger = logging.getLogger(__name__)


def _detect_image_mime(data: bytes) -> str:
    """MIME theo magic byte. Trước đây hardcode image/jpeg → PDF/PNG bị gắn sai nhãn."""
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return "image/jpeg"


def _is_empty(value: Any) -> bool:
    """Field coi như rỗng khi None hoặc chuỗi trắng / '-' (Qwen hay trả '' khi không thấy)."""
    return value is None or (isinstance(value, str) and value.strip() in ("", "-"))


def _parse_qwen_json(content: str) -> dict[str, Any]:
    """Parse JSON từ output Qwen một cách khoan dung.

    Qwen trả 200 OK nhưng content hay lẫn text ngoài JSON (lời mở đầu, ```fence thiếu,
    trailing comma) → json.loads thẳng bị vỡ CHẬP CHỜN (lần lỗi 500, lần sau 200).
    Chiến lược nhiều tầng: bóc fence → cắt từ '{' đầu tới '}' cuối → gỡ trailing comma.
    """
    text = (content or "").strip()

    # 1) Bóc code fence nếu có (```json ... ``` hoặc ``` ... ```).
    if "```" in text:
        fenced = text.split("```", 2)
        if len(fenced) >= 2:
            body = fenced[1]
            if body.lstrip().lower().startswith("json"):
                body = body.lstrip()[4:]
            text = body.split("```")[0].strip()

    # 2) Thử parse thẳng.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 3) Cắt từ '{' đầu tiên tới '}' cuối cùng — bỏ mọi text mở đầu/kết thúc thừa.
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        candidate = text[start : end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            # 4) Gỡ trailing comma trước } hoặc ] rồi thử lần cuối.
            repaired = re.sub(r",\s*([}\]])", r"\1", candidate)
            return json.loads(repaired)

    raise ValueError(f"Không parse được JSON từ Qwen: {text[:200]!r}")


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
        Extract structured data from a document (image OR multi-page PDF) using Qwen VL.

        Qwen chỉ nhận ẢNH raster. Nếu input là PDF (giấy nhiều trang như hợp đồng
        chuyển nhượng, sổ đỏ scan), render TỪNG trang thành ảnh, OCR mỗi trang rồi
        HỢP NHẤT field (field điền trước thắng — trang đầu ưu tiên, trang sau bổ
        khuyết ô còn trống). Trước đây code gắn cứng data:image/jpeg cho mọi input
        nên PDF bị Qwen từ chối ("image format illegal") và chỉ đọc được 1 ảnh.

        Args:
            image: Bytes của ảnh (JPEG/PNG/WebP) hoặc PDF.
            document_type: Loại giấy (GIAY_CHUNG_NHAN_QSDD, HOP_DONG_CHUYEN_NHUONG, ...).
            http_client: Async HTTP client.

        Returns:
            Dict field bóc tách (đã hợp nhất nếu nhiều trang).
        """
        started = time.perf_counter()

        if is_pdf(image):
            pages = pdf_to_images(image)
            merged: dict[str, Any] = {}
            for page_no, page_bytes in enumerate(pages, start=1):
                page_fields = await self._extract_single(page_bytes, document_type, http_client)
                # Field điền trước thắng: chỉ nhận giá trị mới cho ô đang trống.
                for key, value in page_fields.items():
                    if _is_empty(merged.get(key)) and not _is_empty(value):
                        merged[key] = value
            processing_time = int((time.perf_counter() - started) * 1000)
            logger.info(
                f"Qwen OCR extracted {document_type} from PDF ({len(pages)} trang) "
                f"in {processing_time}ms",
                extra={
                    "document_type": document_type,
                    "processing_time_ms": processing_time,
                    "pdf_pages": len(pages),
                    "fields": len(merged),
                },
            )
            return merged

        extracted = await self._extract_single(image, document_type, http_client)
        processing_time = int((time.perf_counter() - started) * 1000)
        logger.info(
            f"Qwen OCR extracted {document_type} in {processing_time}ms",
            extra={"document_type": document_type, "processing_time_ms": processing_time}
        )
        return extracted

    async def _extract_single(
        self,
        image: bytes,
        document_type: str,
        http_client: httpx.AsyncClient,
    ) -> dict[str, Any]:
        """OCR một ảnh raster đơn (1 lượt gọi Qwen). PDF được tách trang ở extract()."""
        image_base64 = base64.b64encode(image).decode("utf-8")
        mime = _detect_image_mime(image)
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
                                "image_url": {"url": f"data:{mime};base64,{image_base64}"}
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

        # Parse khoan dung: Qwen 200 OK nhưng content hay lẫn text/fence thiếu/trailing comma
        # → trước json.loads thẳng vỡ chập chờn (lần 500, lần 200). Helper xử lý nhiều tầng.
        return _parse_qwen_json(content)

    def _get_prompt(self, document_type: str) -> str:
        """Get extraction prompt for document type"""

        prompts = {
            "GIAY_CHUNG_SINH": """Đọc Giấy chứng sinh (do cơ sở y tế cấp) này và trích xuất thông tin:

Trả về JSON:
{
  "hoTenCon": "Họ tên con (nếu chưa đặt tên thì để trống)",
  "ngaySinhCon": "Ngày sinh của con (dd/mm/yyyy)",
  "gioiTinhCon": "Giới tính con (Nam/Nữ)",
  "canNang": "Cân nặng khi sinh",
  "noiSinh": "Nơi sinh (tên cơ sở y tế)",
  "hoTenMe": "Họ tên mẹ",
  "namSinhMe": "Năm sinh mẹ",
  "hoTenCha": "Họ tên cha",
  "namSinhCha": "Năm sinh cha",
  "so": "Số giấy chứng sinh"
}

CHỈ trả JSON, KHÔNG giải thích.""",

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
  "tenNguoiUyQuyen": "Họ tên người ủy quyền (bên giao ủy quyền — chủ hộ hiện tại)",
  "tenNguoiDuocUyQuyen": "Họ tên người được ủy quyền (bên nhận — chủ hộ mới)",
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

            "HOP_DONG_CHUYEN_NHUONG": """Đọc hợp đồng chuyển nhượng quyền sử dụng đất và trích xuất thông tin.
Thông tin thửa đất thường ở Điều 1 (mô tả tài sản), thông tin giao dịch ở Điều 2 (giá).
Trường nào hợp đồng KHÔNG ghi thì để chuỗi rỗng "" — KHÔNG bịa.

Trả về JSON:
{
  "benChuyenNhuong": "Họ tên bên chuyển nhượng (bên bán)",
  "benNhanChuyenNhuong": "Họ tên bên nhận chuyển nhượng (bên mua)",
  "diaChiThuaDat": "Địa chỉ/vị trí thửa đất",
  "thuaDatSo": "Số thửa đất",
  "toBanDoSo": "Số tờ bản đồ",
  "dienTich": "Diện tích chuyển nhượng (m2)",
  "mucDichSuDung": "Mục đích sử dụng đất (vd: Đất ở, Đất trồng cây lâu năm)",
  "thoiHanSuDung": "Thời hạn sử dụng đất (vd: Lâu dài)",
  "nguonGocSuDung": "Nguồn gốc sử dụng đất (vd: Nhà nước giao đất có thu tiền, Nhận chuyển nhượng)",
  "giaChuyenNhuong": "Giá chuyển nhượng",
  "ngayKy": "Ngày ký hợp đồng (dd/mm/yyyy)",
  "noiCongChung": "Nơi công chứng/chứng thực",
  "loaiCongTrinh": "Loại nhà ở/công trình gắn liền với đất (nếu có)",
  "soTangCao": "Số tầng công trình (nếu có)",
  "chieuCaoToiDa": "Chiều cao tối đa công trình (nếu có)",
  "matDoXayDung": "Mật độ xây dựng (nếu có)",
  "chiTieuKhac": "Các chỉ tiêu quy hoạch khác (nếu có)"
}

CHỈ trả JSON, KHÔNG giải thích.""",
        }

        return prompts.get(document_type, """Đọc giấy tờ này và trích xuất tất cả thông tin quan trọng dưới dạng JSON. CHỈ trả JSON, KHÔNG giải thích.""")
