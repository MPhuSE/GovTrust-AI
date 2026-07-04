import logging

import httpx

from app.config import Settings
from app.text import VietnameseTextProcessor


logger = logging.getLogger(__name__)

# Thứ tự QUAN TRỌNG: keyword_fallback trả match ĐẦU TIÊN, nên cụm cụ thể phải đứng
# trước cụm chung (vd "thay đổi hộ kinh doanh" trước "hộ kinh doanh").
# 3 thủ tục MVP: đăng ký thường trú + thay đổi chủ hộ kinh doanh + chuyển nhượng QSDĐ.
PROCEDURE_KEYWORDS: dict[str, str] = {
    "đăng ký thường trú": "DK_THUONG_TRU",
    "nhập hộ khẩu": "DK_THUONG_TRU",
    "nhập khẩu": "DK_THUONG_TRU",
    "thường trú": "DK_THUONG_TRU",
    "cư trú": "DK_THUONG_TRU",
    "chuyển nhượng quyền sử dụng đất": "CHUYEN_NHUONG_QSDD",
    "chuyển nhượng đất": "CHUYEN_NHUONG_QSDD",
    "chuyển nhượng qsdđ": "CHUYEN_NHUONG_QSDD",
    "sang tên sổ đỏ": "CHUYEN_NHUONG_QSDD",
    "sang tên đất": "CHUYEN_NHUONG_QSDD",
    "thay đổi chủ hộ kinh doanh": "HKD_THAY_DOI",
    "thay đổi hộ kinh doanh": "HKD_THAY_DOI",
    "thay đổi đăng ký kinh doanh": "HKD_THAY_DOI",
    "thay đổi chủ hộ": "HKD_THAY_DOI",
    "hộ kinh doanh": "HKD_THAY_DOI",
    "khai sinh": "DANG_KY_KHAI_SINH",
    "làm giấy khai sinh": "DANG_KY_KHAI_SINH",
    "đăng ký khai sinh": "DANG_KY_KHAI_SINH",
}


class HoSoBotService:
    def __init__(self, settings: Settings, http: httpx.AsyncClient):
        self.settings = settings
        self.http = http

    async def identify(self, query: str, session_id: str | None = None) -> dict:
        if self.settings.VNPT_SMARTBOT_BASE_URL and self.settings.VNPT_SMARTBOT_API_KEY:
            try:
                response = await self.http.post(
                    f"{self.settings.VNPT_SMARTBOT_BASE_URL.rstrip('/')}/api/v1/chat",
                    headers={"Authorization": f"Bearer {self.settings.VNPT_SMARTBOT_API_KEY}"},
                    json={"message": query, "session_id": session_id},
                    timeout=20,
                )
                response.raise_for_status()
                result = response.json()
                result["intent"] = result.get("intent") or self.keyword_fallback(query)
                return result
            except httpx.HTTPError as exc:
                logger.warning("SmartBot lỗi, dùng Vietnamese keyword fallback: %s", exc)

        code = self.keyword_fallback(query)
        return {
            "intent": code,
            "confidence": 0.55 if code else 0.0,
            "message": "" if code else "Vui lòng chọn thủ tục phù hợp từ danh sách.",
            "suggestions": [],
        }

    @staticmethod
    def keyword_fallback(query: str) -> str | None:
        normalized = VietnameseTextProcessor.normalize(query).lower()
        folded = VietnameseTextProcessor.fold_accents(normalized)
        for keyword, code in PROCEDURE_KEYWORDS.items():
            if keyword in normalized or VietnameseTextProcessor.fold_accents(keyword) in folded:
                return code
        return None
