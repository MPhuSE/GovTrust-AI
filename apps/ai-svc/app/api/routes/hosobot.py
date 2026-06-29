import httpx
from fastapi import APIRouter, HTTPException
from app.models.schemas import HoSoBotRequest, HoSoBotResponse
from app.services.vnpt_smartbot import VNPTSmartBotClient

router = APIRouter(prefix="/hosobot")
smartbot_client = VNPTSmartBotClient()

PROCEDURE_KEYWORDS: dict[str, str] = {
    "khai sinh": "DK_KHAI_SINH",
    "đăng ký khai sinh": "DK_KHAI_SINH",
    "cư trú": "DANG_KY_CU_TRU",
    "đăng ký cư trú": "DANG_KY_CU_TRU",
    "chứng thực": "CHUNG_THUC",
    "cccd": "CAP_DOI_GIAY_TO",
    "căn cước": "CAP_DOI_GIAY_TO",
    "hộ kinh doanh": "HO_KINH_DOANH",
    "đăng ký kinh doanh": "HO_KINH_DOANH",
}


@router.post("/identify", response_model=HoSoBotResponse)
async def identify_procedure(request: HoSoBotRequest):
    """HoSoBot — nhận diện thủ tục từ câu hỏi tự nhiên (Bước 1)."""
    try:
        bot_result = await smartbot_client.chat(request.query, request.session_id)
        procedure_code = bot_result.get("intent") or _keyword_fallback(request.query)

        return HoSoBotResponse(
            procedure_code=procedure_code,
            procedure_name=bot_result.get("procedure_name"),
            confidence=bot_result.get("confidence", 0.8),
            message=bot_result.get("message", ""),
            suggestions=bot_result.get("suggestions", []),
        )
    except httpx.HTTPStatusError:
        procedure_code = _keyword_fallback(request.query)
        return HoSoBotResponse(
            procedure_code=procedure_code,
            confidence=0.5 if procedure_code else 0.0,
            message="Vui lòng chọn thủ tục phù hợp từ danh sách bên dưới.",
        )


def _keyword_fallback(query: str) -> str | None:
    query_lower = query.lower()
    for keyword, code in PROCEDURE_KEYWORDS.items():
        if keyword in query_lower:
            return code
    return None
