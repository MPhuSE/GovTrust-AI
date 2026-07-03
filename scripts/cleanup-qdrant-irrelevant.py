#!/usr/bin/env python3
"""
Xóa chunks HO_KINH_DOANH không liên quan đến HKD_THAY_DOI
Giữ lại các văn bản về đăng ký doanh nghiệp, xóa các văn bản về thuế và đầu tư
"""

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

# Qdrant config
QDRANT_URL = "http://45.130.164.249:6333"
QDRANT_API_KEY = "ac22aa199d489086671f902e702242a54de2ded69997c8c7"
QDRANT_COLLECTION = "legal_chunks"

# Danh sách văn bản CẦN XÓA (không liên quan đến HKD_THAY_DOI)
TITLES_TO_DELETE = [
    "Luật Đầu tư 143/2025/QH15",
    "Luật Quản lý thuế 108/2025/QH15",
    "Thông tư 86/2024/TT-BTC về đăng ký thuế",
    "Nghị định 68/2026/NĐ-CP về chính sách thuế đối với hộ kinh doanh",
    "Nghị định 141/2026/NĐ-CP sửa đổi chính sách thuế hộ kinh doanh",
    "Văn bản hợp nhất 114/VBHN-VPQH - Luật Thuế giá trị gia tăng",
    "Văn bản hợp nhất 112/VBHN-VPQH - Luật Thuế thu nhập cá nhân",
]


def delete_by_title(client: QdrantClient, title: str) -> int:
    """Xóa tất cả chunks có title cụ thể"""
    # Scroll to get all point IDs with this title
    offset = None
    point_ids = []

    while True:
        results = client.scroll(
            collection_name=QDRANT_COLLECTION,
            scroll_filter=Filter(
                must=[
                    FieldCondition(key="category", match=MatchValue(value="HO_KINH_DOANH")),
                    FieldCondition(key="title", match=MatchValue(value=title))
                ]
            ),
            limit=100,
            offset=offset,
            with_payload=False  # Only need IDs
        )

        point_ids.extend([point.id for point in results[0]])
        offset = results[1]

        if offset is None:
            break

    if not point_ids:
        return 0

    # Delete all points
    client.delete(
        collection_name=QDRANT_COLLECTION,
        points_selector=point_ids
    )

    return len(point_ids)


def main():
    print("🧹 Dọn dẹp chunks HO_KINH_DOANH không liên quan\n")

    client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        timeout=60
    )

    # Get initial count
    initial_info = client.get_collection(QDRANT_COLLECTION)
    initial_count = initial_info.points_count
    print(f"📊 Trước khi xóa: {initial_count} points\n")

    total_deleted = 0

    # Delete each irrelevant title
    for title in TITLES_TO_DELETE:
        print(f"🗑️  Đang xóa: {title}")
        deleted = delete_by_title(client, title)
        total_deleted += deleted
        print(f"   ✅ Đã xóa {deleted} chunks\n")

    # Get final count
    final_info = client.get_collection(QDRANT_COLLECTION)
    final_count = final_info.points_count

    print("=" * 80)
    print(f"✅ Hoàn tất!")
    print(f"📊 Trước: {initial_count} points")
    print(f"📊 Sau:   {final_count} points")
    print(f"🗑️  Đã xóa: {total_deleted} points")
    print(f"💾 Còn lại: {final_count} points")


if __name__ == "__main__":
    main()
