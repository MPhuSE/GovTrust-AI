# GovTrust AI - Hệ thống Tiền kiểm Hồ sơ Dịch vụ công

**GovTrust AI** là nền tảng số hóa và tự động hóa quy trình tiền kiểm hồ sơ dịch vụ công trực tuyến. Hệ thống ứng dụng công nghệ AI (OCR, NLP, RAG) để tự động bóc tách thông tin, đối chiếu chéo, đánh giá tính hợp lệ của giấy tờ và tự động điền Tờ khai, giúp giảm thiểu thời gian xử lý thủ tục hành chính.

Dự án tham gia: **Vietnamese Student HackAIthon 2026 | Bảng B — Challenger**

---

## 🌟 Tính năng Nổi bật

### Dành cho Người dân (Citizen)
- **Tích hợp eKYC:** Tự động lấy thông tin định danh (CCCD) từ tài khoản eKYC, không cần nộp lại.
- **HoSoBot (AI Chatbot):** Hỗ trợ giải đáp thủ tục, tự động nhận diện loại thủ tục cần thực hiện.
- **Bóc tách tự động (OCR):** Tự động đọc và trích xuất dữ liệu từ các loại giấy tờ (Giấy chứng sinh, Giấy kết hôn, Sổ đỏ...).
- **SmartForm:** Tự động mapping dữ liệu từ các giấy tờ vào biểu mẫu Tờ khai, xuất file PDF/Docx hoàn chỉnh.

### Dành cho Cán bộ (Officer)
- **Dashboard Thống kê (InsightMap):** Trực quan hóa dữ liệu điểm nghẽn, thời gian xử lý hồ sơ.
- **AI Tiền kiểm (Score Engine):** Tự động chấm điểm hồ sơ (0-100), phân loại "Hợp lệ" hoặc "Cần bổ sung".
- **Kiểm tra chéo (CrossCheck):** Phát hiện sự sai lệch dữ liệu giữa các giấy tờ với nhau.
- **LawGuard (Pháp chế AI):** Truy xuất và đối chiếu văn bản pháp luật (RAG) để đưa ra căn cứ và cảnh báo từ chối.
- **SLA & Priority:** Tự động đánh giá độ ưu tiên và thời gian cam kết xử lý hồ sơ.

---

## 🏗️ Kiến trúc Hệ thống (4 Services)

Hệ thống được thiết kế theo kiến trúc Microservices với 4 service chính:

```text
web (:3000)  Next.js (Frontend)
   │ HTTP
   ▼
api-gateway (:8080)  NestJS (Bảo mật: verify JWT, RBAC, Rate-limit, Proxy)
   │ HTTP
   ▼
core-svc (:4000)  NestJS (Orchestrator Pipeline, Business Logic)
   │ gRPC (:50051)  +  BullMQ (Redis, async)
   ▼
ai-svc (:50051/:8000)  FastAPI (AI Engine: OCR, HoSoBot, RAG, LawGuard)
```

- **api-gateway** là cổng public DUY NHẤT. `core-svc` và `ai-svc` chỉ giao tiếp nội bộ.
- **Database độc lập:** `core-svc` dùng MongoDB; `ai-svc` dùng Vector DB (Qdrant).
- **Giao tiếp liên dịch vụ:** Dùng gRPC cho tác vụ nhanh và BullMQ (Redis) cho tác vụ bất đồng bộ, tải nặng.

---

## 🚀 Cài đặt & Chạy ứng dụng

### 1. Yêu cầu Hệ thống
- Node.js >= 18, pnpm
- Python >= 3.10
- MongoDB, Redis, Qdrant (Có thể dùng Docker hoặc Cloud)

