from app.services.rag import _parse_citation


def test_parses_abbreviated_citation_with_doc_hint():
    role = "Xuất trình để lấy thông tin đăng ký hiện tại (Đ.85 NĐ 168/2025)"
    assert _parse_citation(role) == ("85", "168/2025")


def test_parses_full_dieu_with_clause_noise_between_article_and_doc():
    role = "Ủy quyền một thành viên làm chủ hộ — công chứng/chứng thực (Đ.100 k.3 điểm b NĐ 168/2025)"
    assert _parse_citation(role) == ("100", "168/2025")


def test_parses_article_with_letter_suffix():
    # "Điều 34b" — số điều kèm chữ, không được cắt mất phần chữ.
    assert _parse_citation("Nội dung theo Điều 34b Nghị định 70/2025")[0] == "34b"


def test_returns_none_when_no_citation_present():
    assert _parse_citation("Giấy chứng sinh do cơ sở y tế cấp") is None


def test_returns_none_for_empty_text():
    assert _parse_citation("") is None
    assert _parse_citation(None) is None


def test_article_without_doc_hint_returns_none_hint():
    num, hint = _parse_citation("Theo Điều 17 của luật hiện hành")
    assert num == "17"
    assert hint is None
