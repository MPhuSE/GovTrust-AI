import base64
import httpx
from app.config import settings


class VNPTOCRClient:
    """Client gọi VNPT eKYC OCR API thật."""

    def __init__(self):
        self.base_url = settings.VNPT_EKYC_BASE_URL
        self.headers = {
            "Token-id": settings.VNPT_EKYC_TOKEN_ID,
            "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
            "Authorization": f"Bearer {settings.VNPT_EKYC_ACCESS_TOKEN}",
            "Content-Type": "application/json",
        }

    async def ocr_id_card(self, image_bytes: bytes, doc_type: str = "CCCD") -> dict:
        """Bóc tách thông tin giấy tờ qua VNPT eKYC OCR."""
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/ekyc/v1/ocr",
                headers=self.headers,
                json={"image": image_b64, "type": doc_type},
            )
            response.raise_for_status()
            return response.json()

    async def liveness_check(self, image_bytes: bytes) -> dict:
        """Kiểm tra giấy tờ thật/giả."""
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/ekyc/v1/liveness-card",
                headers=self.headers,
                json={"image": image_b64},
            )
            response.raise_for_status()
            return response.json()

    async def compare_faces(self, face1_bytes: bytes, face2_bytes: bytes) -> dict:
        """So sánh 2 khuôn mặt."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/ekyc/v1/compare-face",
                headers=self.headers,
                json={
                    "image1": base64.b64encode(face1_bytes).decode("utf-8"),
                    "image2": base64.b64encode(face2_bytes).decode("utf-8"),
                },
            )
            response.raise_for_status()
            return response.json()
