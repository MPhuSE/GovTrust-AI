from app.services.hybrid_search import LegalChunk
from app.services.smartbot import PROCEDURE_CATEGORIES, SmartBotService


PROCEDURE_CONTEXT = """Tên thủ tục: Đăng ký khai sinh
Cơ quan tiếp nhận: UBND cấp xã
Thời hạn xử lý (SLA): 5 ngày làm việc
Giấy tờ cần chuẩn bị:
  1. TO_KHAI_KHAI_SINH (Tờ khai đăng ký khai sinh) — số lượng: 1
  2. GIAY_CHUNG_SINH (Giấy chứng sinh) — số lượng: 1
  3. CCCD (Giấy tờ tùy thân của cha hoặc mẹ) — số lượng: 2"""

SOURCES = [
    LegalChunk(
        chunk_id="luat-ho-tich-16",
        title="Luật Hộ tịch 2014",
        article="Điều 16",
        text=(
            "Người đi đăng ký khai sinh nộp tờ khai và giấy chứng sinh. "
            "Trường hợp không có giấy chứng sinh thì nộp văn bản xác nhận "
            "của người làm chứng hoặc giấy cam đoan về việc sinh."
        ),
        url="https://example.test/luat-ho-tich",
        source_version="2014",
        category="HO_TICH",
        score=0.9,
    )
]


def answer(question: str) -> str:
    return SmartBotService._fallback_answer(question, SOURCES, PROCEDURE_CONTEXT)


def test_household_business_procedures_use_qdrant_category():
    household_business_codes = {
        "HKD_THANH_LAP",
        "HKD_THAY_DOI",
        "HKD_CAP_LAI",
        "HKD_CHAM_DUT",
    }

    assert {
        PROCEDURE_CATEGORIES[code] for code in household_business_codes
    } == {"HO_KINH_DOANH"}


def test_fallback_answers_depend_on_the_question():
    answers = {
        answer("Tôi cần chuẩn bị những giấy tờ gì?"),
        answer("Thủ tục này nộp ở đâu và mất bao lâu?"),
        answer("Căn cứ pháp lý của thủ tục này là gì?"),
        answer("Tôi không có giấy chứng sinh thì xử lý thế nào?"),
    }

    assert len(answers) == 4


def test_fallback_returns_the_relevant_grounded_section():
    documents_answer = answer("Cần chuẩn bị giấy tờ gì?")
    assert "Tờ khai đăng ký khai sinh" in documents_answer
    assert "Giấy chứng sinh" in documents_answer

    authority_answer = answer("Nộp ở đâu và bao lâu có kết quả?")
    assert "UBND cấp xã" in authority_answer
    assert "5 ngày làm việc" in authority_answer

    legal_answer = answer("Căn cứ pháp lý là gì?")
    assert "Luật Hộ tịch 2014" in legal_answer
    assert "Điều 16" in legal_answer

    missing_document_answer = answer("Không có giấy chứng sinh thì làm sao?")
    assert "văn bản xác nhận" in missing_document_answer
    assert "giấy cam đoan" in missing_document_answer
