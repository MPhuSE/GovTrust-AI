#!/usr/bin/env python3
"""
Test LawGuard - Tra cứu luật liên quan đến thủ tục
"""

import asyncio
import httpx

AI_SVC_URL = "http://localhost:8001"

TEST_CASES = [
    {
        "procedureCode": "DANG_KY_KHAI_SINH",
        "category": "HO_TICH",
        "checklist": [
            {"id": "cccd_nguoi_yeu_cau", "roleInProcedure": "Người yêu cầu"},
            {"id": "cccd_cha", "roleInProcedure": "Cha"},
            {"id": "giay_chung_sinh", "roleInProcedure": "Giấy chứng sinh"},
        ]
    },
    {
        "procedureCode": "CHUYEN_NHUONG_QSDD",
        "category": "DAT_DAI",
        "checklist": [
            {"id": "cccd_nguoi_yeu_cau", "roleInProcedure": "Bên nhận chuyển nhượng"},
            {"id": "so_do", "roleInProcedure": "Sổ đỏ"},
            {"id": "hop_dong", "roleInProcedure": "Hợp đồng chuyển nhượng"},
        ]
    },
    {
        "procedureCode": "HKD_THAY_DOI",
        "category": "HO_KINH_DOANH",
        "checklist": [
            {"id": "cccd_nguoi_yeu_cau", "roleInProcedure": "Chủ hộ mới"},
            {"id": "giay_dang_ky_hkd", "roleInProcedure": "Giấy đăng ký HKD"},
        ]
    }
]


async def test_lawguard(test_case):
    """Test LawGuard với một thủ tục"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{AI_SVC_URL}/lawguard/consult",
            json=test_case
        )

        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"HTTP {response.status_code}: {response.text}"}


async def main():
    print("⚖️  Testing LawGuard - Legal Consultation\n")

    for test_case in TEST_CASES:
        print(f"\n{'='*80}")
        print(f"📋 Procedure: {test_case['procedureCode']}")
        print(f"📚 Category: {test_case['category']}")
        print(f"{'='*80}\n")

        try:
            result = await test_lawguard(test_case)

            if "error" in result:
                print(f"❌ Error: {result['error']}\n")
                continue

            chunks = result.get("relevantChunks", [])
            summary = result.get("summary", "")

            print(f"📖 Found {len(chunks)} relevant legal chunks")
            print(f"💡 Summary: {summary[:300]}...\n")

            print("📄 Top legal references:")
            for i, chunk in enumerate(chunks[:5], 1):
                title = chunk.get("title", "N/A")
                article = chunk.get("article", "N/A")
                score = chunk.get("score", 0)

                print(f"   {i}. {title} - {article} (score: {score:.2f})")
                print(f"      Preview: {chunk.get('text', '')[:100]}...")

            print()

        except Exception as e:
            print(f"❌ Exception: {e}\n")


if __name__ == "__main__":
    asyncio.run(main())
