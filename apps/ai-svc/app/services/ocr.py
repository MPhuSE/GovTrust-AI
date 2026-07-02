import logging
import time
import uuid
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import Settings
from app.services.preprocess import preprocess_image


logger = logging.getLogger(__name__)


class UnsupportedDocumentType(ValueError):
    """Loại giấy tờ chưa có đường trích xuất OCR (không có endpoint VNPT)."""


class OcrUnavailableError(RuntimeError):
    """VNPT OCR chưa được cấu hình (thiếu token) nên không thể trích xuất."""


# eKYC OCR (path web /ai/v1/web/ocr/id) — bóc CCCD/CMND. Map key VNPT -> key nội bộ.
EKYC_MAPPING: dict[str, dict[str, str]] = {
    "CCCD": {
        "soCCCD": "id",
        "hoTen": "name",
        "ngaySinh": "birth_day",
        "gioiTinh": "gender",
        "quocTich": "nationality",
        "queQuan": "origin_location",
        "noiThuongTru": "recent_location",
        "ngayHetHan": "valid_date",
    },
    "CMND": {
        "soCMND": "id",
        "hoTen": "name",
        "ngaySinh": "birth_day",
        "gioiTinh": "gender",
        "queQuan": "origin_location",
        "noiThuongTru": "recent_location",
    },
}

# SmartReader trả object phẳng. Map key VNPT -> key nội bộ cho CrossCheck.
# LƯU Ý: key VNPT khác nhau theo từng endpoint (khai sinh IN HOA, kết hôn IN HOA _VO/_CHONG).
# Thêm loại mới: khai báo 1 entry ở SMARTREADER_ENDPOINTS + 1 entry mapping ở đây.
SMARTREADER_MAPPING: dict[str, dict[str, str]] = {
    "GIAY_KHAI_SINH": {
        "hoTenCon": "HO_VA_TEN",
        "ngaySinhCon": "NGAY_SINH",
        "gioiTinhCon": "GIOI_TINH",
        "danTocCon": "DAN_TOC",
        "quocTichCon": "QUOC_TICH",
        "noiSinh": "NOI_SINH",
        "queQuan": "QUE_QUAN",
        "soDinhDanh": "SO_DINH_DANH_CA_NHAN",
        "hoTenMe": "HO_TEN_ME",
        "namSinhMe": "NAM_SINH_ME",
        "hoTenCha": "HO_TEN_BO",
        "namSinhCha": "NAM_SINH_BO",
        "noiDangKy": "NOI_DANG_KY_KHAI_SINH",
        "ngayDangKy": "NGAY_DANG_KY",
        "soGiayTo": "SO",
    },
    "GIAY_KET_HON": {
        "soGiayTo": "SO",
        "hoTenVo": "HO_VA_TEN_VO",
        "hoTenChong": "HO_VA_TEN_CHONG",
        "ngaySinhVo": "NGAY_THANG_NAM_SINH_VO",
        "ngaySinhChong": "NGAY_THANG_NAM_SINH_CHONG",
        "danTocVo": "DAN_TOC_CUA_VO",
        "danTocChong": "DAN_TOC_CUA_CHONG",
        "quocTichVo": "QUOC_TICH_VO",
        "quocTichChong": "QUOC_TICH_CHONG",
        "noiCuTruVo": "NOI_CU_TRU_CUA_VO",
        "noiCuTruChong": "NOI_CU_TRU_CUA_CHONG",
        "giayToVo": "GIAY_TO_TUY_THAN_CUA_VO",
        "giayToChong": "GIAY_TO_TUY_THAN_CUA_CHONG",
        "noiDangKy": "NOI_DANG_KY_KET_HON",
        "ngayDangKy": "NGAY_DANG_KY",
    },
    # Key VNPT đã xác minh bằng response thật (scripts/debug-hkd-raw.py, server 1.5.8).
    # Endpoint dang-ky-ho-kinh-doanh trả object phẳng với các key dưới đây.
    "HO_KINH_DOANH": {
        "tenHoKinhDoanh": "ten_ho_kinh_doanh",
        "maSoHoKinhDoanh": "so_giay_phep_kinh_doanh",
        "diaChiKinhDoanh": "dia_diem_kinh_doanh",
        "hoTenChuHo": "ten_nguoi_dai_dien",
        "soGiayTo": "cmnd_cccd",
        "ngaySinhChuHo": "ngay_sinh_ho_kinh_doanh",
        "noiThuongTruChuHo": "ho_khau_thuong_tru",
        "vonKinhDoanh": "von_kinh_doanh",
        "nganhNghe": "nganh_nghe",
        "ngayCap": "ngay_cap",
    },
    # Văn bản hành chính chung (v2) — chỉ map field định danh cốt lõi, ít ổn định.
    "VAN_BAN_HANH_CHINH": {
        "tenVanBan": "ten_van_ban",
        "soVanBan": "so_van_ban",
        "coQuanBanHanh": "ten_co_quan_thuc_hien",
        "ngayBanHanh": "ngay_ban_hanh_van_ban",
    },
}

