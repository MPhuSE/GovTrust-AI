from app.services.hosobot import HoSoBotService
from app.text import VietnameseTextProcessor


def test_normalize_unicode_and_whitespace():
    assert VietnameseTextProcessor.normalize("  đăng\u200b   ký  khai sinh ") == "đăng ký khai sinh"


def test_tokens_keep_accents_folded_form_and_bigrams():
    tokens = VietnameseTextProcessor.tokens("Đăng ký khai sinh")
    assert "đăng" in tokens
    assert "dang" in tokens
    assert "khai_sinh" in tokens


def test_keyword_fallback_accepts_missing_diacritics():
    assert HoSoBotService.keyword_fallback("Toi muon dang ky thuong tru") == "DK_THUONG_TRU"
    assert HoSoBotService.keyword_fallback("thay doi ho kinh doanh") == "HKD_THAY_DOI"
