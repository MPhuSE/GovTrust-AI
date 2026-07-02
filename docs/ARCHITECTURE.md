# GovTrust AI — Kiến trúc hệ thống (CANONICAL)

> **Phiên bản:** 3.0 — 30/06/2026
> **Vai trò:** Nguồn sự thật DUY NHẤT về ranh giới service & module.
> Khi tài liệu này mâu thuẫn với `Gov_Trust.md`, `tai_lieu_phat_trien.md`, `Tong_Quan.md` về **số lượng service / giao thức / vị trí module**, **lấy tài liệu này**. Các tài liệu kia vẫn đúng về nghiệp vụ, pipeline 11 bước, DB schema, UX.

---

## 0. Vì sao có tài liệu này

4 tài liệu cũ mô tả 4 ranh giới service khác nhau, code lại đi theo kiểu thứ 5 (có thêm `insights-svc`, dùng gRPC nhưng chưa gen proto). Hệ quả: InsightMap bị viết 3 lần, 2 schema `insight-log` trùng, gateway và business dính nhau. Tài liệu này **chốt 4 service** và quy ước tổ chức module để hết loạn.

---

## 1. Bốn service

| # | Service | Stack | DB sở hữu | Expose ra ngoài? | Vai trò |
|---|---|---|---|---|---|
| 1 | **web** | Next.js 14 | — | ✅ public | Citizen App + Officer Dashboard |
| 2 | **api-gateway** | NestJS | — (Redis cho rate-limit) | ✅ **public** | Edge: verify JWT, RBAC, rate-limit, CORS, route |
| 3 | **core-svc** | NestJS | **MongoDB** `govtrust_business` | ❌ internal | Business + orchestrator pipeline; cấp JWT |
| 4 | **ai-svc** | FastAPI/Python | **Qdrant** `legal_chunks` | ❌ internal | OCR, HoSoBot, LawGuard/hybrid RAG, Embedding |

**Database per Service:** core-svc chỉ chạm MongoDB; ai-svc chỉ chạm Qdrant. Không truy cập chéo DB — chỉ qua gRPC/queue. (Đúng tinh thần `DATABASE_DESIGN.md`, nhưng bỏ `insights-svc` thừa.)

---

## 2. Giao tiếp giữa các service

```
┌─────────┐  HTTP/REST   ┌──────────────┐  HTTP/REST   ┌────────────┐
│   web   │ ───────────► │ api-gateway  │ ───────────► │  core-svc  │
│ (Next)  │ ◄─────────── │  (edge, JWT) │ ◄─────────── │  (Mongo)   │
└─────────┘              └──────────────┘              └─────┬──────┘
                                                  gRPC (sync)│ + BullMQ (async)
                                                             ▼
                                                       ┌────────────┐
                                                       │   ai-svc   │
                                                       │  (Qdrant)  │
                                                       └────────────┘
```

| Hop | Giao thức | Khi nào | Lý do |
|---|---|---|---|
| web → api-gateway | HTTP/REST | mọi request | browser không nói gRPC |
| api-gateway → core-svc | **HTTP/REST** | mọi request | gateway mỏng; tránh định nghĩa contract 2 lần |
| core-svc → ai-svc | **gRPC** | tác vụ nhanh: OCR 1 giấy, identify thủ tục, query RAG | hop nội bộ cần độ trễ thấp; ai-svc là gRPC server |
| core-svc → ai-svc | **BullMQ/Redis** | tác vụ nặng: LawGuard RAG đầy đủ, batch OCR, sinh InsightMap | async, tránh timeout. **gRPC KHÔNG thay queue** |

**Proto chung:** `packages/proto` (vai trò `libs/shared-proto`). ai-svc và core-svc cùng import — không copy `.proto` lệch version.

**Auth tách 2 phần:** core-svc cấp JWT (sở hữu `users`); api-gateway chỉ *verify* JWT mỗi request rồi gắn `X-User-Id` / `X-Role` cho core-svc.

---

## 3. Module nằm ở service nào (hết loạn)

### core-svc (`apps/core-svc`) — MongoDB
| Module | Nhóm | Clean-arch | Ghi chú |
|---|---|---|---|
| `auth` | nghiệp vụ | mỏng | login/register, issue JWT, RBAC |
| `procedures` | nghiệp vụ | mỏng | CRUD thủ tục (trỏ document_types) |
| `document-types` | nghiệp vụ | mỏng | **MỚI (OI-6)** — catalog giấy tờ dùng chung |
| `documents` | nghiệp vụ | mỏng | upload, quản lý file theo phiên |
| `sessions` | nghiệp vụ | **full** | vòng đời phiên — bảng quan trọng nhất |
| `scoring` | quyết định | **full** | CrossCheck + Score (gọi `packages/rule-engine`) |
| `smartform` | quyết định | mỏng | map OCR → form |
| `recheck` | quyết định | mỏng | Gov Re-Check (riskFlags) |
| `priority` | quyết định | mỏng | Priority A/B/C/D theo SLA |
| `insights` | analytics | mỏng | InsightMap — gộp `insights`+`insights-proxy` cũ thành 1 |

### ai-svc (`apps/ai-svc`) — Qdrant
| Module | Clean-arch | Ghi chú |
|---|---|---|
| `lawguard` | **full** | RAG: retrieve Qdrant + sinh cảnh báo có nguồn |
| `ocr` | mỏng | VNPT eKYC/SmartReader + normalizer |
| `hosobot` | mỏng | VNPT SmartBot + keyword fallback |
| `embedding` | mỏng | SentenceTransformer local hoặc embedding API; không trộn vector space |

