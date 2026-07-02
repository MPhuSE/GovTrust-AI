# GovTrust AI — Hướng dẫn Test API bằng Swagger

> Tài liệu test cho **core-svc** (NestJS orchestrator). Toàn bộ 21 endpoint của pipeline 11 bước đã được mô tả OpenAPI, có schema request/response và test trực tiếp trên Swagger UI.

## 1. Khởi động & truy cập Swagger

```bash
# Cách 1 — toàn hệ thống (khuyến nghị)
docker compose -f infra/docker-compose.yml up --build

# Cách 2 — chỉ core-svc (cần Mongo + Redis đang chạy)
cd apps/core-svc && npm run build && node dist/main.js
```

- **Swagger UI:** http://localhost:4000/api/docs
- **OpenAPI JSON:** http://localhost:4000/api/docs-json (bản tĩnh: `docs/openapi.json`)
- Qua gateway (public): các request thật đi qua http://localhost:8080 → proxy sang core-svc. Swagger UI test **trực tiếp core-svc:4000** cho gọn.

## 2. Xác thực (Bearer JWT)

Các endpoint Bước 9–11 (Recheck, Priority, Insights) yêu cầu vai trò **OFFICER/ADMIN**.

1. `POST /auth/register` — tạo tài khoản. Để test Bước 9–11, truyền `role: "OFFICER"`:
   ```json
   { "username": "canbo01", "password": "matkhau123", "fullName": "Cán bộ Một Cửa", "role": "OFFICER" }
   ```
2. Copy `access_token` từ response.
3. Bấm nút **Authorize** (góc phải Swagger UI) → dán token → Authorize. Từ đó mọi request có ổ khóa 🔒 sẽ gắn `Authorization: Bearer <token>`.

> Tài khoản người dân bình thường: bỏ `role` (mặc định `CITIZEN`).

## 3. Luồng test End-to-End (11 bước)

Đăng ký/đăng nhập trước, rồi chạy tuần tự. Mỗi bước lấy `id`/`code` từ response bước trước.

| Bước | Method + Path | Body / Param | Ghi chú |
|---|---|---|---|
| — | `POST /auth/register` | xem §2 | lấy token |
| 1 | `POST /procedures/identify` | `{ "userQuery": "Tôi muốn đăng ký khai sinh cho con" }` | HoSoBot trả `procedureCode` |
| — | `GET /procedures` / `GET /procedures/{code}` | — | lấy `procedureId` (ObjectId) + checklist |
| — | `POST /sessions` | `{ "procedureId": "<ObjectId>" }` | trả `sessionId` |
| 2 | `POST /documents/upload` | multipart: `file`, `sessionId`, `documentTypeCode` (vd `CCCD`) | upload ảnh/PDF |
| 3 | `POST /documents/{sessionId}/ocr/{documentTypeCode}` | `{ "checklistId": "cccd_cha_me" }` (tùy chọn) | enqueue BullMQ → ai-svc; poll `GET /sessions/{id}` tới khi `pipeline.steps.ocr = done` |
| 4 | `POST /sessions/{id}/crosscheck` | — | đối chiếu chéo (rule-engine) |
| 5 | `POST /sessions/{id}/score` | — | điểm 0–100 + `canSubmit` |
| 6 | `POST /sessions/{id}/lawguard` | — | RAG căn cứ pháp lý (gRPC ai-svc) |
| 7 | `POST /sessions/{id}/smartform` | — | tự điền form |
| 8 | `POST /sessions/{id}/confirm` | — | người dân xác nhận → ghi InsightLog ẩn danh |
| 9 | `POST /sessions/{id}/recheck` | 🔒 OFFICER | riskFlags + completenessLevel |
| 10 | `GET /priority` | 🔒 OFFICER | hàng đợi A/B/C/D theo SLA |
| 11 | `GET /insights/dashboard?days=30` | 🔒 OFFICER | top lỗi, avg score, procedureStats |

> **Bước 3 là bất đồng bộ.** `triggerOcr` trả `{ jobId, status: "processing" }` ngay; kết quả OCR do BullMQ consumer ghi vào `session.aiResult.ocrData` sau. Poll `GET /sessions/{id}` trước khi chạy Bước 4.

## 4. Test case biên (đối chiếu `tests/demo-cases/`)

| Case | Kịch bản | Kết quả kỳ vọng |
|---|---|---|
| case-01-full | Đủ giấy tờ, khớp, ảnh rõ | score ≥ 80, grade A, `canSubmit=true` |
| case-02-missing-doc | Thiếu giấy bắt buộc | breakdown có `missing-document`, **`canSubmit=false`** (đã fix) |
| case-03-mismatch | Tên lệch giữa 2 giấy | breakdown có `mismatch-info`; recheck có riskFlag |
| case-05-blurry | Ảnh mờ, OCR confidence thấp | breakdown có `image-quality` |

> **Lưu ý quan trọng:** thiếu **bất kỳ** giấy tờ bắt buộc nào → hồ sơ không đầy đủ → `canSubmit=false` bất kể điểm số (rule missing-document = CRITICAL). Đây là hành vi đúng đã được sửa và có unit test bao phủ.

## 5. Validation

`ValidationPipe` bật `whitelist + forbidNonWhitelisted + transform`. Test nhanh:
- Bỏ trống `username` ở `/auth/register` → **400** kèm message.
- `password` < 6 ký tự → **400**.
- `procedureId` sai định dạng ObjectId ở `/sessions` → **400**.
- Gửi field lạ không có trong DTO → **400** (forbidNonWhitelisted).

## 6. Kiểm thử tự động

```bash
bash scripts/run-tests.sh          # rule-engine (jest) + ai-svc (pytest)
cd packages/rule-engine && npx jest # 4/4 pass — gồm case canSubmit khi thiếu giấy
cd apps/ai-svc && .venv/bin/python -m pytest -q  # 6/6 pass — proto gRPC, xử lý tiếng Việt
```
