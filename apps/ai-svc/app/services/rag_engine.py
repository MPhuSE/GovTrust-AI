from app.vector_db.search import LegalSearchService, LegalChunk

CONFIDENCE_HIGH = 0.75
DISCLAIMER = (
    "Thông tin trên chỉ mang tính tham khảo từ văn bản pháp luật công khai. "
    "Quyết định cuối cùng thuộc cơ quan có thẩm quyền."
)


class RAGEngine:
    """Retrieval-Augmented Generation cho LawGuard."""

    def __init__(self):
        self.search_service = LegalSearchService()

    def retrieve(
        self,
        query: str,
        category: str | None = None,
        top_k: int = 5,
    ) -> list[dict]:
        results = self.search_service.search(query, category=category, top_k=top_k)
        return [
            {
                "content": r.text,
                "relevance_score": round(r.score, 3),
                "source": {
                    "title": r.title,
                    "article": r.article,
                    "url": r.url,
                    "sourceVersion": r.source_version,
                },
            }
            for r in results
        ]

    def generate_alerts(
        self,
        checklist: list[dict],
        procedure_code: str,
        category: str | None = None,
    ) -> list[dict]:
        alerts = []
        for item in checklist:
            query = f"Yêu cầu giấy tờ {item.get('roleInProcedure', item.get('id', ''))} cho thủ tục {procedure_code}"
            sources = self.retrieve(query, category=category, top_k=3)

            if not sources:
                continue

            best = sources[0]
            is_high_confidence = best["relevance_score"] >= CONFIDENCE_HIGH

            alerts.append({
                "type": "REFERENCE" if is_high_confidence else "WARNING",
                "checklistItemId": item.get("id"),
                "message": (
                    f"Căn cứ: {best['source']['title']}, {best['source']['article']}"
                    if is_high_confidence
                    else f"Cảnh báo: Căn cứ pháp lý chưa chắc chắn — cần kiểm tra thêm"
                ),
                "legalSource": best["source"],
                "confidence": best["relevance_score"],
                "needsVerification": not is_high_confidence,
            })

        return alerts

    @staticmethod
    def get_disclaimer() -> str:
        return DISCLAIMER
