#!/usr/bin/env python3
"""Debug: in RAW JSON VNPT trả về cho giấy hộ kinh doanh, để lấy đúng tên key.

Chạy: apps/ai-svc/.venv/bin/python scripts/debug-hkd-raw.py

Dùng khi mapping HO_KINH_DOANH ra field rỗng — xem VNPT thật đặt key gì rồi
cập nhật SMARTREADER_MAPPING["HO_KINH_DOANH"] trong app/services/ocr.py.
"""

import asyncio
import json
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "ai-svc"))

from app.config import Settings  # noqa: E402
from app.container import AppContainer  # noqa: E402
from app.services.ocr import SMARTREADER_ENDPOINTS  # noqa: E402
from app.services.preprocess import preprocess_image  # noqa: E402

IMAGE = ROOT / "sample" / "giay-dang-ky-ho-kinh-doanh_sample.jpg"
DOC_TYPE = "HO_KINH_DOANH"


async def run() -> int:
    settings = Settings()
    container = AppContainer(settings)
    ocr = container.ocr
    try:
        if not ocr.configured:
            print("✗ VNPT SmartReader chưa cấu hình (.env thiếu token)")
            return 1
        base = settings.VNPT_BASE_URL.rstrip("/")
        headers = ocr._smartreader_headers
        image = preprocess_image(IMAGE.read_bytes())
        filename, content_type, is_pdf = ocr._detect_file(image)
        image_hash = await ocr._upload(image, base, headers, filename=filename, content_type=content_type)
        response = await container.http.post(
            f"{base}{SMARTREADER_ENDPOINTS[DOC_TYPE]}",
            headers=headers,
            json={
                "file_hash": image_hash,
                "file_type": "PDF" if is_pdf else "Image",
                "token": uuid.uuid4().hex,
                "client_session": ocr._client_session(),
                "details": False,
            },
            timeout=90,
        )
        response.raise_for_status()
        payload = response.json()
        print("=== RAW JSON VNPT ===")
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        obj = payload.get("object") or {}
        print("\n=== KEY trong object ===")
        for key in obj:
            print(f"  {key!r}: {str(obj[key])[:60]!r}")
    finally:
        await container.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
