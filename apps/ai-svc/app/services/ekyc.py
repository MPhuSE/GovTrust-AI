"""eKYC service: xác thực danh tính qua VNPT eKYC API.

Flow đầy đủ:
1. Upload 3 ảnh (CCCD trước, sau, selfie) → 3 hash
2. OCR /ai/v1/web/ocr/id {img_front, img_back} → fields + match_front_back
3. Liveness /ai/v1/face/liveness {img} → success/failure
4. Compare /ai/v1/web/face/compare {img_front, img_face} → MATCH/NOMATCH + prob
"""

import logging
import time
import uuid
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import Settings
from app.services.preprocess import preprocess_image

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EkycResult:
    verified: bool
    ocr_fields: dict[str, dict[str, Any]]
    match_front_back: dict[str, str]
    face_match: bool
    face_match_prob: float
    liveness: bool
    liveness_prob: float
    warnings: list[str]
    processing_time_ms: int


class EkycService:
    def __init__(self, settings: Settings, http: httpx.AsyncClient):
        self.settings = settings
        self.http = http

    @property
    def configured(self) -> bool:
        return bool(
            self.settings.VNPT_BASE_URL
            and self.settings.VNPT_EKYC_TOKEN_ID
            and self.settings.VNPT_EKYC_TOKEN_KEY
            and self.settings.VNPT_EKYC_ACCESS_TOKEN
        )

    async def full_verify(
        self, front_img: bytes, back_img: bytes, selfie_img: bytes
    ) -> EkycResult:
        started = time.perf_counter()
        warnings: list[str] = []

        if not self.configured:
            return EkycResult(
                verified=False, ocr_fields={}, match_front_back={},
                face_match=False, face_match_prob=0, liveness=False, liveness_prob=0,
                warnings=["VNPT eKYC chưa cấu hình"], processing_time_ms=0,
            )

        base = self.settings.VNPT_BASE_URL.rstrip("/")
        headers = self._headers

        front_img = preprocess_image(front_img)
        back_img = preprocess_image(back_img)
        selfie_img = preprocess_image(selfie_img)

        front_hash = await self._upload(front_img, base, headers)
        back_hash = await self._upload(back_img, base, headers)
        face_hash = await self._upload(selfie_img, base, headers)

        ocr_data = await self._ocr(base, headers, front_hash, back_hash)
        ocr_fields = self._extract_ocr_fields(ocr_data)
        match_fb = self._extract_match_front_back(ocr_data)
        self._collect_ocr_warnings(ocr_data, warnings)

        liveness_data = await self._face_liveness(base, headers, face_hash)
        liveness_ok = liveness_data.get("liveness") == "success"
        liveness_prob = float(liveness_data.get("liveness_prob", 1.0))
        if not liveness_ok:
            warnings.append(f"Liveness failed: {liveness_data.get('liveness_msg', 'unknown')}")

        compare_data = await self._face_compare(base, headers, front_hash, face_hash)
        face_match = compare_data.get("msg") == "MATCH"
        face_prob = float(compare_data.get("prob", 0))
        if not face_match:
            warnings.append("Khuôn mặt không khớp với ảnh trên CCCD")
        if compare_data.get("multiple_faces"):
            warnings.append("Phát hiện nhiều khuôn mặt trong ảnh")

        verified = liveness_ok and face_match and not any(
            match_fb.get(k) == "no" for k in ("match_id", "match_name", "match_bod")
        )

        return EkycResult(
            verified=verified,
            ocr_fields=ocr_fields,
            match_front_back=match_fb,
            face_match=face_match,
            face_match_prob=face_prob,
            liveness=liveness_ok,
            liveness_prob=liveness_prob,
            warnings=warnings,
            processing_time_ms=int((time.perf_counter() - started) * 1000),
        )

    async def _ocr(
        self, base: str, headers: dict, front_hash: str, back_hash: str
    ) -> dict:
        resp = await self.http.post(
            f"{base}/ai/v1/web/ocr/id",
            headers=headers,
            json={
                "img_front": front_hash,
                "img_back": back_hash,
                "type": -1,
                "validate_postcode": False,
                "crop_param": "0,0",
                "client_session": self._client_session(),
                "token": uuid.uuid4().hex,
            },
            timeout=90,
        )
        resp.raise_for_status()
        return resp.json()

    async def _face_liveness(
        self, base: str, headers: dict, face_hash: str
    ) -> dict:
        resp = await self.http.post(
            f"{base}/ai/v1/face/liveness",
            headers=headers,
            json={
                "img": face_hash,
                "client_session": self._client_session(),
                "token": uuid.uuid4().hex,
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json().get("object", {})

    async def _face_compare(
        self, base: str, headers: dict, front_hash: str, face_hash: str
    ) -> dict:
        resp = await self.http.post(
            f"{base}/ai/v1/web/face/compare",
            headers=headers,
            json={
                "img_front": front_hash,
                "img_face": face_hash,
                "client_session": self._client_session(),
                "token": uuid.uuid4().hex,
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json().get("object", {})

    async def _upload(self, image: bytes, base: str, headers: dict) -> str:
        _, content_type, _ = self._detect_file(image)
        resp = await self.http.post(
            f"{base}/file-service/v1/addFile",
            headers=headers,
            files={"file": ("document.jpg", image, content_type)},
            data={"title": "govtrust-ekyc", "description": "eKYC verify"},
            timeout=30,
        )
        resp.raise_for_status()
        payload = resp.json()
        hash_value = (payload.get("object") or {}).get("hash")
        if not hash_value:
            raise RuntimeError(f"VNPT addFile không trả hash: {payload.get('message')}")
        return hash_value

    @property
    def _headers(self) -> dict[str, str]:
        token = self.settings.VNPT_EKYC_ACCESS_TOKEN.strip()
        auth = token if token.lower().startswith("bearer ") else f"Bearer {token}"
        return {
            "Token-id": self.settings.VNPT_EKYC_TOKEN_ID,
            "Token-key": self.settings.VNPT_EKYC_TOKEN_KEY,
            "Authorization": auth,
            "mac-address": "WEB-001",
        }

    @staticmethod
    def _client_session() -> str:
        return f"WEB-SDK_Chrome-134_3.1.0.0_{uuid.uuid4()}_{int(time.time() * 1000)}"

    @staticmethod
    def _detect_file(data: bytes) -> tuple[str, str, bool]:
        head = data[:12]
        if head[:5].lower().startswith(b"%pdf"):
            return "document.pdf", "application/pdf", True
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            return "document.png", "image/png", False
        return "document.jpg", "image/jpeg", False

    FIELD_MAP = {
        "soCCCD": "cccdNumber", "hoTen": "fullName", "ngaySinh": "birthDay",
        "gioiTinh": "gender", "quocTich": "nationality",
        "queQuan": "originLocation", "noiThuongTru": "recentLocation",
        "ngayHetHan": "validDate", "issue_date": "issueDate", "issue_place": "issuePlace",
    }

    @classmethod
    def _extract_ocr_fields(cls, raw: dict) -> dict[str, dict[str, Any]]:
        obj = raw.get("object") or {}
        fields: dict[str, dict[str, Any]] = {}
        for vnpt_key, internal_key in cls.FIELD_MAP.items():
            value = obj.get(vnpt_key)
            if value in (None, "", "-"):
                continue
            prob_key = f"{vnpt_key}_prob"
            prob = obj.get(prob_key, 0.9)
            try:
                prob = round(float(prob), 4)
            except (TypeError, ValueError):
                prob = 0.9
            fields[internal_key] = {"value": str(value).strip(), "confidence": prob}
        return fields

    @staticmethod
    def _extract_match_front_back(raw: dict) -> dict[str, str]:
        obj = raw.get("object") or {}
        mfb = obj.get("match_front_back") or {}
        return {
            "match_id": mfb.get("match_id", ""),
            "match_name": mfb.get("match_name", ""),
            "match_bod": mfb.get("match_bod", ""),
            "match_sex": mfb.get("match_sex", ""),
            "match_valid_date": mfb.get("match_valid_date", ""),
        }

    @staticmethod
    def _collect_ocr_warnings(raw: dict, warnings: list[str]) -> None:
        obj = raw.get("object") or {}
        gw = obj.get("general_warning") or []
        known = {
            "chat_luong_anh_dau_vao_khong_dat_chuan": "Chất lượng ảnh không đạt chuẩn",
            "anh_dau_vao_mat_goc": "Ảnh bị mất góc/lóa",
            "anh_dau_vao_mo_nhoe": "Ảnh bị mờ nhòe",
            "mat_truoc_mat_sau_khong_khop": "Mặt trước và sau không khớp",
            "id_duc_lo": "Giấy tờ bị đục lỗ",
        }
        for w in gw:
            msg = known.get(w, w)
            warnings.append(msg)
        tampering = obj.get("tampering") or {}
        for key, val in tampering.items():
            if val in (True, "true", "True"):
                warnings.append(f"Phát hiện giả mạo: {key}")
