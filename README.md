# GovTrust AI

**Hệ thống hỗ trợ tiền kiểm hồ sơ dịch vụ công**  
Vietnamese Student HackAIthon 2026 | Bảng B — Challenger

> Kiến trúc canonical: **`docs/ARCHITECTURE.md`** (nguồn sự thật khi các tài liệu khác mâu thuẫn).

## Cài đặt nhanh (1 lệnh)

```bash
# Option 1: Docker Compose (khuyến nghị cho demo)
docker compose -f infra/docker-compose.yml up --build

# Option 2: Dev mode
cp .env.example .env       # điền VNPT API keys nếu có (trống = OCR mock)
bash scripts/setup.sh
pnpm dev
```

## Kiến trúc — 4 service

```
web (:3000)  Next.js
   │ HTTP
   ▼
api-gateway (:8080)  NestJS edge — verify JWT, RBAC, rate-limit, proxy
   │ HTTP
   ▼
core-svc (:4000)  NestJS — business + orchestrator pipeline   [internal]
   │ gRPC (:50051)  +  BullMQ (Redis, async)
   ▼
ai-svc (:50051/:8000)  FastAPI — OCR / HoSoBot / hybrid RAG / Embedding [internal]
   DB: Qdrant (legal_chunks)

core-svc DB: MongoDB (govtrust_business)

packages/
├── rule-engine/  → CrossCheck + Score Engine (TypeScript thuần, audit được)
└── proto/        → gRPC contract chung (ai_service.proto)
```

- **web → api-gateway → core-svc**: HTTP. api-gateway là cổng public DUY NHẤT; core-svc & ai-svc nội bộ.
- **core-svc → ai-svc**: gRPC (tác vụ nhanh: OCR 1 giấy, identify, query RAG) + BullMQ (tác vụ nặng: LawGuard, batch).
- **Database per Service**: core-svc ↔ MongoDB, ai-svc ↔ Qdrant. Không truy cập chéo DB.

### Tổ chức module (clean-arch có chọn lọc)

| Service | Module | Clean-arch |
|---|---|---|
| core-svc | auth, procedures, document-types, documents, smartform, recheck, priority, insights | mỏng |
| core-svc | sessions, scoring | full (domain/application/infrastructure/presentation) |
| ai-svc | ocr, hosobot, embedding | mỏng |
| ai-svc | lawguard | full + ports/adapters |
| api-gateway | auth-verify, proxy | mỏng |

## Stack kỹ thuật

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| api-gateway | NestJS, JWT, http-proxy-middleware, Throttler |
| core-svc | NestJS, MongoDB (govtrust_business), BullMQ + Redis, gRPC client |
| ai-svc | FastAPI + Python gRPC, Qdrant, dense + BM25 hybrid retrieval |
| Rule Engine | TypeScript thuần (audit được, không LLM phán quyết) |
| Inter-service | gRPC (ai_service.proto) + BullMQ |
| AI APIs | VNPT eKYC OCR, SmartReader, SmartBot (trống → mock để demo) |

`ai-svc` mặc định dùng embedding API (`EMBEDDING_API_KEY`). Nếu cần chạy model local,
cài `apps/ai-svc/requirements-local.txt` rồi đặt `EMBEDDING_PROVIDER=local`.

## Pipeline 11 bước

| Bước | Module | Service |
|---|---|---|
| 1 | HoSoBot — nhận diện thủ tục | ai-svc |
| 2 | Upload giấy tờ | core-svc |
| 3 | OCR (VNPT eKYC/SmartReader) | ai-svc (qua gRPC/queue) |
| 4 | CrossCheck — đối chiếu chéo | core-svc (rule-engine) |
| 5 | Score Engine 0–100 | core-svc (rule-engine) |
| 6 | LawGuard — RAG văn bản pháp luật | ai-svc |
| 7 | SmartForm — tự điền form | core-svc |
| 8 | Người dân xác nhận | core-svc |
| 9 | Gov Re-Check (riskFlags) | core-svc |
| 10 | Priority Ranking (SLA) | core-svc |
| 11 | InsightMap — dashboard điểm nghẽn | core-svc (insights) |

## Chạy tests

```bash
bash scripts/run-tests.sh   # rule-engine + TypeScript checks + FastAPI pytest
```

## Nguyên tắc bảo mật

- Không lưu ảnh giấy tờ dài hạn (session TTL, auto-delete)
- AI chỉ cảnh báo tham khảo, không ra quyết định hành chính
- Không dùng CSDL dân cư thật trong MVP
- InsightMap chỉ dùng metadata ẩn danh (không PII)
- RBAC: CITIZEN / OFFICER / ADMIN (core-svc cấp JWT, api-gateway verify)