### 2. Thiết lập Môi trường
Cấu hình các biến môi trường trong file `.env` (tạo từ `.env.example`):
```bash
cp .env.example .env
```
> **⚠️ LƯU Ý QUAN TRỌNG KHI CHẠY LOCAL:**
> - **Bắt buộc có Redis:** Hệ thống dùng BullMQ để điều phối các Queue tác vụ AI. Nếu Redis không hoạt động, tiến trình kiểm tra hồ sơ sẽ bị treo ở bước "Đang kiểm tra chéo". Đảm bảo cập nhật chính xác `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
> - **Chế độ Demo (Mock OCR):** Việc gọi API OCR thực tế mất nhiều thời gian. Để quay demo mượt mà (xử lý <1s), hãy đặt `MOCK_OCR_FOR_DEMO=true` trong `.env`.

### 3. Khởi chạy Hệ thống
Bạn có thể chạy toàn bộ hệ thống bằng 1 lệnh duy nhất:

**Option 1: Docker Compose (Khuyến nghị cho Demo)**
Tự động dựng toàn bộ Web, Gateway, Core, AI, MongoDB, Redis, Qdrant.
```bash
docker compose -f infra/docker-compose.yml up --build
```

**Option 2: Dev Mode (Chạy Local cho Lập trình viên)**
```bash
bash scripts/setup.sh
pnpm dev
```

---

## 📖 Tài liệu API (Swagger UI)

Hệ thống cung cấp sẵn trang tài liệu API tự sinh qua Swagger. Sau khi khởi động hệ thống, truy cập:
👉 **[http://localhost:4000/api/docs](http://localhost:4000/api/docs)**

---

## ⚙️ Quy trình Pipeline Xử lý Hồ sơ (11 Bước)

| Bước | Tác vụ | AI / Module | Service xử lý |
|---|---|---|---|
| 1 | Nhận diện thủ tục | HoSoBot (NLP) | ai-svc |
| 2 | Người dân tải lên giấy tờ | Upload Manager | core-svc |
| 3 | Bóc tách thông tin | OCR (VNPT eKYC/Qwen) | ai-svc (Queue) |
| 4 | Đối chiếu chéo dữ liệu | CrossCheck Engine | core-svc |
| 5 | Chấm điểm hồ sơ (0-100) | Score Engine | core-svc |
| 6 | Kiểm duyệt pháp lý | LawGuard (RAG) | ai-svc (Queue) |
| 7 | Tự động điền Tờ khai | SmartForm | core-svc |
| 8 | Người dân xác nhận & Nộp | Submission | core-svc |
| 9 | Cán bộ kiểm tra lại | Gov Re-Check | core-svc |
| 10 | Phân luồng ưu tiên | SLA / Priority Ranking | core-svc |
| 11 | Báo cáo thống kê | InsightMap | core-svc |

---

## 🛠️ Stack Công nghệ Sử dụng

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend Core:** NestJS, Mongoose (MongoDB), BullMQ (Redis), Zod
- **Backend AI:** FastAPI, Python, gRPC, SentenceTransformers, Qdrant
- **Rule Engine:** Viết bằng TypeScript thuần (Đảm bảo minh bạch, có thể kiểm toán - Audit)
- **Hạ tầng:** Docker, GitHub Actions, AWS/Redis Cloud

---

## 🔒 Nguyên tắc Bảo mật (Privacy by Design)
1. **Zero-Retention:** Không lưu trữ dài hạn ảnh giấy tờ của người dân (tự động xóa sau TTL).
2. **AI là Trợ lý, không phải Người ra quyết định:** Mọi kết luận từ AI (chấm điểm, cảnh báo) chỉ mang tính chất tham khảo, quyết định cuối cùng thuộc về cán bộ nhà nước.
3. **Ẩn danh dữ liệu:** InsightMap và các dashboard thống kê chỉ sử dụng siêu dữ liệu (metadata), tuyệt đối không chứa PII (Thông tin định danh cá nhân).
4. **RBAC Chặt chẽ:** Phân quyền rõ ràng CITIZEN / OFFICER / ADMIN. Xác thực qua JWT tại cổng API Gateway.
