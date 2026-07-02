import httpx

from app.config import Settings
from app.services.ekyc import EkycService
from app.services.embedding import EmbeddingService
from app.services.hosobot import HoSoBotService
from app.services.hybrid_search import HybridLegalSearch
from app.services.llm import GroundedLLM
from app.services.ocr import OcrService
from app.services.rag import RAGEngine
from app.services.smartbot import SmartBotService


class AppContainer:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.http = httpx.AsyncClient(timeout=45)
        self.embeddings = EmbeddingService(settings, self.http)
        self.search = HybridLegalSearch(settings, self.embeddings)
        self.llm = GroundedLLM(settings, self.http)
        self.rag = RAGEngine(settings, self.search, self.llm)
        self.ocr = OcrService(settings, self.http)
        self.ekyc = EkycService(settings, self.http)
        self.hosobot = HoSoBotService(settings, self.http)
        self.smartbot = SmartBotService(settings, self.rag, self.http)

    async def initialize(self) -> None:
        await self.search.initialize()

    async def close(self) -> None:
        await self.http.aclose()
        self.search.client.close()
