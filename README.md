# GovTrust AI

**Hệ thống hỗ trợ tiền kiểm hồ sơ dịch vụ công**  
Vietnamese Student HackAIthon 2026 | Bảng B — Challenger

## Cài đặt nhanh (1 lệnh)

```bash
# Option 1: Docker Compose (khuyến nghị cho demo)
docker compose -f infra/docker-compose.yml up --build

# Option 2: Dev mode
cp .env.example .env  # Điền API key VNPT
bash scripts/setup.sh
pnpm dev
```

## Kiến trúc Microservices

```
web (:3000)
    │ REST HTTP
    ▼
core-svc (:4000)          ← NestJS, Auth + Sessions + Scoring
    │              │
    │ gRPC         │ gRPC
    ▼ (:50051)     ▼ (:50052)
ai-svc           insights-svc
FastAPI          NestJS
OCR/LawGuard/    InsightMap
HoSoBot          Dashboard
DB: Qdrant       DB: MongoDB (govtrust_analytics)

packages/
├── rule-engine/  → CrossCheck + Score Engine (TypeScript, audit được)
└── proto/        → Shared .proto files (ai_service, insights_service)
```

### Database per Service
| Service | DB | Database |
|---|---|---|
| `core-svc` | MongoDB | `govtrust_core` |
| `ai-svc` | Qdrant | `legal_chunks` |
| `insights-svc` | MongoDB | `govtrust_analytics` |

## Stack kỹ thuật

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| core-svc | NestJS, MongoDB (govtrust_core), BullMQ + Redis |
| ai-svc | FastAPI, Qdrant, sentence-transformers, gRPC server |
| insights-svc | NestJS gRPC microservice, MongoDB (govtrust_analytics) |
| Rule Engine | TypeScript thuần (audit được, không LLM phán quyết) |
| Inter-service | gRPC (protobuf) — ai_service.proto + insights_service.proto |
| Infra | Docker Compose, Nginx, Redis |
| AI APIs | VNPT eKYC OCR, SmartReader, SmartBot, SmartVoice |

## Pipeline 11 bước

| Bước | Module | Mô tả |
|---|---|---|
| 1 | HoSoBot | Nhận diện thủ tục phù hợp |
| 2 | Upload | Kiểm tra định dạng + chất lượng ảnh |
| 3 | OCR | VNPT SmartReader/eKYC bóc tách thông tin |
| 4 | CrossCheck | Đối chiếu chéo đa giấy tờ |
| 5 | Score Engine | Chấm điểm 0–100 rule-based |
| 6 | LawGuard | RAG truy xuất văn bản pháp luật |
| 7 | SmartForm | Tự điền form từ dữ liệu OCR |
| 8 | Xác nhận | Người dân kiểm tra và xác nhận |
| 9 | Gov Re-Check | Cán bộ tái kiểm + riskFlags |
| 10 | Priority Ranking | Xếp hồ sơ theo SLA |
| 11 | InsightMap | Dashboard phân tích điểm nghẽn |

## Chạy tests

```bash
bash scripts/run-tests.sh
# hoặc
pnpm test
```

## Nguyên tắc bảo mật

- Không lưu ảnh giấy tờ dài hạn (TTL 24h, auto-delete)
- AI chỉ cảnh báo tham khảo, không ra quyết định hành chính
- Không dùng CSDL dân cư thật trong MVP
- InsightMap chỉ dùng metadata ẩn danh (không PII)
- RBAC: CITIZEN / OFFICER / ADMIN
