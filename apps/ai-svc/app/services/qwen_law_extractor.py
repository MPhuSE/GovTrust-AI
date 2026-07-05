import logging

import httpx

from app.config import Settings

logger = logging.getLogger(__name__)


# Prompt đóng khung CHẶT: chỉ TRÍCH nguyên văn điều luật, KHÔNG tư vấn/tóm tắt/diễn giải.
# LawGuard là lớp căn cứ pháp lý — mọi lời "chế" của model là rủi ro, nên cấm tuyệt đối.
_SYSTEM_PROMPT = (
    "Bạn là công cụ trích xuất văn bản pháp luật Việt Nam. Nhiệm vụ DUY NHẤT: từ đoạn "
    "văn bản thô (trích từ kho luật, có thể lẫn quốc hiệu, tiêu ngữ, khối chữ ký số, "
    "hoặc nội dung điều luật lân cận), hãy trả về ĐÚNG NGUYÊN VĂN nội dung của điều luật "
    "được yêu cầu.\n"
    "QUY TẮC BẮT BUỘC:\n"
    "- KHÔNG tóm tắt, KHÔNG diễn giải, KHÔNG bình luận, KHÔNG thêm bất kỳ chữ nào của bạn.\n"
    "- Chỉ giữ lại đúng nội dung điều luật (kể cả các khoản, điểm của nó); loại bỏ quốc "
    "hiệu, tiêu ngữ, khối chữ ký số (Email/Thời gian ký...), số trang, và các điều luật khác.\n"
    "- Giữ nguyên câu chữ, số khoản/điểm, dấu câu như văn bản gốc.\n"
    "- Nếu đoạn thô KHÔNG chứa nội dung của điều được yêu cầu, trả về đúng hai chữ: KHÔNG_CÓ."
)


class LawArticleExtractor:
    """Dùng Qwen (text) để TRÍCH nguyên văn điều luật từ chunk Qdrant thô.
    Dùng chung API key + base URL với Qwen OCR. Chưa cấu hình / lỗi → trả None để
    RAGEngine fallback về regex _clean_excerpt (LawGuard không bao giờ vỡ vì bước này)."""

    def __init__(self, settings: Settings, http: httpx.AsyncClient):
        self.settings = settings
        self.http = http
        self.model = settings.QWEN_LLM_MODEL

    @property
    def configured(self) -> bool:
        return bool(self.settings.QWEN_OCR_API_KEY and self.model)

    async def extract(self, raw_text: str, article: str, title: str = "") -> str | None:
        """Trích nguyên văn điều `article` từ `raw_text`. Trả None nếu không dùng được
        (chưa cấu hình / lỗi / model báo không có) → caller fallback regex."""
        if not self.configured or not (raw_text or "").strip():
            return None

        target = " – ".join(p for p in (article, title) if p) or "điều luật liên quan"
        user_prompt = (
            f"Điều luật cần trích: {target}\n\n"
            f"Đoạn văn bản thô:\n\"\"\"\n{raw_text}\n\"\"\""
        )

        try:
            response = await self.http.post(
                f"{self.settings.QWEN_OCR_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.settings.QWEN_OCR_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "temperature": 0.0,
                    "messages": [
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                },
                timeout=self.settings.LLM_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"].strip()
        except Exception as exc:  # noqa: BLE001 — mọi lỗi đều fallback regex, không làm vỡ LawGuard
            logger.warning("LawArticleExtractor Qwen lỗi, fallback regex: %s", exc)
            return None

        # Model tự báo không tìm thấy điều luật trong đoạn thô → để caller fallback.
        if not content or content.replace(" ", "").upper().startswith("KHÔNG_CÓ".replace(" ", "").upper()) or content.upper() == "KHONG_CO":
            return None
        return content
