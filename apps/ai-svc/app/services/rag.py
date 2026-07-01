import asyncio

from app.config import Settings
from app.models.schemas import LegalAlert, LegalSource
from app.services.hybrid_search import HybridLegalSearch, LegalChunk
from app.services.llm import GroundedLLM


DISCLAIMER = (
    "Thông tin chỉ mang tính tham khảo từ văn bản pháp luật công khai. "
    "Quyết định cuối cùng thuộc cơ quan có thẩm quyền."
)


class RAGEngine:
    def __init__(self, settings: Settings, search: HybridLegalSearch, llm: GroundedLLM):
        self.settings = settings
        self.search_service = search
        self.llm = llm

    async def retrieve(
        self, query: str, category: str | None = None, top_k: int = 5
    ) -> list[LegalChunk]:
        return await self.search_service.search(query, category, top_k)

    async def generate_alerts(
        self,
        checklist: list[dict],
        procedure_code: str,
        category: str | None = None,
    ) -> list[LegalAlert]:
        async def alert_for(item: dict) -> LegalAlert | None:
            role = item.get("roleInProcedure") or item.get("role_in_procedure") or item.get("id", "")
            query = f"Yêu cầu giấy tờ {role} cho thủ tục {procedure_code}"
            sources = await self.retrieve(query, category, 3)
            if not sources:
                return None
            best = sources[0]
            is_reference = best.score >= self.settings.LAWGARD_REFERENCE_THRESHOLD
            return LegalAlert(
                type="REFERENCE" if is_reference else "WARNING",
                checklistItemId=item.get("id", ""),
                message=(
                    f"Căn cứ: {best.title}, {best.article}"
                    if is_reference
                    else "Căn cứ truy xuất chưa đủ mạnh — cần cán bộ kiểm tra thêm"
                ),
                legalSource=LegalSource(
                    title=best.title,
                    article=best.article,
                    url=best.url,
                    sourceVersion=best.source_version,
                ),
                confidence=best.score,
                needsVerification=not is_reference,
            )

        results = await asyncio.gather(*(alert_for(item) for item in checklist))
        return [result for result in results if result is not None]

    async def answer(self, question: str, category: str | None, top_k: int) -> dict:
        sources = await self.retrieve(question, category, top_k)
        answer = await self.llm.answer(question, sources)
        return {
            "answer": answer,
            "sources": [
                {
                    "content": source.text,
                    "relevanceScore": source.score,
                    "source": {
                        "title": source.title,
                        "article": source.article,
                        "url": source.url,
                        "sourceVersion": source.source_version,
                    },
                }
                for source in sources
            ],
            "disclaimer": DISCLAIMER,
        }
