import asyncio
import re

from app.config import Settings
from app.models.schemas import LegalAlert, LegalSource
from app.services.hybrid_search import HybridLegalSearch, LegalChunk
from app.services.llm import GroundedLLM
from app.services.qwen_law_extractor import LawArticleExtractor


DISCLAIMER = (
    "Thông tin chỉ mang tính tham khảo từ văn bản pháp luật công khai. "
    "Quyết định cuối cùng thuộc cơ quan có thẩm quyền."
)

# Độ dài tối đa trích đoạn điều luật (ký tự) — dài hơn sẽ cắt gọn cho dễ đọc.
_EXCERPT_MAX = 260

# Bắt căn cứ pháp lý ghi sẵn trong role text: "Đ.85 NĐ 168/2025", "Điều 100 ... NĐ 168/2025".
# Group 1 = số điều (có thể kèm chữ, vd "34b"); group 2 = mã văn bản (số/năm) để chọn đúng luật.
_CITATION_RE = re.compile(
    r"Đ(?:iều)?\.?\s*(\d+[a-zA-Z]?)"          # Đ.85 / Điều 100 / Điều 34b
    r"(?:[^)]*?(\d{2,3}/\d{4}))?",             # ... 168/2025 (doc hint, tùy chọn)
    re.IGNORECASE,
)


def _parse_citation(text: str) -> tuple[str, str | None] | None:
    """Trích (số_điều, doc_hint) từ role text nếu có căn cứ ghi sẵn."""
    match = _CITATION_RE.search(text or "")
    if not match:
        return None
    return match.group(1), match.group(2)


# Rác chèn khi PDF hóa/ký số: khối chữ ký điện tử + tiêu ngữ quốc hiệu lặp trong chunk.
# Cắt để phần hiển thị chỉ còn nội dung điều luật (trước lòi "Email:... Thời gian ký:...").
_SIGNATURE_RE = re.compile(
    # Khối chữ ký số luôn kết thúc bằng mốc múi giờ "+07:00" — neo tại đó để không
    # nuốt lan sang nội dung điều luật (non-greedy .*? dừng ở timezone đầu tiên).
    r"Email:\s*\S+@\S+.*?\+\d{2}:\d{2}",
    re.IGNORECASE | re.DOTALL,
)
_BOILERPLATE_RE = re.compile(
    r"C[ỘO]NG H[ÒO]A X[ÃA] H[ỘO]I CH[ỦU] NGH[ĨI]A VI[ỆE]T NAM\s*"
    r"Đ[ộo]c l[ậa]p\s*-\s*T[ựu] do\s*-\s*H[ạa]nh ph[úu]c[-\s]*",
    re.IGNORECASE,
)
# Nhãn "Phần đầu văn bản" = preamble (quốc hiệu/căn cứ ban hành), KHÔNG phải điều luật.
_PREAMBLE_ARTICLE = "phần đầu văn bản"


def _is_preamble(chunk: LegalChunk) -> bool:
    """Chunk preamble (quốc hiệu, chữ ký số, căn cứ ban hành) — không dùng làm căn cứ."""
    return (chunk.article or "").strip().lower() == _PREAMBLE_ARTICLE


def _clean_excerpt(text: str, max_len: int) -> str:
    """Bỏ khối chữ ký số + tiêu ngữ lặp, gộp khoảng trắng, cắt gọn theo ranh giới từ."""
    cleaned = _SIGNATURE_RE.sub(" ", text or "")
    cleaned = _BOILERPLATE_RE.sub(" ", cleaned)
    cleaned = " ".join(cleaned.split())
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len].rsplit(" ", 1)[0].rstrip(",;.") + "…"
    return cleaned


