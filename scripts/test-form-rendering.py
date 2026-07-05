#!/usr/bin/env python3
"""
Test SmartForm - Render DOCX từ form data
"""

import asyncio
import httpx
from pathlib import Path

CORE_SVC_URL = "http://localhost:3001/api"
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "test-documents" / "rendered-forms"

TEST_CASES = {
    "DANG_KY_KHAI_SINH": {
        "templateCode": "KHAI_SINH",
        "formData": {
            "treEm.hoTen": "Trần Minh An",
            "treEm.gioiTinh": "Nam",
            "treEm.ngaySinh": "05/01/2026",
            "treEm.gioSinh": "08:30",
            "treEm.noiSinh": "Bệnh viện Phụ sản Hà Nội",
            "treEm.canNang": "3.2",

            "me.hoTen": "Nguyễn Thị Lan",
            "me.ngaySinh": "15/03/1995",
            "me.danToc": "Kinh",
            "me.quocTich": "Việt Nam",
            "me.soCCCD": "001095012345",
            "me.diaChiThuongTru": "Số 10, Ngõ 5, Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội",

            "cha.hoTen": "Trần Văn Minh",
            "cha.ngaySinh": "20/08/1993",
            "cha.danToc": "Kinh",
            "cha.quocTich": "Việt Nam",
            "cha.soCCCD": "001093098765",
            "cha.diaChiThuongTru": "Số 10, Ngõ 5, Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội",

            "nguoiKhai.hoTen": "Nguyễn Thị Lan",
            "nguoiKhai.quanHe": "Mẹ",
            "nguoiKhai.ngayKhai": "10/01/2026",

            "noiDangKy": "UBND Phường Láng Thượng, Quận Đống Đa, Hà Nội"
        }
    },

    "HKD_THAY_DOI": {
        "templateCode": "HKD_THAY_DOI",
        "formData": {
            "nguoiYeuCau.hoTen": "Nguyễn Văn Bình",
            "nguoiYeuCau.ngaySinh": "10/05/1985",
            "nguoiYeuCau.soCCCD": "001085067890",
            "nguoiYeuCau.dienThoai": "0912345678",
            "nguoiYeuCau.email": "binh.nv@email.com",

            "hoKinhDoanh.ten": "Hộ kinh doanh Bình Minh",
            "hoKinhDoanh.maSoHKD": "0123456789",
            "hoKinhDoanh.diaChiKinhDoanh": "123 Đường ABC, Phường XYZ",
            "hoKinhDoanh.nganhNghe": "Kinh doanh tạp hóa",

            "chuHoCu.hoTen": "Nguyễn Văn An",
            "chuHoCu.soCCCD": "001080012345",

            "thayDoi.noiDung": "Thay đổi chủ hộ kinh doanh",
            "thayDoi.lyDo": "Thành viên hộ gia đình ủy quyền",

            "ngayNop": "15/01/2026",
            "noiNop": "Phòng Đăng ký kinh doanh, Sở Kế hoạch và Đầu tư"
        }
    }
}


async def test_form_rendering(procedure_code: str, test_data: dict):
    """Test render form cho một thủ tục"""
    print(f"\n{'='*80}")
    print(f"📋 Testing: {procedure_code}")
    print(f"📄 Template: {test_data['templateCode']}")
    print(f"{'='*80}\n")

    # Create mock session with form data
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Create session
        print("1️⃣  Creating mock session...")
        session_resp = await client.post(
            f"{CORE_SVC_URL}/sessions/mock",
            json={
                "procedureCode": procedure_code,
                "description": f"Test form rendering for {procedure_code}",
                "ocrData": {}  # Empty OCR data, we provide formData directly
            }
        )

        if session_resp.status_code != 201:
            print(f"   ❌ Failed to create session: {session_resp.text}")
            return

        session_id = session_resp.json()["sessionId"]
        print(f"   ✅ Session created: {session_id}")

        # Step 2: Update session with form data
        print("2️⃣  Updating session with form data...")
        # Note: This might need a different endpoint depending on your API
        # For now, we'll render directly

        # Step 3: Render form
        print("3️⃣  Rendering DOCX form...")
        render_resp = await client.post(
            f"{CORE_SVC_URL}/smartform/render-direct",
            json={
                "templateCode": test_data["templateCode"],
                "formData": test_data["formData"]
            }
        )

        if render_resp.status_code != 200:
            print(f"   ❌ Failed to render: {render_resp.text}")
            return

        # Save rendered document
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        output_file = OUTPUT_DIR / f"{procedure_code}_{session_id}.docx"

        with open(output_file, "wb") as f:
            f.write(render_resp.content)

        print(f"   ✅ Form rendered successfully!")
        print(f"   📁 Saved to: {output_file}")
        print(f"   📊 Size: {len(render_resp.content) / 1024:.2f} KB")


async def main():
    print("📝 Testing SmartForm - Document Rendering\n")

    for procedure_code, test_data in TEST_CASES.items():
        try:
            await test_form_rendering(procedure_code, test_data)
        except Exception as e:
            print(f"❌ Exception: {e}")
            import traceback
            traceback.print_exc()

    print(f"\n✅ All tests completed!")
    print(f"📁 Check rendered forms in: {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
