#!/usr/bin/env python3
"""Test Qwen OCR for sổ đỏ extraction"""

import base64
import json
import requests
from pathlib import Path

API_KEY = "sk-ws-H.YIXYLL.DqkQ.MEQCIEw1zptDlsonbypeALVmafVL2NckhWgGBZjzN2Y4TsGIAiAnotPkG1W_MC_3kJd12S9lOE91l6ksm220dTsmH8r_Kg"
BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

def encode_image(image_path: str) -> str:
    """Encode image to base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def extract_so_do(image_path: str) -> dict:
    """Extract information from sổ đỏ using Qwen VL"""

    image_base64 = encode_image(image_path)

    prompt = """Đọc kỹ Giấy chứng nhận quyền sử dụng đất (sổ đỏ) này và trích xuất CHÍNH XÁC các thông tin sau:

Trả về JSON với cấu trúc:
{
  "tenChuSoHuu": "Họ tên đầy đủ người được cấp (nếu nhiều người thì nối bằng dấu phẩy)",
  "soCCCD": "Số CCCD hoặc CMND",
  "diaChiThuongTru": "Địa chỉ thường trú",
  "diaChiNha": "Địa chỉ thửa đất (vị trí của thửa đất)",
  "dienTich": "Diện tích đất",
  "soGiayChungNhan": "Số giấy chứng nhận"
}

CHÚ Ý: Chỉ trả về JSON thuần túy, KHÔNG thêm ```json``` hay bất kỳ text nào khác."""

    response = requests.post(
        f"{BASE_URL}/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "qwen-vl-ocr-2025-11-20",  # Model chuyên OCR
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

    if response.status_code != 200:
        print(f"Error response: {response.text}")
    response.raise_for_status()
    result = response.json()
    content = result["choices"][0]["message"]["content"]

    # Parse JSON from response
    try:
        # Remove markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        return json.loads(content)
    except json.JSONDecodeError:
        print(f"Raw response: {content}")
        raise

if __name__ == "__main__":
    image_path = "/home/dangkien/1st-Main/hackaithon/GovTrust-AI/data/test-documents/DK_THUONG_TRU/so-do.jpg"

    print("=== Testing Qwen OCR for Sổ đỏ ===\n")

    try:
        result = extract_so_do(image_path)
        print("✅ Kết quả trích xuất:\n")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"❌ Lỗi: {e}")
