#!/usr/bin/env python3
"""
Tích hợp Qwen VL OCR cho các giấy tờ không có VNPT API
Sử dụng cho: Sổ đỏ, Văn bản hành chính, Văn bản ủy quyền
"""

import base64
import json
import requests
from typing import Dict, Optional

class QwenOCRService:
    """Qwen Vision-Language OCR service"""

    def __init__(self, api_key: str, base_url: str = "https://api.shopaikey.com/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.model = "qwen3-vl-plus"

    def encode_image(self, image_path: str) -> str:
        """Encode image to base64"""
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def extract_structured(self, image_path: str, prompt: str, max_tokens: int = 1500) -> Dict:
        """
        Extract structured data from image using Qwen VL

        Args:
            image_path: Path to image file
            prompt: Extraction prompt (should ask for JSON output)
            max_tokens: Max tokens for response

        Returns:
            Parsed JSON dict
        """
        image_base64 = self.encode_image(image_path)

        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": self.model,
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
                "max_tokens": max_tokens,
                "temperature": 0.1
            },
            timeout=60
        )

        response.raise_for_status()
        result = response.json()
        content = result["choices"][0]["message"]["content"]

        # Parse JSON from response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        return json.loads(content)

    def extract_so_do(self, image_path: str) -> Dict:
        """Extract Giấy chứng nhận quyền sử dụng đất (sổ đỏ)"""
        prompt = """Đọc Giấy chứng nhận quyền sử dụng đất này và trích xuất thông tin:

Trả về JSON:
{
  "tenChuSoHuu": "Họ tên người được cấp (nhiều người nối bằng dấu phẩy)",
  "soCCCD": "Số CCCD/CMND",
  "diaChiThuongTru": "Địa chỉ thường trú",
  "diaChiNha": "Địa chỉ thửa đất",
  "dienTich": "Diện tích",
  "soGiayChungNhan": "Số giấy chứng nhận",
  "soThua": "Số thửa",
  "soTo": "Số tờ bản đồ"
}

CHỈ trả JSON, KHÔNG giải thích."""

        return self.extract_structured(image_path, prompt)

    def extract_van_ban_hanh_chinh(self, image_path: str) -> Dict:
        """Extract văn bản hành chính (ý kiến chủ hộ, xác nhận...)"""
        prompt = """Đọc văn bản hành chính này và trích xuất thông tin:

Trả về JSON:
{
  "loaiVanBan": "Loại văn bản (ví dụ: Ý kiến đồng ý, Xác nhận...)",
  "coQuanBanHanh": "Cơ quan ban hành hoặc người ký",
  "ngayBanHanh": "Ngày ban hành (dd/mm/yyyy)",
  "noiDung": "Nội dung chính của văn bản",
  "nguoiKy": "Họ tên người ký"
}

CHỈ trả JSON, KHÔNG giải thích."""

        return self.extract_structured(image_path, prompt)

    def extract_van_ban_uy_quyen(self, image_path: str) -> Dict:
        """Extract văn bản ủy quyền"""
        prompt = """Đọc văn bản ủy quyền này và trích xuất thông tin:

Trả về JSON:
{
  "tenNguoiDuocUyQuyen": "Họ tên người được ủy quyền",
  "tenHoKinhDoanh": "Tên hộ kinh doanh (nếu có)",
  "ngayUyQuyen": "Ngày ủy quyền (dd/mm/yyyy)",
  "noiCongChung": "Nơi công chứng/chứng thực",
  "noiDung": "Nội dung ủy quyền"
}

CHỈ trả JSON, KHÔNG giải thích."""

        return self.extract_structured(image_path, prompt)


# Test script
if __name__ == "__main__":
    API_KEY = "sk-9wWanfXQ5FKAmm5Dc3ZazOAtPtt8uaY9KAoVNH9fhIzSSHz7"

    service = QwenOCRService(API_KEY)

    # Test sổ đỏ
    print("=== Test Sổ đỏ ===\n")
    try:
        result = service.extract_so_do(
            "/home/dangkien/1st-Main/hackaithon/GovTrust-AI/data/test-documents/DK_THUONG_TRU/so-do.jpg"
        )
        print("✅ Kết quả:\n")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"❌ Lỗi: {e}")
