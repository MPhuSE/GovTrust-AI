# Cấu trúc thư mục — GovTrust AI

Monorepo (pnpm + Turbo) gồm 4 service: `web`, `api-gateway`, `core-svc`, `ai-svc`.
Cây dưới đây chỉ liệt kê thư mục/file có ý nghĩa; đã bỏ qua `node_modules/`, `.next/`,
`dist/`, `.venv/`, `__pycache__/`, `.turbo/`, lock files và file build sinh tự động.

```text
GovTrust-AI/
├── apps/                              # 4 service của hệ thống
│   │
│   ├── web/                           # Frontend Next.js 14 — giao diện công dân + cán bộ
│   │   └── src/
│   │       ├── app/                   # App Router (routes)
│   │       │   ├── (citizen)/         # Nhóm route CÔNG DÂN
│   │       │   │   ├── services/      #   Chọn thủ tục
│   │       │   │   ├── upload/        #   Tải giấy tờ lên (bước 2)
│   │       │   │   ├── result/        #   Xem điểm AI + cảnh báo (bước 5)
│   │       │   │   ├── smartform/     #   Điền form tự động (bước 7)
│   │       │   │   ├── confirm/       #   Xác nhận & nộp hồ sơ (bước 8)
│   │       │   │   ├── track/         #   Theo dõi hồ sơ + kết quả cán bộ trả về
│   │       │   │   ├── history/       #   Lịch sử hồ sơ đã nộp
│   │       │   │   └── profile/       #   Hồ sơ cá nhân (thông tin eKYC)
│   │       │   ├── (officer)/         # Nhóm route CÁN BỘ
│   │       │   │   ├── dashboard/     #   InsightMap — dashboard điểm nghẽn (bước 11)
│   │       │   │   ├── queue/         #   Hàng đợi hồ sơ + ưu tiên A/B/C/D (bước 10)
│   │       │   │   └── recheck/       #   Gov Re-Check — tái kiểm hồ sơ (bước 9)
│   │       │   ├── login/             # Đăng nhập (redirect theo role)
│   │       │   ├── register/          # Đăng ký (luôn tạo CITIZEN)
│   │       │   └── api/               # Route handlers phía Next (nếu có)
│   │       ├── components/            # UI components dùng chung
│   │       ├── hooks/                 # React hooks (useSession, ...)
│   │       ├── lib/                   # api-client (gọi api-gateway) + tiện ích
│   │       ├── styles/                # CSS/Tailwind
│   │       └── middleware.ts          # Middleware Next (auth redirect)
│   │
│   ├── api-gateway/                   # Tầng edge NestJS — cổng public duy nhất
│   │   └── src/
│   │       ├── modules/               #   Verify JWT (RS256), RBAC, rate-limit, CORS
│   │       ├── health.controller.ts   #   Health check
│   │       └── main.ts                #   Bootstrap + proxy → core-svc
│   │
│   ├── core-svc/                      # Backend nghiệp vụ NestJS — sở hữu MongoDB
│   │   └── src/
│   │       ├── modules/               # Các module nghiệp vụ:
│   │       │   ├── auth/              #   Đăng nhập/đăng ký, eKYC, cấp JWT
│   │       │   ├── procedures/        #   Thủ tục + HoSoBot identify (bước 1)
│   │       │   ├── documents/         #   Upload giấy tờ + trigger OCR (bước 2-3)
│   │       │   ├── document-types/    #   Danh mục loại giấy tờ
│   │       │   ├── scoring/           #   CrossCheck + Score + LawGuard (bước 4-6)
│   │       │   ├── smartform/         #   Tự điền biểu mẫu (bước 7)
│   │       │   ├── sessions/          #   Quản lý phiên + confirm + xoá file
│   │       │   ├── signatures/        #   Chữ ký điện tử (audit trail)
│   │       │   ├── recheck/           #   Gov Re-Check — phân loại rủi ro (bước 9)
│   │       │   ├── priority/          #   Priority Ranking A/B/C/D (bước 10)
│   │       │   ├── insights/          #   InsightMap — log lỗi ẩn danh (bước 11)
│   │       │   └── jobs/              #   Trạng thái job bất đồng bộ
│   │       ├── database/schemas/      # Mongoose schemas (Session, User, Procedure...)
│   │       ├── grpc/                  # gRPC client gọi ai-svc
│   │       ├── queue/                 # BullMQ producer + consumer (tác vụ nặng)
│   │       ├── common/                # Guards, decorators, filters, utils (PII crypto)
│   │       └── main.ts                # Bootstrap core-svc (:4000)
│   │
│   └── ai-svc/                        # Service AI Python/FastAPI — sở hữu Qdrant
│       └── app/
│           ├── api/routes/            # REST nội bộ: ocr, lawguard, hosobot, ekyc, embeddings
│           ├── services/              # Logic AI:
│           │   ├── ocr.py             #   OCR trích xuất trường thông tin
│           │   ├── qwen_law_extractor.py  # Trích xuất căn cứ pháp lý
│           │   ├── hybrid_search.py   #   RAG lai (dense + BM25) trên Qdrant
│           │   ├── hosobot.py         #   Nhận diện thủ tục
│           │   ├── ekyc.py            #   Xác thực định danh
│           │   ├── embedding.py       #   Sinh embedding
│           │   └── llm.py             #   Gọi model LLM
│           ├── text/                  # Xử lý tiếng Việt (chuẩn hoá, tách từ)
│           ├── models/                # Pydantic models
│           ├── proto/                 # gRPC stubs sinh từ .proto
│           ├── grpc_server.py         # gRPC server (:50051)
│           └── main.py                # FastAPI app (:8000)
│
├── packages/                          # Package dùng chung trong monorepo
│   ├── proto/                         # ai_service.proto — contract gRPC core-svc ↔ ai-svc
│   └── rule-engine/                   # Engine chấm điểm & đối chiếu (thuần logic, dễ audit)
│       ├── src/
│       │   ├── engine.ts              #   ScoreEngine — chấm điểm 0-100 theo trọng số
│       │   ├── crosscheck.ts          #   CrossChecker — đối chiếu chéo giấy tờ
│       │   ├── rules/                 #   Rule: thiếu giấy, hết hạn, ảnh mờ, sai lệch...
│       │   ├── validators/            #   Validator ngày/tên
│       │   └── weights/               #   Trọng số điểm theo thủ tục
│       └── __tests__/                 #   Unit test rule-engine
│
├── infra/                             # Hạ tầng & orchestration
│   ├── docker-compose.yml             #   Compose môi trường dev
│   ├── docker-compose.prod.yml        #   Compose production
│   ├── mongo/                         #   Script init & seed MongoDB
│   └── nginx/                         #   Cấu hình reverse proxy (dev/prod/ACME)
│
├── data/                              # Dữ liệu tĩnh cho MVP
│   ├── legal-sources/                 #   Văn bản pháp luật (PDF + đã chunk) → Qdrant
│   └── test-documents/                #   Giấy tờ mẫu để test theo thủ tục
│
├── template/                          # Mẫu biểu mẫu đầu ra (docx) theo thủ tục
│
├── scripts/                           # Script tiện ích, seed, e2e, ingest
│   ├── seed.mjs                       #   Seed thủ tục/dữ liệu gốc
│   ├── seed-officer.js                #   Tạo tài khoản cán bộ (OFFICER) nội bộ
│   ├── seed-kethon-user.js            #   Seed user test đã eKYC
│   ├── e2e-smoke.mjs                  #   E2E 11 bước qua REST (có assertion)
│   ├── ingest-all-legal-qdrant.py     #   Nạp văn bản luật vào Qdrant
│   └── ...                            #   Các script chunk luật / gen ảnh test / OCR
│
├── docs/                              # Tài liệu dự án
│   ├── Gov_Trust.md                   #   Đề án tổng thể GovTrust AI
│   ├── ARCHITECTURE.md                #   Kiến trúc hệ thống (nguồn chân lý)
│   ├── DATABASE_DESIGN.md             #   Thiết kế dữ liệu
│   ├── SERVICES_FLOW.md               #   Luồng giao tiếp giữa các service
│   ├── SIGNATURE_FLOW.md              #   Luồng chữ ký điện tử
│   ├── openapi.json                   #   Đặc tả API
│   └── ...                            #   Mapping thủ tục, test cases, chi phí vận hành
│
├── .env.example                       # Mẫu biến môi trường (copy → .env)
├── package.json                       # Script monorepo (dev/build/test qua Turbo)
├── pnpm-workspace.yaml                # Khai báo workspace pnpm
├── turbo.json                         # Cấu hình pipeline Turbo
├── README.md                          # Giới thiệu & hướng dẫn chạy
└── STRUCTURE.md                       # (File này) cấu trúc thư mục repo
```

## Ghi chú kiến trúc nhanh

- **Luồng giao tiếp:** `web` → `api-gateway` (HTTP, verify JWT) → `core-svc`.
  `core-svc` gọi `ai-svc` qua **gRPC** (tác vụ nhanh) hoặc **BullMQ/Redis** (tác vụ nặng).
- **Database per Service:** `core-svc` sở hữu **MongoDB** (`govtrust_business`);
  `ai-svc` sở hữu **Qdrant** (`legal_chunks`). Không truy cập chéo DB — chỉ qua gRPC/queue theo `sessionId`.
- **Pipeline 11 bước** trải từ công dân (1-8) sang cán bộ (9-11), xem chú thích trong cây thư mục.
