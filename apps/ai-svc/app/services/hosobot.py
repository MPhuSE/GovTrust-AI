import logging

import httpx

from app.config import Settings
from app.text import VietnameseTextProcessor


logger = logging.getLogger(__name__)

# Thứ tự QUAN TRỌNG: keyword_fallback trả match ĐẦU TIÊN, nên cụm cụ thể phải đứng
# trước cụm chung (vd "đăng ký lại khai sinh" trước "khai sinh").
PROCEDURE_KEYWORDS: dict[str, str] = {
    "cấp bản sao trích lục khai sinh": "CAP_BAN_SAO_TRICH_LUC_KHAI_SINH",
    "trích lục khai sinh": "CAP_BAN_SAO_TRICH_LUC_KHAI_SINH",
    "bản sao khai sinh": "CAP_BAN_SAO_TRICH_LUC_KHAI_SINH",
    "đăng ký lại khai sinh": "DK_LAI_KHAI_SINH",
    "khai sinh": "DK_LAI_KHAI_SINH",
    "xác nhận tình trạng hôn nhân": "XAC_NHAN_TINH_TRANG_HON_NHAN",
    "tình trạng hôn nhân": "XAC_NHAN_TINH_TRANG_HON_NHAN",
    "hôn nhân": "XAC_NHAN_TINH_TRANG_HON_NHAN",
    "thành lập hộ kinh doanh": "HKD_THANH_LAP",
    "đăng ký hộ kinh doanh": "HKD_THANH_LAP",
    "thay đổi hộ kinh doanh": "HKD_THAY_DOI",
    "thay đổi đăng ký kinh doanh": "HKD_THAY_DOI",
    "cấp lại giấy chứng nhận hộ kinh doanh": "HKD_CAP_LAI",
    "cấp lại hộ kinh doanh": "HKD_CAP_LAI",
    "chấm dứt hộ kinh doanh": "HKD_CHAM_DUT",
    "ngừng hộ kinh doanh": "HKD_CHAM_DUT",
    "hộ kinh doanh": "HKD_THANH_LAP",
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
