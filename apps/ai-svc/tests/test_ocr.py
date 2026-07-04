import pytest

from app.config import Settings
from app.services.ocr import OcrResult, OcrService, UnsupportedDocumentType


def _service() -> OcrService:
    # Ép rỗng mọi token (VNPT + Qwen) để test hermetic, không phụ thuộc .env cục bộ.
    # Thiếu token → extract() trả mock thay vì gọi HTTP thật (http=None sẽ nổ).
    settings = Settings(
        VNPT_BASE_URL="",
        VNPT_SMARTREADER_TOKEN_ID="",
        VNPT_SMARTREADER_TOKEN_KEY="",
        VNPT_SMARTREADER_ACCESS_TOKEN="",
        VNPT_EKYC_TOKEN_ID="",
        VNPT_EKYC_TOKEN_KEY="",
        VNPT_EKYC_ACCESS_TOKEN="",
        QWEN_OCR_API_KEY="",
    )
    return OcrService(settings, http=None)


@pytest.mark.asyncio
async def test_extract_raises_when_document_type_unsupported():
    """Loại giấy không có endpoint VNPT → UnsupportedDocumentType (vẫn raise)."""
    service = _service()
    with pytest.raises(UnsupportedDocumentType):
        await service.extract(b"fake-image", "SO_DO")


@pytest.mark.asyncio
async def test_extract_returns_mock_when_smartreader_not_configured():
    """Khi thiếu VNPT key → trả mock OcrResult thay vì raise (Task-1)."""
    service = _service()
    assert not service.configured

    result = await service.extract(b"fake-image", "GIAY_KHAI_SINH")

    assert isinstance(result, OcrResult)
    # Mock phải trả fields của loại đó
    assert "hoTenCon" in result.fields or len(result.fields) > 0
    # image_quality metadata phải có đủ 4 key
    assert {"isBlurry", "brightness", "resolution", "ocrConfidence"} <= result.image_quality.keys()
    # avg_confidence trong khoảng hợp lệ
    assert 0.0 <= result.avg_confidence <= 1.0


@pytest.mark.asyncio
async def test_extract_returns_mock_when_ekyc_not_configured():
    """Khi thiếu VNPT eKYC key → trả mock OcrResult thay vì raise (Task-1)."""
    service = _service()
    assert not service.ekyc_configured

    result = await service.extract(b"fake-image", "CCCD")

    assert isinstance(result, OcrResult)
    assert len(result.fields) > 0
    assert {"isBlurry", "brightness", "resolution", "ocrConfidence"} <= result.image_quality.keys()


@pytest.mark.asyncio
async def test_mock_image_quality_marks_fake_bytes_as_blurry():
    """Bytes giả (b'fake-image') không decode được ảnh thật → isBlurry=True."""
    service = _service()
    result = await service.extract(b"fake-image", "GIAY_KHAI_SINH")
    # _assess_quality fallback: isBlurry=True khi không decode được ảnh
    assert result.image_quality["isBlurry"] is True


@pytest.mark.asyncio
async def test_extract_supports_giay_cho_o_hop_phap():
    """Giấy tờ chỗ ở (GIAY_CHUNG_NHAN_QSDD) — OCR mới cho thủ tục thường trú.
    Có endpoint (v2 văn bản hành chính) nên KHÔNG raise, trả mock khi thiếu token."""
    service = _service()
    result = await service.extract(b"fake-image", "GIAY_CHUNG_NHAN_QSDD")
    assert isinstance(result, OcrResult)
    # Mock phải có các field định danh dùng cho CrossCheck thường trú
    assert "tenChuSoHuu" in result.fields
    assert "diaChiNha" in result.fields