### api-gateway (`apps/api-gateway`)
| Module | Clean-arch | Ghi chú |
|---|---|---|
| `auth-verify` | mỏng | guard verify JWT, gắn header user |
| `proxy` | mỏng | route → core-svc |

> **Clean-arch CÓ CHỌN LỌC:** `full` = `domain / application / infrastructure / presentation` (+ `domain/ports` khi gọi service khác). `mỏng` = `controller → service (→ repo)`, **không** tạo port/adapter khi chỉ 1 implementation. Lý do: hạn nộp 03/7, tiêu chí #1 là demo chạy ổn định — không phung phí thời gian vào boilerplate không tạo giá trị.

---

## 4. Layout thư mục đích

```
apps/
├── web/                                  # Next.js (giữ nguyên)
│
├── api-gateway/                          # NestJS — edge (MỚI)
│   └── src/
│       ├── modules/
│       │   ├── auth-verify/              # mỏng: guard verify JWT
│       │   └── proxy/                    # mỏng: route → core-svc
│       ├── app.module.ts
│       └── main.ts
│
├── core-svc/                             # NestJS — business + Mongo
│   ├── src/
│   │   ├── modules/
│   │   │   ├── sessions/                 # FULL clean-arch
│   │   │   │   ├── domain/               # entity, value-object, ports
│   │   │   │   ├── application/          # use-cases
│   │   │   │   ├── infrastructure/       # mongo repo, grpc-clients (→ai-svc)
│   │   │   │   ├── presentation/
│   │   │   │   │   ├── http/             # *.controller.ts (cho gateway gọi)
│   │   │   │   │   └── grpc/             # *.grpc-controller.ts (nếu service khác gọi vào)
│   │   │   │   └── sessions.module.ts
│   │   │   ├── scoring/                  # FULL — CrossCheck + Score
│   │   │   │   ├── domain/ application/ infrastructure/ presentation/
│   │   │   │   └── scoring.module.ts
│   │   │   ├── auth/                     # mỏng
│   │   │   ├── procedures/               # mỏng
│   │   │   ├── document-types/           # mỏng (MỚI)
│   │   │   ├── documents/                # mỏng
│   │   │   ├── smartform/                # mỏng
│   │   │   ├── recheck/                  # mỏng
│   │   │   ├── priority/                 # mỏng
│   │   │   └── insights/                 # mỏng (gộp insights + insights-proxy)
│   │   ├── database/schemas/             # mongoose schemas (6 collection + document_types)
│   │   ├── common/                       # guards, filters, decorators
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
│
└── ai-svc/                               # FastAPI/Python — AI + Qdrant
    ├── app/
    │   ├── api/routes/                   # REST nội bộ + Swagger
    │   ├── models/                       # Pydantic request/response
    │   ├── proto/                        # Python stubs gen từ shared proto
    │   ├── services/                     # OCR, HoSoBot, embedding, hybrid RAG
    │   ├── text/                         # chuẩn hoá/tokenize tiếng Việt
    │   ├── grpc_server.py                # AIService cho core-svc
    │   └── main.py                       # lifespan REST + gRPC
    ├── tests/
    └── requirements.txt

packages/
├── proto/                                # = libs/shared-proto: ai_service.proto, insights bỏ
└── rule-engine/                          # TS thuần — CrossCheck + Score (giữ nguyên)
```

---

## 5. Việc dọn so với code hiện tại

| # | Hành động | Lý do |
|---|---|---|
| 1 | **Xóa `apps/insights-svc`** | service thừa; InsightMap → module trong core-svc, chung `insight_logs` ⊂ `govtrust_business` |
| 2 | **Gộp `modules/insights` + `modules/insights-proxy` → 1 `insights`** | trùng chức năng |
| 3 | Bỏ 2 file `insight-log.schema.ts` trùng → còn 1 trong core-svc | |
| 4 | **Tạo `apps/api-gateway`** | tầng edge bị thiếu |
| 5 | **Tạo `apps/ai-svc` (FastAPI/Python)** | phù hợp ecosystem NLP/embedding, vẫn giữ shared gRPC contract |
| 6 | Xóa `apps/core-svc/src/modules/ai/*` (tạm) | đã chuyển sang ai-svc |
| 7 | Bỏ `insights_service.proto`; giữ `ai_service.proto` | core là gRPC server cho chính nó? không — chỉ ai-svc là server |
| 8 | **Thêm collection + module `document_types`** (OI-6) | catalog tổng quát hóa giấy tờ |
| 9 | core-svc: thêm **BullMQ consumer** (đang thiếu) | OCR async chưa có ai xử lý job |
| 10 | Sửa `scripts/setup.sh` (`apps/ai-gateway` → đúng path), thêm Dockerfile `web`/`core-svc`/`api-gateway` | demo 1 lệnh |

---

## 6. Vertical slice ưu tiên (để demo chạy sớm)

Dựng chạy được **1 luồng xuyên suốt** trước khi hoàn thiện mọi module:

```
web: chọn thủ tục → upload → "Phân tích"
  → api-gateway (verify) → core-svc
      → POST /sessions                (tạo phiên)
      → POST /documents/upload        (lưu file theo phiên)
      → core-svc --gRPC--> ai-svc: ExtractOCR   (VNPT hoặc mock)
      → scoring: CrossCheck + Score   (rule-engine, Mongo)
  → web: hiện Score 0–100 + lý do lỗi
```

Sau khi slice này chạy ≥3 lần ổn định mới thêm LawGuard (async), SmartForm, Officer flow, InsightMap.

---

*GovTrust AI — ARCHITECTURE.md v3.0. Mọi thành viên đọc file này trước khi tạo service/module mới.*