# Endpoint SmartReader theo loại giấy tờ. Thêm loại mới: thêm 1 dòng ở đây + 1 mapping ở trên.
SMARTREADER_ENDPOINTS: dict[str, str] = {
    "GIAY_KHAI_SINH": "/rpa-service/aidigdoc/v1/ocr/giay-khai-sinh",
    "GIAY_KET_HON": "/rpa-service/aidigdoc/v1/ocr/giay-dang-ky-ket-hon",
    "HO_KINH_DOANH": "/rpa-service/aidigdoc/v1/ocr/dang-ky-ho-kinh-doanh",
    "VAN_BAN_HANH_CHINH": "/rpa-service/aidigdoc/v2/ocr/van-ban-hanh-chinh",
}

@dataclass(frozen=True)
class OcrResult:
    fields: dict[str, dict[str, Any]]
    avg_confidence: float
    processing_time_ms: int
    liveness: bool | None
    image_quality: dict[str, Any]


class OcrService:
    def __init__(self, settings: Settings, http: httpx.AsyncClient):
        self.settings = settings
        self.http = http

    @property
    def configured(self) -> bool:
        return bool(
            self.settings.VNPT_BASE_URL
            and self.settings.VNPT_SMARTREADER_TOKEN_ID
            and self.settings.VNPT_SMARTREADER_TOKEN_KEY
            and self.settings.VNPT_SMARTREADER_ACCESS_TOKEN
        )

    @property
    def ekyc_configured(self) -> bool:
        return bool(
            self.settings.VNPT_BASE_URL
            and self.settings.VNPT_EKYC_TOKEN_ID
            and self.settings.VNPT_EKYC_TOKEN_KEY
            and self.settings.VNPT_EKYC_ACCESS_TOKEN
        )

    async def extract(
        self,
        image: bytes,
        document_type: str,
    ) -> OcrResult:
        started = time.perf_counter()
        image = preprocess_image(image)
        quality = self._assess_quality(image)

        if document_type in EKYC_MAPPING:
            if not self.ekyc_configured:
                return self._mock_result(document_type, quality, started)
            return await self._extract_ekyc(image, document_type, quality, started)

        if document_type not in SMARTREADER_ENDPOINTS:
            raise UnsupportedDocumentType(
                f"Loại giấy '{document_type}' chưa hỗ trợ OCR (không có endpoint VNPT)"
            )
        if not self.configured:
            return self._mock_result(document_type, quality, started)

        return await self._extract_smartreader(image, document_type, quality, started)

    async def _extract_smartreader(
        self,
        image: bytes,
        document_type: str,
        quality: dict[str, Any],
        started: float,
    ) -> OcrResult:
        base = self.settings.VNPT_BASE_URL.rstrip("/")
        headers = self._smartreader_headers
        filename, content_type, is_pdf = self._detect_file(image)
        image_hash = await self._upload(
            image,
            base,
            headers,
            filename=filename,
            content_type=content_type,
        )
        response = await self.http.post(
            f"{base}{SMARTREADER_ENDPOINTS[document_type]}",
            headers=headers,
            json={
                "file_hash": image_hash,
                "file_type": "PDF" if is_pdf else "Image",
                "token": uuid.uuid4().hex,
                "client_session": self._client_session(),
                "details": False,
            },
            timeout=90,
        )
        response.raise_for_status()
        normalized = self._normalize(response.json(), document_type)
        return OcrResult(
            fields=normalized.fields,
            avg_confidence=normalized.avg_confidence,
            processing_time_ms=int((time.perf_counter() - started) * 1000),
            liveness=None,
            image_quality={**quality, "ocrConfidence": normalized.avg_confidence},
        )

    async def _extract_ekyc(
        self,
        image: bytes,
        document_type: str,
        quality: dict[str, Any],
        started: float,
    ) -> OcrResult:
        """OCR giấy tờ tùy thân qua eKYC path web (chỉ mặt trước, tự classify loại)."""
        base = self.settings.VNPT_BASE_URL.rstrip("/")
        headers = self._ekyc_headers
        _, content_type, _ = self._detect_file(image)
        image_hash = await self._upload(
            image,
            base,
            headers,
            filename="front.jpg",
            content_type=content_type,
        )
        response = await self.http.post(
            f"{base}/ai/v1/web/ocr/id",
            headers=headers,
            json={
                "img_front": image_hash,
                "step_id": 0,
                "validate_postcode": False,
                "crop_param": "0,0",
                "client_session": self._client_session(web=True),
                "token": uuid.uuid4().hex,
                "type": -1,
            },
            timeout=90,
        )
        response.raise_for_status()
        normalized = self._normalize_ekyc(response.json(), document_type)
        return OcrResult(
            fields=normalized.fields,
            avg_confidence=normalized.avg_confidence,
            processing_time_ms=int((time.perf_counter() - started) * 1000),
            liveness=None,
            image_quality={**quality, "ocrConfidence": normalized.avg_confidence},
        )

    def _mock_result(self, document_type: str, quality: dict[str, Any], started: float) -> OcrResult:
        fields = self._mock_fields(document_type)
        avg_confidence = min(
            0.92,
            max(0.35, quality["ocrConfidence"] if fields else 0.0),
        )
        return OcrResult(
            fields={
                key: {**value, "confidence": min(float(value["confidence"]), avg_confidence)}
                for key, value in fields.items()
            },
            avg_confidence=round(avg_confidence, 3) if fields else 0.0,
            processing_time_ms=int((time.perf_counter() - started) * 1000),
            liveness=None,
            image_quality={**quality, "ocrConfidence": round(avg_confidence, 3) if fields else quality["ocrConfidence"]},
        )

    @staticmethod
    def _mock_fields(document_type: str) -> dict[str, dict[str, Any]]:
        samples: dict[str, dict[str, str]] = {
            "CCCD": {
                "soCCCD": "001234567890",
                "hoTen": "NGUYEN VAN A",
                "ngaySinh": "01/01/2000",
                "gioiTinh": "Nam",
                "quocTich": "Việt Nam",
                "noiThuongTru": "Phường Minh Khai, Hà Nội",
                "ngayHetHan": "01/01/2035",
            },
            "CMND": {
                "soCMND": "123456789",
                "hoTen": "NGUYEN VAN A",
                "ngaySinh": "01/01/2000",
                "gioiTinh": "Nam",
                "noiThuongTru": "Phường Minh Khai, Hà Nội",
            },
            "GIAY_KHAI_SINH": {
                "hoTenCon": "NGUYEN VAN A",
                "ngaySinhCon": "01/01/2000",
                "gioiTinhCon": "Nam",
                "quocTichCon": "Việt Nam",
                "noiSinh": "Hà Nội",
                "hoTenMe": "TRAN THI B",
                "hoTenCha": "NGUYEN VAN C",
                "noiDangKy": "UBND phường Minh Khai",
                "ngayDangKy": "05/01/2000",
                "soGiayTo": "01/2000/KS",
            },
            "GIAY_KET_HON": {
                "soGiayTo": "12/2026/KH",
                "hoTenVo": "TRAN THI B",
                "hoTenChong": "NGUYEN VAN A",
                "ngaySinhVo": "02/02/2001",
                "ngaySinhChong": "01/01/2000",
                "noiDangKy": "UBND phường Minh Khai",
                "ngayDangKy": "01/06/2026",
            },
            "HO_KINH_DOANH": {
                "tenHoKinhDoanh": "Hộ kinh doanh An Phát",
                "maSoHoKinhDoanh": "01A8001234",
                "diaChiKinhDoanh": "12 Phố Huế, Hà Nội",
                "hoTenChuHo": "NGUYEN VAN A",
                "soGiayTo": "001234567890",
                "ngaySinhChuHo": "01/01/2000",
                "nganhNghe": "Bán lẻ thực phẩm",
                "ngayCap": "01/01/2025",
            },
            "VAN_BAN_HANH_CHINH": {
                "tenVanBan": "Văn bản ủy quyền",
                "soVanBan": "01/UQ",
                "coQuanBanHanh": "UBND phường Minh Khai",
                "ngayBanHanh": "01/07/2026",
            },
        }
        return {
            key: {"value": value, "confidence": 0.92}
            for key, value in samples.get(document_type, {}).items()
        }

    @property
    def _smartreader_headers(self) -> dict[str, str]:
        token = self.settings.VNPT_SMARTREADER_ACCESS_TOKEN.strip()
        authorization = token if token.lower().startswith("bearer ") else f"Bearer {token}"
        return {
            "Token-id": self.settings.VNPT_SMARTREADER_TOKEN_ID,
            "Token-key": self.settings.VNPT_SMARTREADER_TOKEN_KEY,
            "Authorization": authorization,
            "mac-address": "EGOV-DIGDOC-WEB-API",
        }

    @property
    def _ekyc_headers(self) -> dict[str, str]:
        token = self.settings.VNPT_EKYC_ACCESS_TOKEN.strip()
        authorization = token if token.lower().startswith("bearer ") else f"Bearer {token}"
        return {
            "Token-id": self.settings.VNPT_EKYC_TOKEN_ID,
            "Token-key": self.settings.VNPT_EKYC_TOKEN_KEY,
            "Authorization": authorization,
            "mac-address": "WEB-001",
        }

    @staticmethod
    def _client_session(web: bool = False) -> str:
        if web:
            return f"WEB-SDK_Chrome-134_3.1.0.0_{uuid.uuid4()}_{int(time.time() * 1000)}"
        return f"ANDROID_govtrust_api_Server_1.0_{uuid.uuid4().hex}_{int(time.time())}"

    @staticmethod
    def _detect_file(data: bytes) -> tuple[str, str, bool]:
        """Nhận diện định dạng từ magic byte -> (filename, content_type, is_pdf).
        Sau preprocess input chỉ còn PDF hoặc JPEG; giữ PNG/WebP cho chắc."""
        head = data[:12]
        if head[:5].lower().startswith(b"%pdf"):
            return "document.pdf", "application/pdf", True
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            return "document.png", "image/png", False
        if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
            return "document.webp", "image/webp", False
        return "document.jpg", "image/jpeg", False

    @staticmethod
    def _assess_quality(data: bytes) -> dict[str, Any]:
        try:
            import cv2
            import numpy as np
            from PIL import Image

            with Image.open(__import__("io").BytesIO(data)) as image:
                rgb = image.convert("RGB")
                width, height = rgb.size
                arr = np.array(rgb)
            gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
            brightness = float(gray.mean() / 255.0)
            blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            is_blurry = blur_variance < 35.0 or min(width, height) < 500
            confidence = 0.9
            if is_blurry:
                confidence -= 0.25
            if brightness < 0.35 or brightness > 0.92:
                confidence -= 0.2
            return {
                "isBlurry": bool(is_blurry),
                "brightness": round(max(0.0, min(1.0, brightness)), 3),
                "resolution": f"{width}x{height}",
                "ocrConfidence": round(max(0.2, min(0.98, confidence)), 3),
            }
        except Exception:
            return {
                "isBlurry": True,
                "brightness": 0.0,
                "resolution": "unknown",
                "ocrConfidence": 0.45,
            }

    async def _upload(
        self,
        image: bytes,
        base: str,
        headers: dict[str, str],
        filename: str = "document.jpg",
        content_type: str = "image/jpeg",
    ) -> str:
        """Bắt buộc trước mọi API VNPT: upload file -> trả mã hash (sống 7 ngày)."""
        response = await self.http.post(
            f"{base}/file-service/v1/addFile",
            headers=headers,
            files={"file": (filename, image, content_type)},
            data={"title": "govtrust-ocr", "description": "GovTrust OCR upload"},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        hash_value = (payload.get("object") or {}).get("hash")
        if not hash_value:
            raise RuntimeError(f"VNPT addFile không trả hash: {payload.get('message')}")
        return hash_value

    @staticmethod
    def _normalize(raw: dict, document_type: str) -> OcrResult:
        """SmartReader (details=false) trả object phẳng, không có confidence per-field."""
        mapping = SMARTREADER_MAPPING.get(document_type, {})
        obj = raw.get("object") or {}
        fields: dict[str, dict[str, Any]] = {}
        for internal_key, source_key in mapping.items():
            value = obj.get(source_key)
            if value in (None, "", "-"):
                continue
            fields[internal_key] = {"value": str(value).strip(), "confidence": 0.95}
        average = 0.95 if fields else 0
        return OcrResult(fields, round(average, 3), 0, None, {})

    @staticmethod
    def _ekyc_confidence(obj: dict, source_key: str) -> float:
        """id dùng id_probs (list per-char) -> trung bình; trường khác dùng <key>_prob."""
        if source_key == "id" and isinstance(obj.get("id_probs"), list) and obj["id_probs"]:
            probs = [float(p) for p in obj["id_probs"]]
            return round(sum(probs) / len(probs), 4) if probs else 0.9
        prob = obj.get(f"{source_key}_prob")
        try:
            return round(float(prob), 4) if prob is not None else 0.9
        except (TypeError, ValueError):
            return 0.9

    @classmethod
    def _normalize_ekyc(cls, raw: dict, document_type: str) -> OcrResult:
        """eKYC web OCR trả object với field bóc tách + <key>_prob cho độ tin cậy."""
        mapping = EKYC_MAPPING.get(document_type, {})
        obj = raw.get("object") or {}
        fields: dict[str, dict[str, Any]] = {}
        for internal_key, source_key in mapping.items():
            value = obj.get(source_key)
            if value in (None, "", "-"):
                continue
            fields[internal_key] = {
                "value": str(value).strip(),
                "confidence": cls._ekyc_confidence(obj, source_key),
            }
        average = (
            sum(item["confidence"] for item in fields.values()) / len(fields) if fields else 0
        )
        return OcrResult(fields, round(average, 3), 0, None, {})
