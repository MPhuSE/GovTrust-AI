#!/usr/bin/env python3
"""
Test script tổng hợp OCR cho 3 loại giấy tờ chính:
1. Giấy khai sinh - VNPT API
2. GCN ĐKHKD - VNPT API
3. Sổ đỏ - Qwen VL API
"""

import json
import base64
from pathlib import Path
import requests

# ============= VNPT Config =============
VNPT_TOKEN_ID = "5494349c-75f2-06e1-e063-62199f0a360c"
VNPT_TOKEN_KEY = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIDyFST4WCCL88lvdCIBuAG2niV0LqFWh8tDx7l4whuJnJmXLo793dikgL53BDWS2t80jhOW8GHGrJeDS+Li/ncCAwEAAQ=="
VNPT_ACCESS_TOKEN = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvbl9pZCI6IjhjODNkOTZmLWJlZTEtNDU1Mi1hYjI2LTc3ODU5NTQ2YmMyYSIsInN1YiI6IjU0OTQzNjQ4LWRkYzctNjIyMC1lMDYzLTYzMTk5ZjBhMGIyMiIsImF1ZCI6WyJyZXN0c2VydmljZSJdLCJ1c2VyX25hbWUiOiJ0ZWFtLjA0QHZucHRhaS5pbyIsInNjb3BlIjpbInJlYWQiXSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3QiLCJuYW1lIjoidGVhbS4wNEB2bnB0YWkuaW8iLCJ1dWlkX2FjY291bnQiOiI1NDk0MzY0OC1kZGM3LTYyMjAtZTA2My02MzE5OWYwYTBiMjIiLCJhdXRob3JpdGllcyI6WyJVU0VSIiwiVFJBQ0tfMSJdLCJqdGkiOiIxYWRiNTlhZC1lODkyLTRmOWQtYmZkNC1hNTJmNGQzMDEyNjYiLCJjbGllbnRfaWQiOiJhZG1pbmFwcCJ9.EQQ-WdwGCQ3oREiiA1OlzOykK_Cgiqimp671-gdxpiOe-RyqeY7jaBrXJQYpgZ0RH2XhHbXay2VTHx79CpxTd8H0M9fKe91gZOPT2r0kGQlekLBdv2b82a1byJ1KVs6KjpupQrzMvSk64IYUIuvNT8q82DLORVNKuuluzb-5yd67lOZw2FK0oRo3dbI_MoMrUOazkS9hvyLBVO9q0hbsyz3CN3fDoq8ZFSofXrVs_OyVzpzLeyYq20TjbJtHWfz5dhWzZuQFPO-XAcEve4j1jt8BKP1KToSzi6aXIJfmreYvQ3vkQn3oSiAIZOzsbyR2vDJSWDZIFLJO_KTrAGgGXg"

# ============= Qwen Config =============
QWEN_API_KEY = "sk-9wWanfXQ5FKAmm5Dc3ZazOAtPtt8uaY9KAoVNH9fhIzSSHz7"

# ============= Test Data =============
TEST_DIR = Path("/home/dangkien/1st-Main/hackaithon/GovTrust-AI/data/test-documents")


def vnpt_upload_file(file_path: str) -> str:
    """Upload file to VNPT and get hash"""
    with open(file_path, 'rb') as f:
        response = requests.post(
            "https://api.idg.vnpt.vn/file-service/v1/addFile",
            headers={
                "Authorization": VNPT_ACCESS_TOKEN,
                "token-id": VNPT_TOKEN_ID,
                "token-key": VNPT_TOKEN_KEY
            },
            files={"file": f},
            data={"title": Path(file_path).name, "description": "Test OCR"}
        )
    response.raise_for_status()
    return response.json()["object"]["hash"]


def vnpt_ocr_giay_khai_sinh(image_path: str) -> dict:
    """OCR giấy khai sinh với VNPT"""
    file_hash = vnpt_upload_file(image_path)

    response = requests.post(
        "https://api.idg.vnpt.vn/rpa-service/aidigdoc/v1/ocr/giay-khai-sinh",
        headers={
            "Content-Type": "application/json",
            "Authorization": VNPT_ACCESS_TOKEN,
            "token-id": VNPT_TOKEN_ID,
            "token-key": VNPT_TOKEN_KEY
        },
        json={
            "file_hash": file_hash,
            "file_type": "image",
            "token": "test-gks",
            "details": False
        }
    )
    response.raise_for_status()
    return response.json()["object"]


