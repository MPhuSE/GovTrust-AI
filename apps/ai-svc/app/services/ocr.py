import io
import logging
import time
import uuid
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import Settings


logger = logging.getLogger(__name__)

# Mở rộng khả năng đọc ảnh (HEIC/HEIF/AVIF) cho Pillow; bỏ qua nếu thiếu plugin.
try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except Exception:  # pragma: no cover - chỉ mất hỗ trợ HEIC/AVIF
    logger.info("pillow-heif không sẵn sàng; bỏ qua hỗ trợ HEIC/AVIF")

# Map nội bộ (key dùng bởi rule-engine/CrossCheck) -> key thật trong object của VNPT eKYC.
# eKYC OCR chỉ hỗ trợ CMND/CCCD/Hộ chiếu/BLX.
FIELD_MAPPING: dict[str, dict[str, str]] = {
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
# LƯU Ý: key VNPT khác nhau theo từng endpoint (khai sinh IN HOA, kết hôn chữ thường).
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
    "HO_KINH_DOANH": {
        "tenHoKinhDoanh": "ten_ho_kinh_doanh",
        "maSoHoKinhDoanh": "ma_so_ho_kinh_doanh",
        "diaChiKinhDoanh": "dia_chi_kinh_doanh",
        "hoTenChuHo": "ho_ten_chu_ho",
        "soGiayTo": "so_giay_to_tuy_than",
        "nganhNghe": "nganh_nghe_kinh_doanh",
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


class OcrService:
    def __init__(self, settings: Settings, http: httpx.AsyncClient):
        self.settings = settings
        self.http = http

    @property
    def configured(self) -> bool:
        return bool(
            self.settings.VNPT_EKYC_BASE_URL
            and self.settings.VNPT_EKYC_TOKEN_ID
            and self.settings.VNPT_EKYC_TOKEN_KEY
            and self.settings.VNPT_EKYC_ACCESS_TOKEN
        )

    @property
    def smartreader_configured(self) -> bool:
        return bool(
            self.settings.VNPT_SMARTREADER_BASE_URL
            and self.settings.VNPT_SMARTREADER_TOKEN_ID
            and self.settings.VNPT_SMARTREADER_TOKEN_KEY
            and self.settings.VNPT_SMARTREADER_ACCESS_TOKEN
        )

    async def extract(
        self,
        image: bytes,
        document_type: str,
        run_liveness: bool = False,
    ) -> OcrResult:
        if document_type in SMARTREADER_ENDPOINTS:
            if self.smartreader_configured:
                return await self._extract_smartreader(image, document_type)
            logger.warning("VNPT SmartReader chưa cấu hình; dùng OCR mock")
            return self._mock_result(document_type, run_liveness)

        if not self.configured:
            logger.warning("VNPT eKYC chưa cấu hình; dùng OCR mock")
            return self._mock_result(document_type, run_liveness)

        started = time.perf_counter()
        image = self._normalize_input(image)
        filename, content_type, _ = self._detect_file(image)
        image_hash = await self._upload(
            image,
            self._base,
            self._headers,
            filename=filename,
            content_type=content_type,
        )
        client_session = self._client_session()

        response = await self.http.post(
            f"{self._base}/ai/v1/ocr/id",
            headers=self._headers,
            json={
                "img_front": image_hash,
                "img_back": "",
                "client_session": client_session,
                "type": -1,
                "validate_postcode": True,
                "crop_param": "0.0,0.0",
                "token": uuid.uuid4().hex,
            },
            timeout=90,
        )
        response.raise_for_status()
        normalized = self._normalize(response.json(), document_type)
        liveness = (
            await self._liveness(image_hash, client_session) if run_liveness else None
        )
        return OcrResult(
            fields=normalized.fields,
            avg_confidence=normalized.avg_confidence,
            processing_time_ms=int((time.perf_counter() - started) * 1000),
            liveness=liveness,
        )

    async def _extract_smartreader(self, image: bytes, document_type: str) -> OcrResult:
        started = time.perf_counter()
        base = self.settings.VNPT_SMARTREADER_BASE_URL.rstrip("/")
        headers = self._build_headers(self.settings.VNPT_SMARTREADER_ACCESS_TOKEN, smartreader=True)
        image = self._normalize_input(image)
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
        normalized = self._normalize_smartreader(response.json(), document_type)
        return OcrResult(
            fields=normalized.fields,
            avg_confidence=normalized.avg_confidence,
            processing_time_ms=int((time.perf_counter() - started) * 1000),
            liveness=None,
        )

    def _mock_result(self, document_type: str, run_liveness: bool) -> OcrResult:
        mock = self._mock(document_type)
        return OcrResult(
            fields=mock.fields,
            avg_confidence=mock.avg_confidence,
            processing_time_ms=0,
            liveness=True if run_liveness else None,
        )

    @property
    def _base(self) -> str:
        return self.settings.VNPT_EKYC_BASE_URL.rstrip("/")

    @property
    def _headers(self) -> dict[str, str]:
        return self._build_headers(self.settings.VNPT_EKYC_ACCESS_TOKEN)

    def _build_headers(self, access_token: str, smartreader: bool = False) -> dict[str, str]:
        token = access_token.strip()
        authorization = token if token.lower().startswith("bearer ") else f"Bearer {token}"
        if smartreader:
            token_id = self.settings.VNPT_SMARTREADER_TOKEN_ID
            token_key = self.settings.VNPT_SMARTREADER_TOKEN_KEY
        else:
            token_id = self.settings.VNPT_EKYC_TOKEN_ID
            token_key = self.settings.VNPT_EKYC_TOKEN_KEY
        return {
            "Token-id": token_id,
            "Token-key": token_key,
            "Authorization": authorization,
            "mac-address": "EGOV-DIGDOC-WEB-API",
        }

    @staticmethod
    def _client_session() -> str:
        return f"ANDROID_govtrust_api_Server_1.0_{uuid.uuid4().hex}_{int(time.time())}"

    @staticmethod
    def _normalize_input(data: bytes) -> bytes:
        """Chuẩn hóa input về định dạng VNPT nhận trực tiếp.
        PDF/JPEG/PNG giữ nguyên; mọi định dạng ảnh khác (WebP/AVIF/HEIC/TIFF/BMP/GIF...)
        convert sang JPEG. Không decode được thì trả nguyên bytes."""
        head = data[:12]
        if (
            head[:5].lower().startswith(b"%pdf")
            or head[:3] == b"\xff\xd8\xff"
            or head[:8] == b"\x89PNG\r\n\x1a\n"
        ):
            return data
        try:
            from PIL import Image

            with Image.open(io.BytesIO(data)) as img:
                rgb = img.convert("RGB")
                buf = io.BytesIO()
                rgb.save(buf, format="JPEG", quality=95)
                return buf.getvalue()
        except Exception as exc:
            logger.warning("Không convert được ảnh sang JPEG (%s); gửi nguyên bytes", exc)
            return data

    @staticmethod
    def _detect_file(data: bytes) -> tuple[str, str, bool]:
        """Nhận diện định dạng từ magic byte -> (filename, content_type, is_pdf).
        Hỗ trợ PDF/JPEG/PNG/WebP; mặc định JPEG nếu không khớp."""
        head = data[:12]
        if head[:5].lower().startswith(b"%pdf"):
            return "document.pdf", "application/pdf", True
        if head[:3] == b"\xff\xd8\xff":
            return "document.jpg", "image/jpeg", False
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            return "document.png", "image/png", False
        if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
            return "document.webp", "image/webp", False
        return "document.jpg", "image/jpeg", False

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

    async def _liveness(self, image_hash: str, client_session: str) -> bool:
        response = await self.http.post(
            f"{self._base}/ai/v1/card/liveness",
            headers=self._headers,
            json={
                "img": image_hash,
                "client_session": client_session,
                "crop_param": "0.0,0.0",
                "token": uuid.uuid4().hex,
            },
            timeout=90,
        )
        response.raise_for_status()
        obj = response.json().get("object") or {}
        return str(obj.get("liveness", "")).lower() == "success"

    @staticmethod
    def _confidence(obj: dict, source_key: str) -> float:
        """id dùng id_probs (list per-char) -> trung bình; các trường khác dùng <key>_prob."""
        if source_key == "id" and isinstance(obj.get("id_probs"), list) and obj["id_probs"]:
            probs = [float(p) for p in obj["id_probs"]]
            return round(sum(probs) / len(probs), 4)
        prob = obj.get(f"{source_key}_prob")
        try:
            return round(float(prob), 4) if prob is not None else 0.9
        except (TypeError, ValueError):
            return 0.9

    @classmethod
    def _normalize(cls, raw: dict, document_type: str) -> OcrResult:
        mapping = FIELD_MAPPING.get(document_type, {})
        obj = raw.get("object") or {}
        fields: dict[str, dict[str, Any]] = {}
        for internal_key, source_key in mapping.items():
            value = obj.get(source_key)
            if value in (None, "", "-"):
                continue
            fields[internal_key] = {
                "value": str(value).strip(),
                "confidence": cls._confidence(obj, source_key),
            }
        average = (
            sum(item["confidence"] for item in fields.values()) / len(fields)
            if fields
            else 0
        )
        return OcrResult(fields, round(average, 3), 0, None)

    @staticmethod
    def _normalize_smartreader(raw: dict, document_type: str) -> OcrResult:
        """SmartReader (details=false) trả object phẳng key IN HOA, không có confidence per-field."""
        mapping = SMARTREADER_MAPPING.get(document_type, {})
        obj = raw.get("object") or {}
        fields: dict[str, dict[str, Any]] = {}
        for internal_key, source_key in mapping.items():
            value = obj.get(source_key)
            if value in (None, "", "-"):
                continue
            fields[internal_key] = {"value": str(value).strip(), "confidence": 0.95}
        average = 0.95 if fields else 0
        return OcrResult(fields, round(average, 3), 0, None)

    @staticmethod
    def _mock(document_type: str) -> OcrResult:
        samples = {
            "CCCD": {
                "hoTen": {"value": "Nguyễn Văn An", "confidence": 0.98},
                "soCCCD": {"value": "012345678901", "confidence": 0.99},
                "ngaySinh": {"value": "01/01/1990", "confidence": 0.97},
                "ngayHetHan": {"value": "01/01/2035", "confidence": 0.96},
            },
            "GIAY_CHUNG_SINH": {
                "hoTenMe": {"value": "Trần Thị Bình", "confidence": 0.95},
                "hoTenCon": {"value": "Nguyễn Văn Bảo", "confidence": 0.94},
                "ngaySinh": {"value": "15/06/2026", "confidence": 0.96},
            },
        }
        fields = samples.get(document_type, {})
        average = sum(item["confidence"] for item in fields.values()) / len(fields) if fields else 0
        return OcrResult(fields, round(average, 3), 0, None)
