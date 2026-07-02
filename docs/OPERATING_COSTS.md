# Chi phí vận hành — GovTrust AI

> Ước tính chi phí vận hành theo tải. Nguồn kiến trúc: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) và [`README.md`](../README.md).
> Đơn giá lấy từ bảng giá chính thức VNPT (chưa gồm VAT):
> - eKYC: <https://vnptai.io/ekyc/vi/price> — đồng giá **800đ/request**
> - SmartReader: <https://vnptai.io/smartreader/vi/price> — **~700đ/trang**
> - SmartBot: <https://vnptai.io/smartbot/vi/price> — **~605đ/request**

## 1. Mô hình chi phí

| Loại | Thành phần | Đặc điểm |
|---|---|---|
| **Cố định** | 4 service compute (`web`, `api-gateway`, `core-svc`, `ai-svc`) + datastore (MongoDB, Redis, Qdrant) | Chạy 24/7, không phụ thuộc số hồ sơ |
| **Biến phí** | VNPT eKYC (OCR + face matching), SmartReader, SmartBot | Tăng tuyến tính theo số hồ sơ |

**Đòn bẩy tiết kiệm chính:**
- `EMBEDDING_PROVIDER=local` → chi phí embedding = 0 (chỉ tốn RAM/CPU của `ai-svc`).
- Toàn bộ datastore (MongoDB, Redis, Qdrant) self-host chung VPS → không tốn managed DB.
- eKYC là biến phí lớn nhất khi scale → mua **gói dài hạn (12 tháng)** để giảm đơn giá thực.

## 2. Giả định về tải

1 hồ sơ tiêu thụ ước tính **~3 request eKYC** (1 OCR CCCD + 1 face matching + 1 OCR giấy tờ khác).
> ⚠️ Cần hiệu chỉnh theo thực tế: face matching có bật không, số giấy tờ OCR mỗi hồ sơ.

## 3. Bảng giá eKYC VNPT (800đ/request)

| Hồ sơ/tháng | Request (~×3) | Gói phù hợp | VND/tháng |
|---|---|---|---|
| ~30 (demo) | ~100 | **Free** (100 req) | 0 |
| ~300 | ~1.000 | eKYC 1 | 800.000 |
| ~1.000 (pilot) | ~3.000 | eKYC 2 | 2.400.000 |
| ~1.600 | ~5.000 | eKYC 3 | 4.000.000 |
| ~3.300 | ~10.000 | eKYC 4 (+NFC) | 8.000.000 |

> Gói 12 tháng rẻ hơn/đơn vị. VD **eKYC 11**: 12.000 req/năm = 9.600.000đ → **~800.000đ/tháng** cho 1.000 req/tháng, có sẵn NFC.

### 3.1 SmartReader — OCR giấy tờ (~700đ/trang)

| Gói | Số trang | VND/tháng | Đơn giá/trang |
|---|---|---|---|
| Free | 150 | 0 | 0 |
| Trial | 300 | 0 | 0 |
| Reader 5 | 5.000 | 3.500.000 | 700 |
| Reader 10 ★ | 10.000 | 6.850.000 | 685 |
| Reader 30 | 30.000 | 20.550.000 | 685 |

### 3.2 SmartBot — HoSoBot tư vấn thủ tục (~605đ/request)

| Gói | Thời hạn | Request | VND/tháng (quy đổi) |
|---|---|---|---|
| Trial | 1 tháng | 3.000 | **0** |
| Chatbot GenAI 01 | 1 tháng | 50.000 | 30.250.000 |
| Chatbot GenAI 02 | 6 tháng | 400.000 | ~39.300.000 |

> ⚠️ **Cảnh báo bước nhảy giá SmartBot:** gói trả phí nhỏ nhất đã là **50.000 request/tháng = 30,25 triệu**, không có gói trung gian. Với pilot nhỏ nên **ở trong hạn Trial 3.000 request/tháng miễn phí** (1 phiên bot dùng nhiều request → theo dõi sát), hoặc dùng **mock SmartBot** để demo.

## 4. Tổng chi phí vận hành theo kịch bản

### Kịch bản A — Demo / Hackathon
| Khoản | VND/tháng |
|---|---|
| VPS self-host (cả stack qua `docker-compose`) | 200.000 – 500.000 |
| eKYC — gói **Free** (100 req) | 0 |
| Embedding local | 0 |
| **Tổng** | **~200k – 500k** |

