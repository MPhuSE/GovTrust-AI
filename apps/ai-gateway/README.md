# GovTrust AI — AI Gateway (FastAPI)

Hiện đã triển khai phần **Vector DB (Qdrant)** cho LawGuard. Các module OCR /
CrossCheck / RAG generation sẽ bổ sung sau.

> Theo `docs/DATABASE_DESIGN.md` §3: collection `legal_chunks`, vector **768**,
> distance **Cosine**, payload index `category`. Qdrant là lớp **phái sinh**
> (rebuild được), không phải nguồn sự thật.

## Cấu trúc

```
apps/ai-gateway/
├── app/
│   ├── config.py              # Settings (QDRANT_URL, EMBEDDING_MODEL, RAG_*)
│   └── vector_db/
│       ├── schema.py          # Hằng số collection + model LegalChunk
│       ├── client.py          # QdrantClient singleton
│       ├── embeddings.py      # sentence-transformers → vector 768d
│       ├── qdrant_setup.py    # Tạo collection + payload index (idempotent)
│       ├── ingest.py          # Embed + upsert văn bản luật
│       ├── search.py          # RAG retrieval (lọc category + status ACTIVE)
│       └── mark_superseded.py # Đánh dấu luật hết hiệu lực khi cập nhật
├── requirements.txt
└── .env.example
```

## Chạy thử (1-2-3)

```bash
# 0. Bật Qdrant
docker compose -f infra/docker-compose.yml up -d

# 1. Cài deps (khuyến nghị venv)
cd apps/ai-gateway
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# 2. Tạo collection legal_chunks (+ payload index category)
python -m app.vector_db.qdrant_setup
#   thêm --force để xóa & tạo lại

# 3. Ingest văn bản luật mẫu (data/legal-sources/chunks/)
python -m app.vector_db.ingest

# 4. Thử truy vấn
python -m app.vector_db.search "giấy chứng sinh khi đăng ký khai sinh" HO_TICH
```

Lần đầu chạy bước 3/4 sẽ tải model embedding (`keepitreal/vietnamese-sbert`,
~500MB) về máy — các lần sau dùng cache.

## Dùng trong code (LawGuard)

```python
from app.vector_db import LegalSearchService, LegalCategory

service = LegalSearchService()
hits = service.search(
    "Hồ sơ đăng ký thường trú gồm những gì?",
    category=LegalCategory.CU_TRU,
    top_k=3,
)
for h in hits:
    print(h.score, h.title, h.article)   # citation cho cảnh báo
```

## Versioning căn cứ pháp lý (luật cập nhật trong tương lai)

Mỗi chunk có vòng đời hiệu lực qua field `status`:

| status | Ý nghĩa | Có vào cảnh báo hồ sơ mới? |
|---|---|---|
| `ACTIVE` | Còn hiệu lực | ✅ (mặc định retrieval chỉ lấy cái này) |
| `SUPERSEDED` | Bị văn bản mới thay thế | ❌ giữ lại để tra cứu lịch sử |
| `REPEALED` | Hết hiệu lực, không thay thế | ❌ |

**Khi một luật được cập nhật:**

```bash
# 1. Thêm file chunk bản MỚI (chunkId mang version mới) rồi ingest
python -m app.vector_db.ingest data/legal-sources/chunks/cu-tru-2026.json

# 2. Đánh dấu bản CŨ là đã bị thay thế (không xóa — giữ để audit)
python -m app.vector_db.mark_superseded luat-cu-tru-2020-dieu21-chunk1 \
    --by luat-cu-tru-2026-dieu21-chunk1 --expiry 2026-07-01
```

Vì `point_id = UUIDv5(chunkId)`, bản cũ và mới có chunkId khác nhau → **2 point
riêng biệt, không đè nhau**. Retrieval mặc định `status=ACTIVE` nên hồ sơ mới chỉ
thấy luật mới; muốn tra cứu lịch sử thì gọi `search(..., status=None)`.

> Citation của các hồ sơ đã chấm trước đó **không bị ảnh hưởng** — chúng đã được
> đóng băng trong `sessions.aiResult.lawGuardAlerts` (MongoDB) tại thời điểm chấm.

## Lưu ý

- **Người dùng không bao giờ ghi vào Qdrant** — chỉ pipeline `ingest` (nhóm kiểm
  soát) mới upsert, chống RAG injection.
- `chunkId` (chuỗi) được derive thành UUIDv5 ổn định làm point id → ingest lại
  **idempotent**, không tạo bản trùng.
- Đổi `EMBEDDING_MODEL` phải đảm bảo vẫn ra **768 chiều**, nếu không `embeddings`
  sẽ raise lỗi ngay khi load model (khớp `VECTOR_SIZE`).
```
