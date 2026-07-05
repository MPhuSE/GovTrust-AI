# GovTrust AI — Hệ thống Tiền kiểm Hồ sơ Dịch vụ công

**GovTrust AI** là nền tảng số hóa và tự động hóa quy trình tiền kiểm hồ sơ dịch vụ công trực tuyến. Hệ thống ứng dụng AI (OCR, NLP, RAG) để tự động bóc tách thông tin, đối chiếu chéo, chấm điểm tính hợp lệ của giấy tờ và tự động điền Tờ khai — giúp giảm thời gian xử lý thủ tục hành chính và hỗ trợ cán bộ ra quyết định.

Dự án tham gia: **Vietnamese Student HackAIthon 2026 | Bảng B — Challenger**

Demo trực tuyến: **https://govtrust.site**

---

## Cài đặt & Chạy — 1 lệnh duy nhất

Yêu cầu duy nhất: **Docker + Docker Compose (v2)**. Không cần cài Node/Python/OpenSSL trên máy.

**Bước 1:** Clone mã nguồn

```bash
git clone https://github.com/MPhuSE/GovTrust-AI.git
cd GovTrust-AI
```

**Bước 2:** Chạy lệnh khởi động theo Hệ điều hành:

_Dành cho macOS / Linux / WSL:_

```bash
bash scripts/quickstart.sh
```

_Dành cho Windows (CMD / PowerShell):_

```cmd
.\scripts\quickstart.bat
```

Script sẽ tự động:

1. Tạo `.env` từ `.env.example` (nếu chưa có).
2. **Tự sinh JWT RSA keypair (RS256) + PII encryption key đa nền tảng** bằng Docker.
3. Dựng toàn bộ stack qua Docker Compose: `web · api-gateway · core-svc · ai-svc · mongo · redis · qdrant`.

Sau khi chạy xong:

| Thành phần           | URL                            |
| -------------------- | ------------------------------ |
| Cổng người dân       | http://localhost:3000          |
| API Gateway (health) | http://localhost:8080/health   |
| Swagger API          | http://localhost:4000/api/docs |

**Lệnh vận hành:**

```bash
docker compose -f infra/docker-compose.yml logs -f    # xem log
docker compose -f infra/docker-compose.yml down       # dừng toàn bộ
```

---

## Tính năng Nổi bật

### Dành cho Người dân (Citizen)

- **Tích hợp eKYC:** Tự động lấy thông tin định danh (CCCD) từ tài khoản đã xác thực, không cần nộp lại.
- **Ảnh mẫu 1-chạm:** Mỗi ô tải giấy tờ có nút "Dùng ảnh mẫu" với nhiều biến thể (hợp lệ / sai lệch) — nạp thẳng vào form để demo nhanh.
- **Bóc tách tự động (OCR):** Đọc và trích xuất dữ liệu từ Giấy chứng sinh, Giấy kết hôn, Sổ đỏ, Hợp đồng, ĐKHKD… (định tuyến VNPT SmartReader / Qwen VL theo loại giấy).
- **SmartForm:** Tự động mapping dữ liệu vào biểu mẫu Tờ khai, xuất PDF/DOCX hoàn chỉnh.

### Dành cho Cán bộ (Officer)

- **Hàng chờ ưu tiên (SLA & Priority):** Tự động xếp hạng hồ sơ **A/B/C/D** theo điểm số, mức độ rủi ro và hạn xử lý.
- **AI Tiền kiểm (Score Engine):** Chấm điểm 0–100, phân loại "Hợp lệ" / "Cần bổ sung".
- **Kiểm tra chéo (CrossCheck):** Phát hiện sai lệch dữ liệu giữa các giấy tờ, kèm căn cứ pháp lý.
- **Xem tờ khai công dân đã nộp:** Trang tái kiểm hiển thị đầy đủ biểu mẫu người dân gửi lên (ẩn PII theo chính sách).
- **LawGuard (Pháp chế AI):** Truy xuất văn bản pháp luật (RAG/Qdrant) để đưa căn cứ và cảnh báo.
- **Dashboard thống kê (InsightMap):** Trực quan hóa điểm nghẽn — **chỉ tính hồ sơ đã nộp**, ẩn danh dữ liệu.

---

