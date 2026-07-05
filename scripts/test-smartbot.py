#!/usr/bin/env python3
"""
Test SmartBot với legal chunks đã upload vào Qdrant
"""

import asyncio
import httpx

# Test queries cho từng thủ tục
TEST_QUERIES = {
    "HO_TICH": [
        "Tôi muốn đăng ký khai sinh cho con, cần giấy tờ gì?",
        "Đăng ký khai sinh trễ hạn thì làm sao?",
        "Mẹ đơn thân đăng ký khai sinh có được không?",
    ],
    "DAT_DAI": [
        "Tôi muốn chuyển nhượng đất, cần điều kiện gì?",
        "Hợp đồng chuyển nhượng có phải công chứng không?",
        "Chuyển nhượng đất cần nộp những giấy tờ gì?",
    ],
    "HO_KINH_DOANH": [
        "Thay đổi chủ hộ kinh doanh cần giấy gì?",
        "Thủ tục thay đổi thông tin hộ kinh doanh như thế nào?",
    ]
}

AI_SVC_URL = "http://localhost:8001"


async def test_smartbot(category: str, query: str):
    """Test một câu hỏi với SmartBot"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{AI_SVC_URL}/smartbot/ask",
            json={
                "question": query,
                "category": category,
                "top_k": 3
            }
        )

        if response.status_code == 200:
            result = response.json()
            return result
        else:
            return {"error": f"HTTP {response.status_code}: {response.text}"}


async def main():
    print("🤖 Testing SmartBot with Legal Chunks\n")

    for category, queries in TEST_QUERIES.items():
        print(f"\n{'='*80}")
        print(f"📚 Category: {category}")
        print(f"{'='*80}\n")

        for query in queries:
            print(f"❓ Question: {query}")

            try:
                result = await test_smartbot(category, query)

                if "error" in result:
                    print(f"   ❌ Error: {result['error']}\n")
                    continue

                answer = result.get("answer", "")
                sources = result.get("sources", [])

                print(f"   💬 Answer: {answer[:200]}...")
                print(f"   📖 Sources: {len(sources)} chunks")

                for i, source in enumerate(sources[:3], 1):
                    print(f"      {i}. {source.get('title', 'N/A')} - {source.get('article', 'N/A')}")

                print()

            except Exception as e:
                print(f"   ❌ Exception: {e}\n")


if __name__ == "__main__":
    asyncio.run(main())
