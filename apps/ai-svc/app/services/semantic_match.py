import json
import logging
import re

import httpx

from app.config import Settings

logger = logging.getLogger(__name__)


class SemanticVerdict:
    """Phán đoán ngữ nghĩa cho 1 cặp giá trị field."""

    def __init__(
        self,
        field: str,
        equivalent: bool,
        confidence: float,
        reason: str,
        canonical_left: str = "",
        canonical_right: str = "",
    ):
        self.field = field
        self.equivalent = equivalent
        self.confidence = confidence
        self.reason = reason
        self.canonical_left = canonical_left
        self.canonical_right = canonical_right


# Prompt đóng khung chặt: chỉ phán "cùng thực thể hay không", KHÔNG ra quyết định
# hành chính. Nhiệt độ thấp + JSON mode để output ổn định (gần tất định).
_SYSTEM_PROMPT = (
    "Bạn là bộ đối chiếu dữ liệu giấy tờ hành chính Việt Nam. Với mỗi cặp giá trị "
    "trích từ HAI giấy tờ khác nhau cho CÙNG một trường, hãy phán đoán chúng có cùng "
    "chỉ MỘT thực thể hay không.\n"
    "- CHẤP NHẬN: viết tắt (TP.HCM = Thành phố Hồ Chí Minh), khác thứ tự từ, thiếu/thừa "
    "dấu, thêm bớt tiền tố hành chính (Phường/P., Quận/Q., đường/số nhà ghi khác cách).\n"
    "- KHÔNG chấp nhận: khác số nhà, khác tên riêng người, khác số/mã định danh.\n"
    "- Khi phân vân, trả equivalent=false (an toàn cho tiền kiểm hồ sơ).\n"
    "Trả về DUY NHẤT một JSON object dạng: "
    '{"verdicts":[{"field":..., "equivalent":true|false, "confidence":0.0-1.0, '
    '"reason":"ngắn gọn tiếng Việt", "canonical_left":..., "canonical_right":...}]}'
)

_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


class SemanticMatcher:
    """Đối chiếu ngữ nghĩa field bằng LLM (OpenAI-compatible). Dùng chung config
    LLM_* với GroundedLLM. Nếu LLM chưa cấu hình → fallback an toàn (không khớp)."""

    def __init__(self, settings: Settings, http: httpx.AsyncClient):
        self.settings = settings
        self.http = http

    @property
    def configured(self) -> bool:
        return bool(self.settings.LLM_API_KEY and self.settings.LLM_MODEL)

    async def check(self, pairs: list[dict]) -> list[SemanticVerdict]:
        """pairs: [{field, left, right, kind}]. Trả verdict theo đúng thứ tự & số lượng."""
        if not pairs:
            return []
        if not self.configured:
            # Không có LLM: không tự ý coi là khớp — để cán bộ kiểm tra thủ công.
            return [
                SemanticVerdict(
                    field=p.get("field", ""),
                    equivalent=False,
                    confidence=0.0,
                    reason="Chưa cấu hình LLM để đối chiếu ngữ nghĩa — cần cán bộ kiểm tra.",
                )
                for p in pairs
            ]

        try:
            return await self._call_llm(pairs)
        except Exception as exc:  # noqa: BLE001 — fallback an toàn khi LLM lỗi
            logger.warning("SemanticMatcher LLM lỗi, fallback không khớp: %s", exc)
            return [
                SemanticVerdict(
                    field=p.get("field", ""),
                    equivalent=False,
                    confidence=0.0,
                    reason=f"Lỗi gọi LLM đối chiếu: {exc}. Cần cán bộ kiểm tra.",
                )
                for p in pairs
            ]

    async def _call_llm(self, pairs: list[dict]) -> list[SemanticVerdict]:
        user_payload = {
            "pairs": [
                {
                    "field": p.get("field", ""),
                    "kind": p.get("kind", "generic"),
                    "left": p.get("left", ""),
                    "right": p.get("right", ""),
                }
                for p in pairs
            ]
        }
        response = await self.http.post(
            self.settings.LLM_API_URL,
            headers={"Authorization": f"Bearer {self.settings.LLM_API_KEY}"},
            json={
                "model": self.settings.LLM_MODEL,
                "temperature": 0.0,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": "Các cặp cần đối chiếu:\n"
                        + json.dumps(user_payload, ensure_ascii=False),
                    },
                ],
            },
            timeout=self.settings.LLM_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return self._parse(content, pairs)

    def _parse(self, content: str, pairs: list[dict]) -> list[SemanticVerdict]:
        """Parse JSON verdicts, map về đúng từng pair theo thứ tự. Model có thể bỏ
        sót/đổi thứ tự → khớp lại theo index, thiếu thì coi là không khớp (an toàn)."""
        raw = content.strip()
        match = _JSON_BLOCK_RE.search(raw)
        data = json.loads(match.group(0) if match else raw)
        verdicts_raw = data.get("verdicts", []) if isinstance(data, dict) else []

        results: list[SemanticVerdict] = []
        for index, pair in enumerate(pairs):
            v = verdicts_raw[index] if index < len(verdicts_raw) else {}
            if not isinstance(v, dict):
                v = {}
            equivalent = bool(v.get("equivalent", False))
            try:
                confidence = float(v.get("confidence", 0.0))
            except (TypeError, ValueError):
                confidence = 0.0
            results.append(
                SemanticVerdict(
                    field=str(v.get("field") or pair.get("field", "")),
                    equivalent=equivalent,
                    confidence=max(0.0, min(1.0, confidence)),
                    reason=str(v.get("reason", "")),
                    canonical_left=str(v.get("canonical_left", "")),
                    canonical_right=str(v.get("canonical_right", "")),
                )
            )
        return results
