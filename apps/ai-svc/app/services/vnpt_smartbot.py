import httpx
from app.config import settings


class VNPTSmartBotClient:
    """Client gọi VNPT SmartBot API cho HoSoBot."""

    def __init__(self):
        self.base_url = settings.VNPT_SMARTBOT_BASE_URL
        self.api_key = settings.VNPT_SMARTBOT_API_KEY

    @property
    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def chat(self, message: str, session_id: str | None = None) -> dict:
        """Nhận diện ý định và trả lời theo kịch bản."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/chat",
                headers=self._headers,
                json={"message": message, "session_id": session_id},
            )
            response.raise_for_status()
            return response.json()

    async def chat_advanced_llm(self, message: str, context: str = "") -> dict:
        """SmartBot nâng cao — LLM cho LawGuard."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/chat-advanced",
                headers=self._headers,
                json={"message": message, "context": context, "mode": "llm"},
            )
            response.raise_for_status()
            return response.json()
