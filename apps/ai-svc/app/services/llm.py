import httpx

from app.config import Settings
from app.services.hybrid_search import LegalChunk


class GroundedLLM:
    """Optional OpenAI-compatible generator; retrieval evidence remains source of truth."""

    def __init__(self, settings: Settings, http: httpx.AsyncClient):
        self.settings = settings
        self.http = http

    @property
    def configured(self) -> bool:
        return bool(self.settings.LLM_API_KEY and self.settings.LLM_MODEL)

    async def answer(self, question: str, sources: list[LegalChunk]) -> str:
        if not sources:
            return "Chưa tìm thấy căn cứ phù hợp trong kho văn bản hiện có."
        if not self.configured:
            best = sources[0]
            return f"Căn cứ gần nhất: {best.title}, {best.article}. {best.text}"

        context = "\n\n".join(
            f"[Nguồn {index}] {source.title} — {source.article}\n{source.text}"
            for index, source in enumerate(sources, start=1)
        )
        response = await self.http.post(
            self.settings.LLM_API_URL,
            headers={"Authorization": f"Bearer {self.settings.LLM_API_KEY}"},
            json={
                "model": self.settings.LLM_MODEL,
                "temperature": 0.1,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "Bạn là trợ lý tiền kiểm hồ sơ hành chính Việt Nam. "
                            "Chỉ trả lời từ nguồn được cung cấp, trích [Nguồn n], "
                            "nói rõ khi thiếu căn cứ và không đưa ra quyết định hành chính."
                        ),
                    },
                    {"role": "user", "content": f"Câu hỏi: {question}\n\n{context}"},
                ],
            },
            timeout=self.settings.LLM_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
