# Services Page - Flow Tiền Kiểm Tích Hợp

## Tổng quan

Flow tiền kiểm hồ sơ tự động đã được tích hợp trực tiếp vào trang `/services` (http://localhost:3000/services).

## Flow 6 bước trong `/services`

```
1. Chọn thủ tục → 2. Upload giấy tờ → 3. Kiểm tra OCR → 4. Điền form → 5. Xem trước DOCX → 6. Nộp hồ sơ
```

### Khác biệt so với flow cũ:

**Trước:**
- `/services` → Chọn thủ tục → Chuyển sang `/upload/[sessionId]`
- Flow upload riêng biệt

**Sau:**
- `/services` → Chọn thủ tục → Luôn ở `/services` nhưng UI thay đổi theo bước
- Flow 6 bước với stepper navigation
- Event-driven bot (toast/modal)
- Tất cả trong 1 trang duy nhất

## Cấu trúc trang

### Step 1: SELECT_PROCEDURE (Mặc định)
- Hiển thị danh sách thủ tục
- Search bar để tìm kiếm
- Click vào thủ tục → Chuyển sang Step 2

### Step 2: UPLOAD_DOCS
- Stepper navigation xuất hiện
- Checklist động từ procedure schema
- Upload từng giấy tờ
- OCR realtime validation
- Progress bar: `2/5 giấy tờ đã kiểm tra`
- Bot toast khi upload xong: `✅ CCCD hợp lệ (98%)`

### Step 3: REVIEW_OCR
- Tự động trigger khi upload đủ giấy tờ bắt buộc
- Hiển thị điểm: `95/100 (Xuất sắc)`
- Cross-check matches
- **LawGuard RAG alerts** - Trích xuất điều luật từ Qdrant
- Suggestions

### Step 4: FILL_FORM
- 2 cột layout:
  - Sidebar: Dữ liệu OCR đã trích xuất
  - Main: Form với auto-filled fields
- Progress: `85% hoàn thành`
- Validation trường bắt buộc

### Step 5: PREVIEW_EXPORT
- Preview DOCX
- 2 nút: `Tải DOCX` | `Nộp hồ sơ trực tuyến`

### Step 6: SUBMIT
- Confirm + Tracking code
- Actions: `Theo dõi tiến trình` | `Về trang chủ`

## API Flow

### Frontend → Backend

```
1. GET /api/v1/procedures (list all)
2. GET /api/v1/procedures/:id (get full details)
3. POST /api/v1/sessions (create session)
4. POST /api/v1/pre-check/upload (upload + OCR)
5. POST /api/v1/pre-check/crosscheck/:sessionId (cross-check + LawGuard)
6. GET /api/v1/smartform/:sessionId (get form fields)
7. POST /api/v1/smartform/:sessionId/export (export DOCX)
8. POST /api/v1/sessions/:sessionId/submit (final submit)
```

### Backend → AI Service

```
POST http://localhost:8000/api/v1/ocr/extract (OCR)
POST http://localhost:8000/api/v1/crosscheck (Cross-check)
POST http://localhost:8000/api/v1/lawguard/check (LawGuard RAG)
```

## Bot Triggers

| Sự kiện | Bot phản hồi | Kiểu |
|---------|-------------|------|
| User chọn thủ tục | Checklist giấy tờ | Toast |
| Upload file thành công | OCR result | Toast |
| Upload file lỗi | Gợi ý sửa | Modal |
| Upload đủ giấy tờ | Cross-check đang chạy | Processing toast |
| Cross-check xong | Điểm + LawGuard alerts | Large modal |
| Form thiếu trường | Cảnh báo | Warning modal |
| Export DOCX xong | File đã tạo | Success toast |
| Submit thành công | Tracking code | Success modal |

## RAG Usage

### LawGuard (Bước 3 - REVIEW_OCR)
- **Trigger:** Tự động sau cross-check
- **Source:** Qdrant vector DB (văn bản pháp luật)
- **Output:** Danh sách cảnh báo có trích dẫn điều luật
- **Ví dụ:**
  ```
  Lưu ý pháp luật (RAG):
  • Giấy khai sinh cần công chứng nếu bản photocopy (Điều 12, Nghị định 123/2015)
  • CCCD còn hiệu lực dưới 6 tháng nên làm mới (Thông tư 08/2021)
  ```

## UI/UX Highlights

### 1. Single Page Flow
- Không redirect, chỉ thay đổi component theo step
- Stepper luôn hiển thị (trừ step 1)
- Smooth transitions

### 2. Event-Driven Bot
- Không có chatbox
- Bot = Toast/Modal xuất hiện khi cần
- Auto-dismiss hoặc có action buttons

### 3. Progressive Disclosure
- Mỗi step chỉ hiển thị thông tin cần thiết
- Sidebar OCR data chỉ xuất hiện ở step 4 (FILL_FORM)

### 4. No Icons (Unicode only)
- ✅ ❌ ⏳ (checkmark, cross, hourglass)
- Không dùng icon library

## Test Flow

1. Start services:
```bash
# Terminal 1
cd apps/ai-svc && python -m uvicorn app.main:app --reload

# Terminal 2
npm run dev:core

# Terminal 3
npm run dev:web
```

2. Truy cập: `http://localhost:3000/services`

3. Test scenario:
   - Chọn "Đăng ký thường trú"
   - Upload CCCD → Xem OCR result
   - Upload sổ hộ khẩu → Xem OCR result
   - Upload đủ giấy tờ → Xem cross-check score + LawGuard alerts
   - Điền form → Xem auto-fill
   - Export DOCX → Download
   - Submit → Xem tracking code

## Files Changed

```
✅ /apps/web/src/app/(citizen)/services/page.tsx (rewritten)
✅ /apps/core-svc/src/modules/pre-check/* (created earlier)
✅ /docs/SERVICES_FLOW.md (this file)
```

## Migration Notes

### Old flow (DEPRECATED):
- `/services` → `/upload/[sessionId]` → `/result/[sessionId]` → `/smartform/[sessionId]` → `/confirm/[sessionId]`
- 5 trang riêng biệt

### New flow (CURRENT):
- `/services` (single page with 6 steps)
- Tất cả trong 1 URL

### Breaking changes:
- `/pre-check` page không còn sử dụng (có thể xóa)
- `/upload/[sessionId]` vẫn tồn tại cho legacy flow (nếu cần)

## Next Steps

- ✅ Frontend: `/services` page - Done
- ✅ Backend: pre-check module - Done
- ⏳ Test e2e flow
- ⏳ Mobile responsive
- ⏳ Accessibility (ARIA labels)
- ⏳ Error recovery improvements
- ⏳ Loading states polish
