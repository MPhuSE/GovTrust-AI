import httpx

from app.config import Settings
from app.services.ekyc import EkycService
from app.services.embedding import EmbeddingService
from app.services.hosobot import HoSoBotService
from app.services.hybrid_search import HybridLegalSearch
from app.services.llm import GroundedLLM
from app.services.ocr import OcrService
from app.services.qwen_law_extractor import LawArticleExtractor
from app.services.rag import RAGEngine
from app.services.semantic_match import SemanticMatcher


class AppContainer:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.http = httpx.AsyncClient(timeout=45)
        self.embeddings = EmbeddingService(settings, self.http)
        self.search = HybridLegalSearch(settings, self.embeddings)
        self.llm = GroundedLLM(settings, self.http)
        self.law_extractor = LawArticleExtractor(settings, self.http)
        self.rag = RAGEngine(settings, self.search, self.llm, self.law_extractor)
        self.ocr = OcrService(settings, self.http)
        self.ekyc = EkycService(settings, self.http)
        self.hosobot = HoSoBotService(settings, self.http)
        self.semantic = SemanticMatcher(settings, self.http)

    async def initialize(self) -> None:
        await self.search.initialize()

        # Pre-load embedding model to avoid slow first request
        if self.settings.EMBEDDING_PROVIDER.lower() == "local":
            import logging
            logger = logging.getLogger(__name__)
            logger.info("Pre-loading embedding model to cache...")
            try:
                # Trigger model load with dummy text
                await self.embeddings.embed_one("test", "query")
                logger.info("✅ Embedding model loaded and cached")
            except Exception as e:
                logger.warning(f"⚠️ Failed to pre-load embedding model: {e}")

    async def close(self) -> None:
        await self.http.aclose()
        self.search.client.close()