def vnpt_ocr_hkd(image_path: str) -> dict:
    """OCR GCN ĐKHKD với VNPT"""
    file_hash = vnpt_upload_file(image_path)

    response = requests.post(
        "https://api.idg.vnpt.vn/rpa-service/aidigdoc/v1/ocr/dang-ky-ho-kinh-doanh",
        headers={
            "Content-Type": "application/json",
            "Authorization": VNPT_ACCESS_TOKEN,
            "token-id": VNPT_TOKEN_ID,
            "token-key": VNPT_TOKEN_KEY
        },
        json={
            "file_hash": file_hash,
            "file_type": "image",
            "token": "test-hkd",
            "client_session": "test-session",
            "details": False
        }
    )
    response.raise_for_status()
    return response.json()["object"]


def qwen_ocr_so_do(image_path: str) -> dict:
    """OCR sổ đỏ với Qwen VL"""
    with open(image_path, "rb") as f:
        image_base64 = base64.b64encode(f.read()).decode("utf-8")

    prompt = """Đọc Giấy chứng nhận quyền sử dụng đất này và trích xuất thông tin:

Trả về JSON:
{
  "tenChuSoHuu": "Họ tên người được cấp (nhiều người nối bằng dấu phẩy)",
  "soCCCD": "Số CCCD/CMND",
  "diaChiThuongTru": "Địa chỉ thường trú",
  "diaChiNha": "Địa chỉ thửa đất",
  "soGiayChungNhan": "Số giấy chứng nhận"
}

CHỈ trả JSON, KHÔNG giải thích."""

    response = requests.post(
        "https://api.shopaikey.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {QWEN_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "qwen3-vl-plus",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                        }
                    ]
                }
            ],
            "max_tokens": 1500,
            "temperature": 0.1
        },
        timeout=60
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]

    # Parse JSON
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    return json.loads(content)


def main():
    print("=" * 80)
    print("TEST OCR TỔNG HỢP - 3 LOẠI GIẤY TỜ")
    print("=" * 80)
    print()

    # Test 1: Giấy khai sinh (VNPT)
    print("1️⃣  GIẤY KHAI SINH (VNPT OCR)")
    print("-" * 80)
    try:
        result = vnpt_ocr_giay_khai_sinh(str(TEST_DIR / "DK_THUONG_TRU/giay-khai-sinh.jpg"))
        print("✅ Thành công!")
        print(f"   Họ tên: {result.get('HO_VA_TEN', 'N/A')}")
        print(f"   Ngày sinh: {result.get('NGAY_SINH', 'N/A')}")
        print(f"   Họ tên mẹ: {result.get('HO_TEN_ME', 'N/A')}")
        print(f"   Họ tên cha: {result.get('HO_TEN_BO', 'N/A')}")
        print(f"   Nơi đăng ký: {result.get('NOI_DANG_KY_KHAI_SINH', 'N/A')}")
    except Exception as e:
        print(f"❌ Lỗi: {e}")
    print()

    # Test 2: GCN ĐKHKD (VNPT)
    print("2️⃣  GCN ĐKHKD (VNPT OCR)")
    print("-" * 80)
    try:
        result = vnpt_ocr_hkd(str(TEST_DIR / "HKD_THAY_DOI/giay-dang-ky-ho-kinh-doanh_sample.jpg"))
        print("✅ Thành công!")
        print(f"   Tên hộ KD: {result.get('ten_ho_kinh_doanh', 'N/A')}")
        print(f"   Số giấy phép: {result.get('so_giay_phep_kinh_doanh', 'N/A')}")
        print(f"   Tên người đại diện: {result.get('ten_nguoi_dai_dien', 'N/A')}")
        print(f"   Địa điểm KD: {result.get('dia_diem_kinh_doanh', 'N/A')}")
        print(f"   Ngành nghề: {result.get('nganh_nghe', 'N/A')[:50]}...")
    except Exception as e:
        print(f"❌ Lỗi: {e}")
    print()

    # Test 3: Sổ đỏ (Qwen)
    print("3️⃣  SỔ ĐỎ (Qwen VL OCR)")
    print("-" * 80)
    try:
        result = qwen_ocr_so_do(str(TEST_DIR / "DK_THUONG_TRU/so-do.jpg"))
        print("✅ Thành công!")
        print(f"   Tên chủ sở hữu: {result.get('tenChuSoHuu', 'N/A')}")
        print(f"   Số CCCD: {result.get('soCCCD', 'N/A')}")
        print(f"   Địa chỉ thường trú: {result.get('diaChiThuongTru', 'N/A')}")
        print(f"   Số giấy chứng nhận: {result.get('soGiayChungNhan', 'N/A')}")
    except Exception as e:
        print(f"❌ Lỗi: {e}")
    print()

    print("=" * 80)
    print("✅ TEST HOÀN TẤT - 3/3 loại giấy tờ có OCR!")
    print("=" * 80)


if __name__ == "__main__":
    main()
