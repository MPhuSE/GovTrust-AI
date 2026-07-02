from dataclasses import replace

from rank_bm25 import BM25Okapi

from app.config import Settings
from app.services.hybrid_search import HybridLegalSearch, LegalChunk
from app.text import VietnameseTextProcessor


def test_rrf_rewards_result_found_by_both_retrievers():
    service = HybridLegalSearch.__new__(HybridLegalSearch)
    service.settings = Settings(
        HYBRID_DENSE_WEIGHT=0.6,
        HYBRID_LEXICAL_WEIGHT=0.4,
        HYBRID_RRF_K=60,
    )
    base = LegalChunk("shared", "text", "title", "", "", "", "HO_TICH")
    dense_only = replace(base, chunk_id="dense")
    service.by_id = {item.chunk_id: item for item in [base, dense_only]}

    results = service._rrf(["dense", "shared"], ["shared"], top_k=2)

    assert results[0].chunk_id == "shared"
    assert 0 < results[0].score <= 1


def test_lexical_search_works_with_single_document_corpus():
    service = HybridLegalSearch.__new__(HybridLegalSearch)
    document = LegalChunk(
        "law-1",
        "Nộp giấy chứng sinh khi đăng ký khai sinh",
        "Luật Hộ tịch",
        "Điều 16",
        "",
        "2014",
        "HO_TICH",
    )
    service.documents = [document]
    service.tokenized_documents = [VietnameseTextProcessor.tokens(document.text)]
    service.bm25 = BM25Okapi(service.tokenized_documents)

    assert service._lexical_search("giấy chứng sinh", "HO_TICH", 5) == ["law-1"]
