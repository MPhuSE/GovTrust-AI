# Legal sources

Nguồn luật phục vụ LawGuard của MVP hiện gồm hai nhóm:

- `HO_TICH`
- `HO_KINH_DOANH`

Các chunk `HO_KINH_DOANH` được trích từ Nghị định 168/2025/NĐ-CP trên Cổng
Thông tin điện tử Chính phủ:

```bash
python3 scripts/build-hkd-legal-chunks.py
```

Chuyển toàn bộ văn bản đã chọn trong thư mục `pdf/` thành chunk có metadata:

```bash
python3 scripts/chunk-legal-pdfs.py
```

Đồng bộ Qdrant, bao gồm xóa toàn bộ point `DAT_DAI` và upsert luật hộ kinh doanh:

```bash
python3 scripts/sync-mvp-legal-qdrant.py
```

Collection hiện dùng named vector `dense`, kích thước 768 và model
`keepitreal/vietnamese-sbert` để tương thích với các vector đã có.