## Kiến trúc Hệ thống (4 Services)

```text
web (:3000)  Next.js (Frontend)
   │ HTTP
   ▼
api-gateway (:8080)  NestJS — cổng public DUY NHẤT (verify JWT RS256, RBAC, rate-limit, proxy)
   │ HTTP
   ▼
core-svc (:4000)  NestJS — Orchestrator pipeline, business logic, MongoDB
   │ gRPC (:50051)  +  BullMQ (Redis, async)
   ▼
ai-svc (:8000/:50051)  FastAPI — AI Engine: OCR, RAG, LawGuard, Qdrant
```

- **api-gateway** là cổng public duy nhất; `core-svc` và `ai-svc` chỉ giao tiếp nội bộ.
- **DB độc lập:** `core-svc` → MongoDB; `ai-svc` → Qdrant (vector DB).
- **Giao tiếp:** gRPC cho tác vụ nhanh, BullMQ (Redis) cho tác vụ AI bất đồng bộ, tải nặng.
- **Auth:** JWT ký RS256 tại `core-svc` (private key), verify tại `api-gateway` (public key).

---

## Pipeline Xử lý Hồ sơ (11 Bước)

| Bước | Tác vụ                   | Module                   | Service        |
| ---- | ------------------------ | ------------------------ | -------------- |
| 1    | Nhận diện thủ tục        | NLP                      | ai-svc         |
| 2    | Người dân tải giấy tờ    | Upload Manager           | core-svc       |
| 3    | Bóc tách thông tin       | OCR (VNPT / Qwen VL)     | ai-svc (Queue) |
| 4    | Đối chiếu chéo dữ liệu   | CrossCheck Engine        | core-svc       |
| 5    | Chấm điểm hồ sơ (0–100)  | Score Engine             | core-svc       |
| 6    | Kiểm duyệt pháp lý       | LawGuard (RAG)           | ai-svc (Queue) |
| 7    | Tự động điền Tờ khai     | SmartForm                | core-svc       |
| 8    | Người dân xác nhận & nộp | Submission               | core-svc       |
| 9    | Cán bộ tái kiểm          | Gov Re-Check             | core-svc       |
| 10   | Phân luồng ưu tiên       | SLA / Priority (A/B/C/D) | core-svc       |
| 11   | Báo cáo thống kê         | InsightMap               | core-svc       |

---

## Chạy Dev Mode (dành cho lập trình viên)

Nếu muốn hot-reload thay vì Docker, cần cài Node ≥ 20, pnpm ≥ 9, Python ≥ 3.10:

```bash
bash scripts/setup.sh     # cài deps JS + venv Python + build rule-engine
pnpm dev:full             # Redis (Docker) + turbo dev cho cả 4 service
```

`pnpm dev:full` dùng **MongoDB Atlas** và **Qdrant remote** (không cần chạy local) — chỉ bật Redis qua Docker cho BullMQ.

---

## Stack Công nghệ

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend Core:** NestJS, Mongoose (MongoDB), BullMQ (Redis), Zod
- **Backend AI:** FastAPI, Python, gRPC, SentenceTransformers, Qdrant
- **Rule Engine:** TypeScript thuần (minh bạch, có thể kiểm toán)
- **Hạ tầng:** Docker, GitHub Actions, Nginx + Let's Encrypt (TLS)

---

## Nguyên tắc Bảo mật (Privacy by Design)

1. **Zero-Retention:** Không lưu dài hạn ảnh giấy tờ — tự xóa sau TTL và ngay sau khi người dân xác nhận.
2. **AI là Trợ lý, không phải Người quyết định:** Mọi kết luận AI (điểm số, cảnh báo) chỉ để tham khảo; quyết định cuối thuộc về cán bộ.
3. **Ẩn danh thống kê:** InsightMap chỉ dùng metadata ẩn danh, không chứa PII.
4. **Mask PII:** Officer xem hồ sơ người khác đều bị che CCCD/tên/ngày sinh (AES-256-GCM cho dữ liệu nhạy cảm khi lưu).
5. **RBAC chặt:** Phân quyền CITIZEN / OFFICER / ADMIN; tài khoản cán bộ chỉ cấp qua seed nội bộ (chống leo thang đặc quyền).