class RAGEngine:
    def __init__(
        self,
        settings: Settings,
        search: HybridLegalSearch,
        llm: GroundedLLM,
        law_extractor: LawArticleExtractor | None = None,
    ):
        self.settings = settings
        self.search_service = search
        self.llm = llm
        self.law_extractor = law_extractor

    async def retrieve(
        self, query: str, category: str | None = None, top_k: int = 5
    ) -> list[LegalChunk]:
        return await self.search_service.search(query, category, top_k)

    async def generate_alerts(
        self,
        checklist: list[dict],
        procedure_code: str,
        category: str | None = None,
        procedure_name: str | None = None,
    ) -> list[LegalAlert]:
        # Tên thủ tục (đọc được) là tín hiệu ngữ nghĩa mạnh nhất để neo đúng luật.
        # Trước dùng mã code trần (HKD_THAY_DOI) → token rác, kéo nhầm luật hóa đơn/
        # công ty. Tên + vai trò giấy tờ cho retrieval bám đúng nhóm điều luật.
        subject = (procedure_name or "").strip() or f"thủ tục {procedure_code}"

        async def alert_for(item: dict) -> tuple[LegalAlert, bool] | None:
            """Trả (alert, from_citation). from_citation=True nếu điều luật lấy từ
            căn cứ ghi sẵn trong quy trình (luật trọng yếu), False nếu chỉ là semantic
            search (dễ kéo nhầm luật không liên quan)."""
            role = item.get("roleInProcedure") or item.get("role_in_procedure") or item.get("id", "")

            # 1) Ưu tiên căn cứ ghi sẵn trong role text (vd "Đ.85 NĐ 168/2025").
            #    Lấy chính xác điều luật đó — chắc chắn đúng hơn RAG ngữ nghĩa.
            best: LegalChunk | None = None
            from_citation = False
            citation = _parse_citation(role)
            if citation:
                article_num, doc_hint = citation
                best = await self.search_service.fetch_by_article(
                    article_num, category, doc_hint
                )
                from_citation = best is not None

            # 2) Không có căn cứ ghi sẵn (hoặc không tìm thấy) → semantic search.
            #    Tên thủ tục + vai trò giấy tờ neo đúng nhóm luật; mã code trần trước
            #    đây kéo nhầm luật hóa đơn/công ty.
            if best is None:
                sources = await self.retrieve(f"{subject}. {role}", category, 5)
                # Bỏ chunk preamble (quốc hiệu/chữ ký số) — không phải điều luật.
                sources = [s for s in sources if not _is_preamble(s)]
                if not sources:
                    return None
                best = sources[0]

            is_reference = best.score >= self.settings.LAWGARD_REFERENCE_THRESHOLD

            # Nội dung điều luật thật (không chỉ trích dẫn). `article` đã chứa sẵn
            # "Điều 34b" nên KHÔNG prefix thêm "Điều" (trước bị lặp "Điều Điều").
            # Ưu tiên Qwen trích NGUYÊN VĂN điều luật (bỏ chữ ký số + điều lân cận);
            # Qwen chưa cấu hình / lỗi / không tìm thấy → fallback regex _clean_excerpt.
            excerpt: str | None = None
            if self.law_extractor is not None:
                excerpt = await self.law_extractor.extract(
                    best.text, best.article, best.title
                )
            if not excerpt:
                excerpt = _clean_excerpt(best.text, _EXCERPT_MAX)
            citation_label = " – ".join(p for p in (best.article, best.title) if p)
            if not excerpt:
                excerpt = citation_label or "Chưa trích xuất được nội dung điều luật."

            message = (
                excerpt
                if is_reference
                else f"Độ khớp truy xuất thấp — cần cán bộ kiểm tra thêm. Trích dẫn tham khảo: {excerpt}"
            )

            alert = LegalAlert(
                type="REFERENCE" if is_reference else "WARNING",
                checklistItemId=item.get("id", ""),
                message=message,
                legalSource=LegalSource(
                    title=best.title,
                    article=best.article,
                    url=best.url,
                    sourceVersion=best.source_version,
                ),
                confidence=best.score,
                needsVerification=not is_reference,
            )
            return alert, from_citation

        results = await asyncio.gather(*(alert_for(item) for item in checklist))
        pairs = [r for r in results if r is not None]

        # Chỉ trích xuất LUẬT TRỌNG YẾU: nếu có bất kỳ căn cứ ghi sẵn nào (from_citation),
        # bỏ hết các alert từ semantic search — chúng hay kéo nhầm luật không liên quan
        # (vd "công ty TNHH" khi thủ tục là hộ kinh doanh). Chỉ khi KHÔNG có căn cứ nào
        # mới rơi về semantic để tránh trang trống trơn.
        cited = [alert for alert, from_citation in pairs if from_citation]
        chosen = cited if cited else [alert for alert, _ in pairs]

        # Bỏ trùng theo điều luật (nhiều giấy tờ có thể trỏ cùng một Điều) — giữ cái đầu.
        deduped: list[LegalAlert] = []
        seen: set[str] = set()
        for alert in chosen:
            key = (alert.legal_source.article or alert.message).strip().lower()
            if key in seen:
                continue
            seen.add(key)
            deduped.append(alert)
        return deduped

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