### Kịch bản B — Pilot ~1.000 hồ sơ/tháng
| Khoản | VND/tháng |
|---|---|
| VPS 8vCPU/16GB (chạy cả `ai-svc` embedding local) | 500.000 – 1.000.000 |
| Database (Mongo + Qdrant + Redis self-host chung VPS) | 0 |
| Backup định kỳ + object storage | 100.000 – 300.000 |
| Domain + SSL (Let's Encrypt = 0) | ~50.000 |
| Monitoring/logging (self-host / free tier) | 0 – 300.000 |
| eKYC 2 (3.000 request) | 2.400.000 |
| SmartReader — Reader 5 (5.000 trang, ~2 trang/hồ sơ) | 3.500.000 |
| SmartBot — Trial (≤3.000 request/tháng) | 0 |
| Embedding local | 0 |
| Bảo trì (tự vận hành) | 0 |
| **Tổng** | **~6 – 7 triệu** |

> Nếu SmartBot vượt hạn Trial → nhảy lên **+30,25 triệu** (gói 50.000 req). Cần kiểm soát số request bot hoặc dùng mock ở giai đoạn pilot.

### Kịch bản C — Production ~10.000 hồ sơ/tháng
| Khoản | VND/tháng |
|---|---|
| Compute auto-scale (`core-svc` / `ai-svc`) + datastore | 5.000.000 – 10.000.000 |
| Managed DB (Mongo Atlas + Qdrant Cloud + Redis) *nếu dùng* | 2.000.000 – 3.000.000 |
| Backup + monitoring + domain/SSL | 500.000 – 1.000.000 |
| eKYC (30.000 request → gói eKYC 5) | 24.000.000 |
| SmartReader — Reader 30 (30.000 trang) | 20.550.000 |
| SmartBot — Chatbot GenAI 01 (50.000 request) | 30.250.000 |
| **Nhân sự DevOps/bảo trì** (phần thời gian) | 5.000.000 – 15.000.000 |
| **Tổng** | **~90 – 110 triệu** |

## 5. Chi phí Database & lưu trữ

Database per Service: `core-svc` ↔ MongoDB, `ai-svc` ↔ Qdrant, Redis cho BullMQ/cache.

| Datastore | Nội dung lưu | Tăng trưởng | Chi phí VND/tháng |
|---|---|---|---|
| **MongoDB** (`govtrust_business`) | Metadata hồ sơ, session, scoring, insights | ~vài KB/hồ sơ (ảnh KHÔNG lưu dài hạn — TTL auto-delete) → tăng chậm | Self-host: 0 (chung VPS). Atlas M10: ~1.400.000 |
| **Qdrant** (`legal_chunks`) | Vector 768-dim của văn bản pháp luật | Gần như **cố định** (theo kho luật, không theo hồ sơ) | Self-host: 0. Qdrant Cloud: ~600.000 |
| **Redis** | Hàng đợi BullMQ + cache | RAM-bound, ephemeral | Self-host: 0. Managed: ~350.000 |
| **Backup** (dump định kỳ + object storage) | Snapshot Mongo/Qdrant | Theo dung lượng DB | 100.000 – 500.000 |

> **Điểm mấu chốt:** nhờ nguyên tắc *không lưu ảnh giấy tờ dài hạn* (session TTL, auto-delete — nguyên tắc bảo mật trong [`README.md`](../README.md)), MongoDB **không phình theo ảnh** → chi phí storage rất thấp. Qdrant cố định theo kho luật, chỉ tăng khi bổ sung văn bản mới.

## 6. Chi phí bảo trì & vận hành

Đây thường là khoản **bị bỏ sót** nhưng lớn nhất ở production thật (chi phí con người).

| Khoản | Mô tả | VND/tháng |
|---|---|---|
| **Nhân sự DevOps/vận hành** | Giám sát, xử lý sự cố, deploy, vá lỗi | Demo: 0 (tự làm) · Production: 1 phần lương kỹ sư (~5 – 15 triệu tùy % thời gian) |
| **Cập nhật kho luật (Qdrant)** | Re-ingest + re-embedding khi văn bản pháp luật thay đổi | Embedding local: 0đ token, chỉ tốn CPU/thời gian |
| **Patch bảo mật & cập nhật dependency** | Nâng cấp NestJS/FastAPI/thư viện, vá CVE | Gộp trong công vận hành |
| **Monitoring & logging** | Uptime, alert, log tập trung (self-host Grafana/Loki hoặc SaaS free tier) | 0 – 500.000 |
| **Domain + SSL** | Tên miền `.vn` / `.gov.vn` + chứng chỉ (Let's Encrypt = 0) | ~30.000 – 100.000 (phân bổ theo tháng) |
| **Bandwidth / egress** | Upload ảnh giấy tờ → `ai-svc`, traffic public qua api-gateway | Thường gộp trong VPS; cloud tính riêng ~100.000 – 500.000 |

## 7. Cần xác nhận để chốt con số cuối

- [ ] Số request eKYC thực tế mỗi hồ sơ (face matching bật/tắt, số giấy tờ OCR).
- [ ] Số **trang SmartReader** trung bình mỗi hồ sơ (quyết định chọn gói Reader).
- [ ] Số **request SmartBot** trung bình mỗi phiên (để biết có vượt hạn Trial 3.000/tháng không).
- [ ] VPS/cloud thực tế sẽ thuê (nhà cung cấp, cấu hình).

---

*Cập nhật: 2026-07-03. Con số hạ tầng là ước lượng thị trường VN; đơn giá eKYC là giá niêm yết chính thức VNPT.*
