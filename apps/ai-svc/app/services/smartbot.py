import logging
import re

import httpx

from app.config import Settings
from app.services.hybrid_search import LegalChunk
from app.services.rag import RAGEngine
from app.text import VietnameseTextProcessor


logger = logging.getLogger(__name__)

PROCEDURE_CATEGORIES: dict[str, str] = {
    "DK_THUONG_TRU": "CƯ TRÚ",
    "HKD_THAY_DOI": "HO_KINH_DOANH",
    "CHUYEN_NHUONG_QSDD": "ĐẤT ĐAI",
}

SYSTEM_PROMPT = (
    "Bạn là trợ lý tư vấn thủ tục hành chính công Việt Nam (SmartBot). "
    "Nhiệm vụ: hướng dẫn người dân chuẩn bị hồ sơ, giải thích quy trình, "
    "và trả lời thắc mắc liên quan đến thủ tục hành chính. "
    "Chỉ trả lời dựa trên nguồn pháp luật được cung cấp, trích [Nguồn n]. "
    "Nếu thiếu căn cứ, nói rõ và khuyên người dân liên hệ cơ quan có thẩm quyền. "
    "Không đưa ra quyết định hành chính. Trả lời ngắn gọn, dễ hiểu."
)


class SmartBotService:
    def __init__(self, settings: Settings, rag: RAGEngine, http: httpx.AsyncClient):
        self.settings = settings
        self.rag = rag
        self.http = http

    async def consult(
        self,
        question: str,
        procedure_code: str,
        top_k: int = 5,
        procedure_context: str = "",
    ) -> dict:
        category = PROCEDURE_CATEGORIES.get(procedure_code)
        sources = await self.rag.retrieve(question, category, top_k)

        answer = await self._generate(question, procedure_code, sources, procedure_context)

        return {
            "answer": answer,
            "procedureCode": procedure_code,
            "sources": [
                {
                    "content": s.text,
                    "relevanceScore": s.score,
                    "source": {
                        "title": s.title,
                        "article": s.article,
                        "url": s.url,
                        "sourceVersion": s.source_version,
                    },
                }
                for s in sources
            ],
            "disclaimer": (
                "Thông tin chỉ mang tính tham khảo từ văn bản pháp luật công khai. "
                "Quyết định cuối cùng thuộc cơ quan có thẩm quyền."
            ),
        }

    async def _generate(
        self,
        question: str,
        procedure_code: str,
        sources: list[LegalChunk],
        procedure_context: str = "",
    ) -> str:
        if not sources and not procedure_context:
            return "Chưa tìm thấy căn cứ phù hợp trong kho văn bản hiện có cho thủ tục này."

        if not (self.settings.LLM_API_KEY and self.settings.LLM_MODEL):
            return self._fallback_answer(question, sources, procedure_context)

        legal_context = "\n\n".join(
            f"[Nguồn {i}] {s.title} — {s.article}\n{s.text}"
            for i, s in enumerate(sources, start=1)
        )

        blocks = [f"Thủ tục: {procedure_code}"]
        if procedure_context:
            blocks.append(f"Thông tin thủ tục (hồ sơ chính thức):\n{procedure_context}")
        blocks.append(f"Câu hỏi: {question}")
        if legal_context:
            blocks.append(f"Căn cứ pháp luật:\n{legal_context}")

        response = await self.http.post(
            self.settings.LLM_API_URL,
            headers={"Authorization": f"Bearer {self.settings.LLM_API_KEY}"},
            json={
                "model": self.settings.LLM_MODEL,
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": "\n\n".join(blocks)},
                ],
            },
            timeout=self.settings.LLM_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()

    @classmethod
    def _fallback_answer(
        cls,
        question: str,
        sources: list[LegalChunk],
        procedure_context: str,
    ) -> str:
        """Fallback không LLM nhưng vẫn bám câu hỏi và dữ liệu đã retrieve."""
        folded_question = VietnameseTextProcessor.fold_accents(
            VietnameseTextProcessor.normalize(question)
        ).lower()

        # Case ngoại lệ/thiếu giấy cần ưu tiên căn cứ luật thay vì checklist chung.
        if cls._contains_any(
            folded_question,
            ("khong co", "bi mat", "bi thieu", "thay the", "lam sao", "xu ly"),
        ):
            grounded = cls._most_relevant_legal_text(question, sources)
            if grounded:
                return grounded

        if cls._contains_any(
            folded_question,
            ("giay to", "ho so", "chuan bi", "thanh phan", "can gi"),
        ):
            documents = cls._document_section(procedure_context)
            if documents:
                return "Bạn cần chuẩn bị các giấy tờ sau:\n" + "\n".join(documents)

        if cls._contains_any(
            folded_question,
            ("nop o dau", "co quan", "noi nop", "bao lau", "thoi han", "mat bao"),
        ):
            details = cls._context_values(
                procedure_context,
                ("Cơ quan tiếp nhận:", "Thời hạn xử lý"),
            )
            if details:
                return "Thông tin nơi nộp và thời hạn:\n" + "\n".join(
                    f"- {detail}" for detail in details
                )

        if cls._contains_any(
            folded_question,
            ("can cu", "phap ly", "luat", "dieu nao", "quy dinh"),
        ):
            if sources:
                citations = [
                    f"- {source.title}, {source.article}: {source.text}"
                    for source in sources[:3]
                ]
                return "Căn cứ pháp lý liên quan:\n" + "\n".join(citations)

        grounded = cls._most_relevant_legal_text(question, sources)
        if grounded:
            return grounded

        name = cls._context_values(procedure_context, ("Tên thủ tục:",))
        subject = name[0] if name else "thủ tục này"
        return (
            f"Chưa tìm thấy thông tin cụ thể để trả lời câu hỏi về {subject}. "
            "Bạn nên liên hệ cơ quan tiếp nhận để được xác nhận."
        )

    @staticmethod
    def _contains_any(text: str, phrases: tuple[str, ...]) -> bool:
        return any(phrase in text for phrase in phrases)

    @staticmethod
    def _context_values(context: str, prefixes: tuple[str, ...]) -> list[str]:
        return [
            line.strip()
            for line in context.splitlines()
            if any(line.strip().startswith(prefix) for prefix in prefixes)
        ]

    @staticmethod
    def _document_section(context: str) -> list[str]:
        lines = context.splitlines()
        try:
            start = next(
                index
                for index, line in enumerate(lines)
                if line.strip() == "Giấy tờ cần chuẩn bị:"
            )
        except StopIteration:
            return []

        documents: list[str] = []
        for line in lines[start + 1 :]:
            stripped = line.strip()
            if not re.match(r"^\d+\.", stripped):
                break
            # Bỏ code kỹ thuật, giữ mô tả mà người dân đọc được.
            humanized = re.sub(r"^\d+\.\s+[A-Z0-9_]+\s+\((.*)\)(.*)$", r"- \1\2", stripped)
            documents.append(humanized)
        return documents

    @classmethod
    def _most_relevant_legal_text(
        cls,
        question: str,
        sources: list[LegalChunk],
    ) -> str:
        if not sources:
            return ""

        stopwords = {
            "toi", "thi", "la", "gi", "va", "cua", "nay", "duoc", "nhu",
            "the", "nao", "lam", "sao", "can", "cho", "ve", "co",
        }
        question_tokens = {
            VietnameseTextProcessor.fold_accents(token.lower())
            for token in VietnameseTextProcessor.tokens(question)
            if "_" not in token
        } - stopwords

        candidates: list[tuple[int, int, LegalChunk, str]] = []
        order = 0
        for source in sources:
            sentences = re.split(r"(?<=[.!?;])\s+", source.text)
            for sentence in sentences:
                sentence_tokens = {
                    VietnameseTextProcessor.fold_accents(token.lower())
                    for token in VietnameseTextProcessor.tokens(sentence)
                    if "_" not in token
                }
                score = len(question_tokens & sentence_tokens)
                candidates.append((score, -order, source, sentence.strip()))
                order += 1

        best_score, _, source, sentence = max(candidates, key=lambda item: (item[0], item[1]))
        if best_score == 0:
            return ""
        return f"Theo {source.title}, {source.article}: {sentence}"
