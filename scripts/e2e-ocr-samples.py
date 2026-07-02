#!/usr/bin/env python3
"""E2E OCR thật qua VNPT — dùng ảnh mẫu thật trong sample/.

Chạy trên host (đọc .env để lấy token VNPT):
    apps/ai-svc/.venv/bin/python scripts/e2e-ocr-samples.py

Mục đích: kiểm luồng OCR thật đầu-cuối cho 2 domain (khai sinh + hộ kinh doanh),
và soi rủi ro mapping HO_KINH_DOANH (snake_case chưa verify với tài liệu API).
In ra field bóc tách được + cảnh báo nếu field kỳ vọng bị rỗng.
"""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "ai-svc"))

from app.config import Settings  # noqa: E402
from app.container import AppContainer  # noqa: E402
from app.services.ocr import (  # noqa: E402
    SMARTREADER_MAPPING,
    OcrUnavailableError,
    UnsupportedDocumentType,
)

SAMPLE = ROOT / "sample"

# (đường dẫn ảnh, document_type_code, các field internal kỳ vọng có giá trị)
CASES = [
    (SAMPLE / "giay-khai-sinh_sample.pdf", "GIAY_KHAI_SINH", ["hoTenCon", "ngaySinhCon", "noiDangKy"]),
    (SAMPLE / "giay-dang-ky-ho-kinh-doanh_sample.jpg", "HO_KINH_DOANH", ["tenHoKinhDoanh", "hoTenChuHo", "maSoHoKinhDoanh"]),
    (SAMPLE / " giay-dang-ky-ket-hon_sample.pdf", "GIAY_KET_HON", ["hoTenVo", "hoTenChong"]),
]


async def run() -> int:
    settings = Settings()
    container = AppContainer(settings)
    failures = 0
    try:
        for path, doc_type, expected in CASES:
            print(f"\n=== {doc_type} — {path.name} ===")
            if not path.exists():
                print(f"  ⚠ Bỏ qua: không tìm thấy {path}")
                continue
            try:
                result = await container.ocr.extract(path.read_bytes(), doc_type)
            except UnsupportedDocumentType as exc:
                print(f"  ✗ Loại giấy không hỗ trợ: {exc}")
                failures += 1
                continue
            except OcrUnavailableError as exc:
                print(f"  ✗ VNPT chưa cấu hình: {exc}")
                failures += 1
                continue
            except Exception as exc:  # noqa: BLE001
                print(f"  ✗ Lỗi gọi VNPT: {type(exc).__name__}: {exc}")
                failures += 1
                continue

            print(f"  avg_confidence={result.avg_confidence} | {len(result.fields)} field")
            for key, val in result.fields.items():
                print(f"    - {key}: {val['value']!r} ({val['confidence']})")

            missing = [f for f in expected if f not in result.fields]
            if missing:
                mapping = SMARTREADER_MAPPING.get(doc_type, {})
                print(f"  ⚠ FIELD RỖNG (kỳ vọng có): {missing}")
                print(f"    → Kiểm key VNPT thực tế. Mapping hiện tại: "
                      f"{ {f: mapping.get(f) for f in missing} }")
                failures += 1
            else:
                print("  ✓ Đủ field kỳ vọng")
    finally:
        await container.close()

    print(f"\n=== KẾT QUẢ: {len(CASES) - failures}/{len(CASES)} case đủ field ===")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
