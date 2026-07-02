import logging

import httpx

from app.config import Settings
from app.text import VietnameseTextProcessor


logger = logging.getLogger(__name__)

PROCEDURE_KEYWORDS: dict[str, str] = {
    "đăng ký khai sinh": "DK_KHAI_SINH",
    "khai sinh": "DK_KHAI_SINH",
    "đăng ký cư trú": "DANG_KY_CU_TRU",
    "cư trú": "DANG_KY_CU_TRU",
    "chứng thực": "CHUNG_THUC",
    "căn cước": "CAP_DOI_GIAY_TO",
    "cccd": "CAP_DOI_GIAY_TO",
    "đăng ký kinh doanh": "HO_KINH_DOANH",
    "hộ kinh doanh": "HO_KINH_DOANH",
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
