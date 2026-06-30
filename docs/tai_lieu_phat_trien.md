# GovTrust AI — Tài Liệu Phát Triển Cho Team
### Vietnamese Student HackAIthon 2026 | Bảng B — Challenger

> **Phiên bản:** 1.0 — Cập nhật: 28/06/2026
> **Tham chiếu:** [Tong_Quan.md](file:///c:/Users/Administrator/Desktop/PROJECT/GOV/docs/Tong_Quan.md)
> **Mục tiêu:** Hướng dẫn kỹ thuật chi tiết để team triển khai MVP từ ngày 26/6 – 03/7/2026.

---

## Mục lục

0. [Tổng quan sản phẩm & Nguyên tắc phát triển](#0-tổng-quan-sản-phẩm--nguyên-tắc-phát-triển)
1. [Cấu trúc Monorepo & Cách khởi tạo](#1-cấu-trúc-monorepo--cách-khởi-tạo)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Thiết lập môi trường phát triển](#3-thiết-lập-môi-trường-phát-triển)
4. [Kiến trúc hệ thống chi tiết](#4-kiến-trúc-hệ-thống-chi-tiết)
5. [Module Specifications & API Contracts](#5-module-specifications--api-contracts)
6. [Tích hợp API VNPT (BẮT BUỘC)](#6-tích-hợp-api-vnpt-bắt-buộc)
7. [Data Models & Database Schema](#7-data-models--database-schema)
8. [Frontend — Citizen App & Dashboard](#8-frontend--citizen-app--dashboard)
9. [Backend — NestJS API Orchestrator](#9-backend--nestjs-api-orchestrator)
10. [AI Gateway — FastAPI](#10-ai-gateway--fastapi)
11. [Rule Engine & Score Engine](#11-rule-engine--score-engine)
12. [LawGuard — RAG Pipeline](#12-lawguard--rag-pipeline)
13. [Bảo mật & Xử lý dữ liệu](#13-bảo-mật--xử-lý-dữ-liệu)
14. [Testing Strategy](#14-testing-strategy)
15. [CI/CD & Deployment](#15-cicd--deployment)
16. [Phân công & Timeline chi tiết](#16-phân-công--timeline-chi-tiết)
17. [Quy ước code & Git workflow](#17-quy-ước-code--git-workflow)
18. [Checklist hoàn thành MVP](#18-checklist-hoàn-thành-mvp)

---

## 0. Tổng quan sản phẩm & Nguyên tắc phát triển

### Sản phẩm là gì?

**GovTrust AI** — Hệ thống hỗ trợ tiền kiểm hồ sơ dịch vụ công, bao gồm các module:

| Module | Chức năng chính |
| --- | --- |
| **HoSoBot** | Chatbot nhận diện thủ tục phù hợp với nhu cầu người dân |
| **Document AI / OCR** | Bóc tách thông tin giấy tờ tùy thân qua API VNPT SmartReader/eKYC |
| **CrossCheck** | Đối chiếu chéo dữ liệu giữa nhiều giấy tờ (tên, ngày sinh, địa chỉ, số CCCD) |
| **Score Engine** | Chấm điểm hồ sơ 0–100 dựa trên rule-based (audit được) |
| **LawGuard** | RAG truy xuất văn bản pháp luật, cảnh báo tham khảo kèm nguồn |
| **SmartForm** | Tự điền form mẫu từ dữ liệu OCR |
| **Gov Re-Check** | Tái kiểm hồ sơ cho cán bộ một cửa |
| **Priority Ranking** | Phân loại ưu tiên hồ sơ (A/B/C/D) |
| **InsightMap** | Dashboard phân tích điểm nghẽn thủ tục (metadata ẩn danh) |

### Nguyên tắc phát triển QUAN TRỌNG

> ⚠️ **BẮT BUỘC:** Tất cả module AI phải tích hợp API VNPT thật do Ban Tổ Chức cung cấp. **KHÔNG ĐƯỢC dùng mock/giả lập cho API VNPT.**

1. **AI không ra quyết định hành chính** — chỉ cảnh báo, gợi ý, tham khảo. Quyết định thuộc người dân/cán bộ.
2. **Dữ liệu xử lý theo phiên** — không lưu giấy tờ gốc dài hạn, xóa file sau khi kiểm tra.
3. **Rule-based cho scoring** — tránh LLM phán quyết để dễ audit, dễ giải thích.
4. **Database per Service** — NestJS sở hữu MongoDB, FastAPI sở hữu Vector DB. Không truy cập chéo.
5. **Mọi cảnh báo pháp lý phải kèm nguồn** — citation, confidence score, disclaimer.

---

## 1. Cấu trúc Monorepo & Cách khởi tạo

### Cấu trúc thư mục

```
govtrust-ai/
├── apps/
│   ├── web/                          # Next.js — Citizen App + InsightMap Dashboard
│   │   ├── src/
│   │   │   ├── app/                  # App Router (Next.js 14+)
│   │   │   │   ├── (citizen)/        # Route group: Người dân
│   │   │   │   │   ├── page.tsx      # Trang chủ — chọn thủ tục
│   │   │   │   │   ├── upload/       # Upload giấy tờ
│   │   │   │   │   ├── result/       # Kết quả Score + cảnh báo
│   │   │   │   │   ├── smartform/    # Form tự điền
│   │   │   │   │   └── confirm/      # Xác nhận hồ sơ
│   │   │   │   ├── (officer)/        # Route group: Cán bộ một cửa
│   │   │   │   │   ├── recheck/      # Gov Re-Check
│   │   │   │   │   ├── priority/     # Priority Ranking
│   │   │   │   │   └── dashboard/    # InsightMap Dashboard
│   │   │   │   ├── login/            # Đăng nhập (RBAC)
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Button, Input, Card, Modal, Progress...
│   │   │   │   ├── upload/           # UploadZone, FilePreview, ImageQuality
│   │   │   │   ├── ocr/              # FieldTable, ConfidenceBadge
│   │   │   │   ├── score/            # ScoreCard, ScoreBreakdown, WarningList
│   │   │   │   ├── smartform/        # FormPreview, FieldMapper, MissingAlert
│   │   │   │   ├── lawguard/         # CitationCard, ConfidenceBar, Disclaimer
│   │   │   │   ├── dashboard/        # HeatMap, TopErrors, TrendChart, FilterBar
│   │   │   │   └── chatbot/          # HoSoBot widget
│   │   │   ├── hooks/                # useSession, useUpload, usePipeline...
│   │   │   ├── lib/                  # API client, utils, constants
│   │   │   └── styles/               # globals.css, design tokens
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                          # NestJS — API Orchestrator
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # JWT + RBAC (citizen / officer / admin)
│   │   │   │   ├── procedures/       # CRUD thủ tục, template, checklist
│   │   │   │   ├── documents/        # Upload, lưu session, quản lý file
│   │   │   │   ├── scoring/          # Gọi Rule Engine, trả score
│   │   │   │   ├── sessions/         # Quản lý phiên kiểm tra hồ sơ
│   │   │   │   ├── smartform/        # Map dữ liệu OCR → form fields
│   │   │   │   ├── recheck/          # Gov Re-Check cho cán bộ
│   │   │   │   ├── priority/         # Priority Ranking
│   │   │   │   └── insights/         # InsightMap — aggregate log ẩn danh
│   │   │   ├── common/
│   │   │   │   ├── guards/           # AuthGuard, RolesGuard
│   │   │   │   ├── interceptors/     # Logging, Transform
│   │   │   │   ├── filters/          # Exception filters
│   │   │   │   └── decorators/       # @Roles, @CurrentUser
│   │   │   ├── config/               # Env validation, app config
│   │   │   ├── queue/                # BullMQ producers
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ai-gateway/                   # FastAPI — AI Gateway
│       ├── app/
│       │   ├── api/
│       │   │   ├── routes/
│       │   │   │   ├── ocr.py        # Endpoint gọi VNPT OCR
│       │   │   │   ├── crosscheck.py # Endpoint đối chiếu chéo
│       │   │   │   ├── lawguard.py   # Endpoint RAG/LawGuard
│       │   │   │   ├── embeddings.py # Tạo embeddings cho legal chunks
│       │   │   │   └── health.py     # Health check
│       │   │   └── deps.py           # Dependencies injection
│       │   ├── services/
│       │   │   ├── vnpt_ocr.py       # Client gọi VNPT SmartReader/eKYC OCR
│       │   │   ├── vnpt_ekyc.py      # Client gọi VNPT eKYC (Liveness, Compare Face)
│       │   │   ├── vnpt_smartbot.py   # Client gọi VNPT SmartBot
│       │   │   ├── vnpt_smartvoice.py # Client gọi VNPT SmartVoice
│       │   │   ├── ocr_normalizer.py # Chuẩn hóa output OCR
│       │   │   ├── crosscheck.py     # Logic đối chiếu chéo
│       │   │   ├── rag_engine.py     # RAG retrieval + generation
│       │   │   └── embeddings.py     # Embedding service
│       │   ├── models/               # Pydantic schemas
│       │   ├── workers/              # Celery/RQ workers cho tác vụ nặng
│       │   ├── config.py             # Settings từ env
│       │   └── main.py
│       ├── tests/
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   └── rule-engine/                  # TypeScript — CrossCheck + Score Engine
│       ├── src/
│       │   ├── rules/
│       │   │   ├── missing-document.rule.ts
│       │   │   ├── expired-document.rule.ts
│       │   │   ├── mismatch-info.rule.ts
│       │   │   ├── image-quality.rule.ts
│       │   │   └── ocr-confidence.rule.ts
│       │   ├── weights/
│       │   │   └── procedure-weights.json  # Trọng số theo từng thủ tục
│       │   ├── validators/
│       │   │   ├── date.validator.ts
│       │   │   ├── name.validator.ts
│       │   │   └── address.validator.ts
│       │   ├── engine.ts             # Core scoring engine
│       │   ├── crosscheck.ts         # CrossCheck logic
│       │   └── index.ts
│       ├── __tests__/
│       │   ├── rules/
│       │   ├── engine.test.ts
│       │   └── crosscheck.test.ts
│       ├── package.json
│       └── tsconfig.json
│
├── data/
│   ├── procedures/                   # Template thủ tục
│   │   ├── ho-tich/
│   │   │   ├── procedure.json        # Metadata thủ tục
│   │   │   ├── checklist.json        # Danh sách giấy tờ cần có
│   │   │   ├── form-fields.json      # Trường form cần điền
│   │   │   └── legal-source-ids.json # Liên kết văn bản luật
│   │   ├── cu-tru/
│   │   ├── chung-thuc/
│   │   ├── cap-doi-giay-to/
│   │   └── ho-kinh-doanh/
│   ├── legal-sources/                # Văn bản pháp luật công khai
│   │   ├── chunks/                   # Đã chunk sẵn
│   │   ├── metadata/                 # Nguồn, ngày truy cập, version
│   │   └── embeddings/               # Pre-computed embeddings
│   └── sample-documents/             # Giấy tờ mẫu cho demo/test
│       ├── cccd-sample.jpg
│       ├── ho-khau-sample.jpg
│       ├── giay-khai-sinh-sample.jpg
│       └── README.md                 # Mô tả từng file mẫu
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/                     # API contract tests
│   ├── rag-evaluation/               # Benchmark RAG: precision, recall, faithfulness
│   └── demo-cases/                   # 20 hồ sơ mẫu (đủ, thiếu, sai, hết hạn, ảnh mờ)
│       ├── case-01-full.json
│       ├── case-02-missing-doc.json
│       ├── case-03-mismatch.json
│       ├── case-04-expired.json
│       ├── case-05-blurry.json
│       └── ...
│
├── infra/
│   ├── docker-compose.yml            # Toàn bộ stack
│   ├── docker-compose.dev.yml        # Dev overrides
│   ├── nginx/
│   │   └── nginx.conf
│   ├── redis/
│   ├── mongo/
│   │   └── init-mongo.js             # Seed data
│   └── .env.example                  # Template biến môi trường
│
├── scripts/
│   ├── setup.sh                      # Script cài đặt 1 lệnh
│   ├── seed-data.sh                  # Import dữ liệu mẫu
│   ├── run-tests.sh                  # Chạy toàn bộ test suite
│   └── demo.sh                       # Script chạy demo ≥ 3 lần
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── .gitignore
├── .env.example
├── README.md                         # Hướng dẫn cài đặt 1 lệnh
├── package.json                      # Root workspace
├── pnpm-workspace.yaml
└── turbo.json                        # Turborepo config
```

### Khởi tạo Monorepo

```bash
# 1. Tạo root project
mkdir govtrust-ai && cd govtrust-ai
pnpm init

# 2. Tạo workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# 3. Khởi tạo Next.js app
cd apps
npx -y create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm

# 4. Khởi tạo NestJS API
npx -y @nestjs/cli new api --package-manager pnpm --skip-git

# 5. Khởi tạo FastAPI (Python)
mkdir -p ai-gateway/app && cd ai-gateway
python -m venv venv
pip install fastapi uvicorn python-dotenv httpx redis celery pymongo qdrant-client fastembed sentence-transformers

# 6. Khởi tạo Rule Engine package
cd ../../packages
mkdir rule-engine && cd rule-engine
pnpm init
pnpm add -D typescript jest @types/jest ts-jest
```

---

## 2. Tech Stack & Dependencies

### Frontend — `apps/web`

| Category | Technology | Version | Lý do chọn |
| --- | --- | --- | --- |
| Framework | Next.js | 14.x+ | App Router, SSR/SSG, API routes |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Rapid UI development |
| State | Zustand / React Context | latest | Lightweight state management |
| HTTP Client | Axios / fetch | latest | API calls |
| Charts | Recharts / Chart.js | latest | InsightMap Dashboard |
| Upload | react-dropzone | latest | Drag & drop upload |
| Form | React Hook Form + Zod | latest | SmartForm validation |
| Icons | Lucide React | latest | Consistent iconography |

### Backend — `apps/api`

| Category | Technology | Version | Lý do chọn |
| --- | --- | --- | --- |
| Framework | NestJS | 10.x | Modular, TypeScript-first, enterprise-grade |
| Database | MongoDB + Mongoose | latest | Flexible schema cho procedures, sessions |
| Queue | BullMQ + Redis | latest | Async job queue cho AI tasks |
| Auth | @nestjs/jwt + @nestjs/passport | latest | JWT + RBAC |
| Validation | class-validator + class-transformer | latest | DTO validation |
| Docs | @nestjs/swagger | latest | OpenAPI auto-gen |
| File Upload | Multer | latest | Handle multipart uploads |
| Testing | Jest | latest | Unit + integration tests |

### AI Gateway — `apps/ai-gateway`

| Category | Technology | Version | Lý do chọn |
| --- | --- | --- | --- |
| Framework | FastAPI | 0.110+ | Async, high performance, auto docs |
| HTTP Client | httpx | latest | Async HTTP cho VNPT APIs |
| Vector DB | Qdrant | latest | Embedding storage cho LawGuard (collection `legal_chunks`, OI-1) |
| Embeddings | sentence-transformers | latest | Vietnamese text embeddings |
| Task Queue | Celery / RQ | latest | Heavy AI tasks |
| Schema | Pydantic v2 | latest | Data validation |
| Testing | pytest + httpx | latest | Async test support |

### Infrastructure

| Category | Technology | Lý do chọn |
| --- | --- | --- |
| Container | Docker + Docker Compose | 1-lệnh deployment |
| Reverse Proxy | Nginx | Route traffic, SSL |
| Cache/Queue | Redis | BullMQ backend + caching |
| Database | MongoDB | Nghiệp vụ data |
| Vector DB | Qdrant | LawGuard embeddings |

---

## 3. Thiết lập môi trường phát triển

### Yêu cầu hệ thống

- Node.js >= 20.x
- pnpm >= 9.x
- Python >= 3.11
- Docker Desktop
- Git

### File `.env.example`

```env
# ============================================
# GovTrust AI — Environment Variables
# ============================================
# Copy file này thành .env và điền giá trị thật

# --- General ---
NODE_ENV=development
APP_PORT=3000
API_PORT=4000
AI_GATEWAY_PORT=8000

# --- MongoDB ---
MONGO_URI=mongodb://localhost:27017/govtrust
MONGO_DB_NAME=govtrust

# --- Redis ---
REDIS_HOST=localhost
REDIS_PORT=6379

# --- JWT Auth ---
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRATION=24h

# --- VNPT API Keys (BẮT BUỘC - do BTC cung cấp) ---
VNPT_EKYC_BASE_URL=https://api.vnpt-ekyc.vn
VNPT_EKYC_TOKEN_ID=your-token-id
VNPT_EKYC_TOKEN_KEY=your-token-key
VNPT_EKYC_ACCESS_TOKEN=your-access-token

VNPT_SMARTREADER_BASE_URL=https://api.smartreader.vnpt.vn
VNPT_SMARTREADER_API_KEY=your-api-key

VNPT_SMARTBOT_BASE_URL=https://api.smartbot.vnpt.vn
VNPT_SMARTBOT_API_KEY=your-api-key

VNPT_SMARTVOICE_BASE_URL=https://api.smartvoice.vnpt.vn
VNPT_SMARTVOICE_API_KEY=your-api-key

# --- Vector DB ---
VECTOR_DB_TYPE=chroma
CHROMA_HOST=localhost
CHROMA_PORT=8100

# --- File Storage ---
UPLOAD_DIR=./uploads
FILE_TTL_MINUTES=30
MAX_FILE_SIZE_MB=10
```

### Chạy toàn bộ stack bằng 1 lệnh

```bash
# Option 1: Docker Compose (khuyến nghị cho demo)
docker compose up --build

# Option 2: Dev mode (cho phát triển)
pnpm install
pnpm dev
```

### Docker Compose

```yaml
# infra/docker-compose.yml
version: '3.9'

services:
  # --- Frontend ---
  web:
    build: ../apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on:
      - api

  # --- Backend API ---
  api:
    build: ../apps/api
    ports:
      - "4000:4000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/govtrust
      - REDIS_HOST=redis
      - AI_GATEWAY_URL=http://ai-gateway:8000
    depends_on:
      - mongo
      - redis
      - ai-gateway

  # --- AI Gateway ---
  ai-gateway:
    build: ../apps/ai-gateway
    ports:
      - "8000:8000"
    environment:
      - CHROMA_HOST=chroma
      - REDIS_HOST=redis
    env_file:
      - ../.env
    depends_on:
      - chroma
      - redis

  # --- Infrastructure ---
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
      - ./mongo/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant:v1.12.4
    ports:
      - "6333:6333"   # REST + dashboard
      - "6334:6334"   # gRPC
    volumes:
      - qdrant-data:/qdrant/storage

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - web
      - api

volumes:
  mongo-data:
  qdrant-data:
```

---

## 4. Kiến trúc hệ thống chi tiết

### Sơ đồ luồng dữ liệu tổng quan

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CITIZEN APP (Next.js)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Chọn thủ │→ │ Upload   │→ │ Kết quả  │→ │SmartForm │→ │Xác nhận │ │
│  │   tục    │  │ giấy tờ  │  │Score+Warn│  │ tự điền  │  │ hồ sơ   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NestJS API ORCHESTRATOR (:4000)                     │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Auth   │  │Procedures│  │Documents │  │ Sessions │              │
│  │   RBAC   │  │ Template │  │  Upload  │  │ Manager  │              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Scoring  │  │SmartForm │  │ ReCheck  │  │ Insights │              │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
│                    │                                                   │
│          ┌────────┼────────┐                                          │
│          ▼ sync   ▼ async  ▼                                          │
│       REST API  BullMQ   MongoDB                                      │
└─────────┬─────────┬────────┬──────────────────────────────────────────┘
          │         │        │
          ▼         ▼        │
┌──────────────────────┐     │
│  FastAPI AI GATEWAY  │     │
│      (:8000)         │     │
│                      │     │
│  ┌────────────────┐  │     │
│  │  VNPT API      │  │     │
│  │  Clients       │  │     │
│  │  ┌──────────┐  │  │     │
│  │  │ eKYC OCR │  │  │     │
│  │  │SmartReader│  │  │     │
│  │  │ SmartBot │  │  │     │
│  │  │SmartVoice│  │  │     │
│  │  └──────────┘  │  │     │
│  ├────────────────┤  │     │
│  │ OCR Normalizer │  │     │
│  │ CrossCheck     │  │     │
│  │ RAG Engine     │  │     │
│  │ LawGuard       │  │     │
│  ├────────────────┤  │     │
│  │  Vector DB     │←─│─────│── Qdrant
│  │  (Embeddings)  │  │     │
│  └────────────────┘  │     │
└──────────────────────┘     │
                             │
┌────────────────────────────┘
│  ┌─────────┐  ┌─────────┐
│  │ MongoDB │  │  Redis  │
│  │(nghiệp  │  │(Queue + │
│  │  vụ)    │  │ Cache)  │
│  └─────────┘  └─────────┘
```

### Giao tiếp giữa các service

| Từ → Đến | Giao thức | Khi nào dùng | Ví dụ |
| --- | --- | --- | --- |
| Web → API | REST (HTTP) | Mọi request từ frontend | Upload file, lấy score |
| API → AI Gateway | REST (HTTP) | Tác vụ nhanh, đồng bộ | Health check, CrossCheck nhẹ |
| API → AI Gateway | BullMQ (Redis) | Tác vụ AI nặng, bất đồng bộ | OCR, RAG/LawGuard, Embeddings |
| AI Gateway → VNPT | REST (HTTPS) | Gọi API thật của VNPT | OCR, eKYC, SmartBot, SmartVoice |
| API → MongoDB | Mongoose driver | Lưu session, metadata, logs | CRUD nghiệp vụ |
| AI Gateway → Vector DB | Qdrant client | Lưu/truy vấn embeddings | LawGuard retrieval |
| API ↔ Redis | BullMQ + ioredis | Queue + cache | Job queue, session cache |

---

## 5. Module Specifications & API Contracts

### Pipeline 11 bước — Input/Output chi tiết

#### Bước 1: Chọn thủ tục (HoSoBot)

```typescript
// POST /api/procedures/identify
// Request
{
  "userQuery": "Tôi muốn đăng ký khai sinh cho con"
}

// Response
{
  "procedureId": "ho-tich-khai-sinh",
  "procedureName": "Đăng ký khai sinh",
  "confidence": 0.95,
  "checklist": [
    { "id": "cccd-cha", "name": "CCCD cha/mẹ", "required": true },
    { "id": "giay-chung-sinh", "name": "Giấy chứng sinh", "required": true },
    { "id": "giay-dang-ky-ket-hon", "name": "Giấy đăng ký kết hôn", "required": false }
  ],
  "formFields": [
    { "field": "hoTenCon", "label": "Họ tên con", "type": "text", "required": true },
    { "field": "ngaySinh", "label": "Ngày sinh", "type": "date", "required": true }
  ]
}
```

#### Bước 2: Upload giấy tờ

```typescript
// POST /api/documents/upload
// Content-Type: multipart/form-data
// Fields: sessionId, procedureId, documentType, file

// Response
{
  "documentId": "doc-uuid-123",
  "sessionId": "session-uuid-456",
  "fileName": "cccd-truoc.jpg",
  "documentType": "cccd",
  "fileSize": 245000,
  "mimeType": "image/jpeg",
  "imageQuality": {
    "isBlurry": false,
    "brightness": 0.72,
    "resolution": "1280x720"
  },
  "status": "uploaded"
}
```

#### Bước 3: OCR (VNPT API)

```typescript
// POST /api/documents/{documentId}/ocr
// Gọi nội bộ → AI Gateway → VNPT SmartReader/eKYC OCR

// Response
{
  "documentId": "doc-uuid-123",
  "ocrProvider": "VNPT_EKYC",
  "extractedFields": {
    "hoTen": { "value": "Nguyễn Văn A", "confidence": 0.98 },
    "soCCCD": { "value": "012345678901", "confidence": 0.99 },
    "ngaySinh": { "value": "1990-05-15", "confidence": 0.97 },
    "noiThuongTru": { "value": "123 Lý Tự Trọng, Q1, TP.HCM", "confidence": 0.92 },
    "ngayHetHan": { "value": "2035-05-15", "confidence": 0.96 }
  },
  "rawResponse": { /* VNPT raw */ },
  "processingTime": 1200
}
```

#### Bước 4: CrossCheck

```typescript
// POST /api/sessions/{sessionId}/crosscheck

// Response
{
  "sessionId": "session-uuid-456",
  "checks": [
    {
      "field": "hoTen",
      "sources": ["cccd", "ho-khau"],
      "values": ["Nguyễn Văn A", "Nguyễn Văn A"],
      "status": "MATCH"
    },
    {
      "field": "ngaySinh",
      "sources": ["cccd", "giay-khai-sinh"],
      "values": ["1990-05-15", "1990-05-16"],
      "status": "MISMATCH",
      "severity": "HIGH"
    }
  ],
  "missingDocuments": ["giay-dang-ky-ket-hon"],
  "expiredDocuments": [],
  "summary": {
    "totalChecks": 8,
    "matches": 6,
    "mismatches": 1,
    "missing": 1
  }
}
```

#### Bước 5: Score

```typescript
// POST /api/sessions/{sessionId}/score

// Response
{
  "sessionId": "session-uuid-456",
  "score": 72,
  "grade": "C",
  "breakdown": [
    { "rule": "missing-document", "impact": -15, "detail": "Thiếu Giấy ĐKKH", "severity": "MEDIUM" },
    { "rule": "mismatch-info", "impact": -10, "detail": "Ngày sinh không khớp giữa CCCD và Giấy khai sinh", "severity": "HIGH" },
    { "rule": "image-quality", "impact": -3, "detail": "Ảnh CCCD hơi mờ ở góc phải", "severity": "LOW" }
  ],
  "recommendation": "Cần bổ sung Giấy ĐKKH và kiểm tra lại ngày sinh",
  "canSubmit": false
}
```

#### Bước 6: LawGuard

```typescript
// POST /api/sessions/{sessionId}/lawguard

// Response
{
  "sessionId": "session-uuid-456",
  "alerts": [
    {
      "type": "REFERENCE",
      "message": "Theo Điều 16 Luật Hộ tịch 2014, người đi đăng ký khai sinh cần xuất trình CCCD",
      "legalSource": {
        "title": "Luật Hộ tịch 2014",
        "article": "Điều 16",
        "url": "https://thuvienphapluat.vn/...",
        "accessDate": "2026-06-20"
      },
      "confidence": 0.89,
      "needsVerification": false
    },
    {
      "type": "WARNING",
      "message": "Yêu cầu Giấy ĐKKH trong checklist có thể không bắt buộc nếu cha/mẹ chưa đăng ký kết hôn",
      "legalSource": {
        "title": "Nghị định 123/2015/NĐ-CP",
        "article": "Điều 15",
        "url": "https://thuvienphapluat.vn/...",
        "accessDate": "2026-06-20"
      },
      "confidence": 0.72,
      "needsVerification": true
    }
  ],
  "disclaimer": "Thông tin trên chỉ mang tính tham khảo. Quyết định cuối cùng thuộc cơ quan có thẩm quyền."
}
```

#### Bước 7: SmartForm

```typescript
// POST /api/sessions/{sessionId}/smartform

// Response
{
  "sessionId": "session-uuid-456",
  "formData": {
    "hoTenCon": { "value": "", "source": null, "editable": true },
    "ngaySinh": { "value": "", "source": null, "editable": true },
    "hoTenCha": { "value": "Nguyễn Văn A", "source": "cccd-cha", "editable": true },
    "soCCCDCha": { "value": "012345678901", "source": "cccd-cha", "editable": true }
  },
  "filledCount": 2,
  "totalCount": 10,
  "missingFields": ["hoTenCon", "ngaySinh", "hoTenMe", "..."]
}
```

#### Bước 8–11: Xác nhận, Re-Check, Priority, InsightMap

```typescript
// Bước 8: POST /api/sessions/{sessionId}/confirm
// Bước 9: POST /api/sessions/{sessionId}/recheck (cán bộ)
// Bước 10: GET /api/priority?status=pending (cán bộ)
// Bước 11: GET /api/insights/dashboard (admin/cán bộ)

// Bước 9 — Gov Re-Check Response
{
  "sessionId": "session-uuid-456",
  "recheckResult": "NEEDS_SUPPLEMENT",
  "issues": [
    { "type": "MISMATCH", "field": "ngaySinh", "action": "Yêu cầu công dân xác nhận lại" }
  ],
  "officerNote": ""
}

// Bước 10 — Priority Ranking Response
{
  "rankings": [
    {
      "sessionId": "session-uuid-456",
      "priority": "A",
      "reason": "Hồ sơ khai sinh - hạn xử lý còn 2 ngày",
      "score": 72,
      "submittedAt": "2026-06-28T10:00:00Z"
    }
  ]
}

// Bước 11 — InsightMap Response
{
  "period": "2026-06-01 to 2026-06-28",
  "topErrors": [
    { "type": "missing-document", "count": 45, "percentage": 32 },
    { "type": "mismatch-info", "count": 28, "percentage": 20 }
  ],
  "procedureStats": [
    { "procedure": "Khai sinh", "avgScore": 68, "totalSessions": 30 }
  ],
  "trendByWeek": [ /* chart data */ ],
  "heatmapData": [ /* lỗi theo thủ tục x loại lỗi */ ]
}
```

---

## 6. Tích hợp API VNPT (BẮT BUỘC)

> ⚠️ **QUAN TRỌNG:** Phải sử dụng API VNPT thật do BTC cung cấp. Không dùng mock/giả lập.

### Danh sách API VNPT cần tích hợp

| STT | API | Module sử dụng | Mức ưu tiên | Người phụ trách |
| --- | --- | --- | --- | --- |
| 1 | **VNPT eKYC — OCR** | Document AI | ⭐ BẮT BUỘC | AI Lead |
| 2 | **VNPT eKYC — Liveness card** | Document AI | ⭐ BẮT BUỘC | AI Lead |
| 3 | **VNPT eKYC — Compare face** | CrossCheck | NÊN CÓ | AI Lead |
| 4 | **VNPT SmartReader — OCR** | Document AI | ⭐ BẮT BUỘC | AI Lead |
| 5 | **VNPT SmartReader — Bóc tách** | Document AI | NÊN CÓ | AI Lead |
| 6 | **VNPT SmartBot — Chatbot** | HoSoBot | NÊN CÓ | Frontend/UX |
| 7 | **VNPT SmartBot nâng cao — LLM** | LawGuard | NÊN CÓ | AI Lead |
| 8 | **VNPT SmartVoice — TTS/STT** | Accessibility | TÙY CHỌN | Frontend/UX |
| 9 | **VNPT SmartUX** | UX Metrics | NÊN CÓ | Frontend/UX |

### Mẫu VNPT API Client (Python — AI Gateway)

```python
# apps/ai-gateway/app/services/vnpt_ocr.py

import httpx
from app.config import settings

class VNPTOCRClient:
    """Client gọi VNPT eKYC OCR API thật."""

    def __init__(self):
        self.base_url = settings.VNPT_EKYC_BASE_URL
        self.headers = {
            "Token-id": settings.VNPT_EKYC_TOKEN_ID,
            "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
            "Authorization": f"Bearer {settings.VNPT_EKYC_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }

    async def ocr_id_card(self, image_base64: str, doc_type: str = "CCCD") -> dict:
        """
        Gọi VNPT eKYC OCR để bóc tách thông tin CCCD/CMND.

        Args:
            image_base64: Ảnh CCCD đã encode base64
            doc_type: Loại giấy tờ (CCCD, CMND, PASSPORT)

        Returns:
            dict chứa extracted fields + confidence scores
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/ekyc/v1/ocr",
                headers=self.headers,
                json={
                    "image": image_base64,
                    "type": doc_type
                }
            )
            response.raise_for_status()
            return response.json()

    async def liveness_check(self, image_base64: str) -> dict:
        """Kiểm tra giấy tờ thật/giả."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/ekyc/v1/liveness-card",
                headers=self.headers,
                json={"image": image_base64}
            )
            response.raise_for_status()
            return response.json()

    async def compare_faces(self, face1_base64: str, face2_base64: str) -> dict:
        """So sánh 2 khuôn mặt."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/ekyc/v1/compare-face",
                headers=self.headers,
                json={
                    "image1": face1_base64,
                    "image2": face2_base64
                }
            )
            response.raise_for_status()
            return response.json()


# Sử dụng trong route:
# apps/ai-gateway/app/api/routes/ocr.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.vnpt_ocr import VNPTOCRClient
from app.services.ocr_normalizer import normalize_ocr_result
import base64

router = APIRouter(prefix="/ocr", tags=["OCR"])
vnpt_client = VNPTOCRClient()

@router.post("/extract")
async def extract_document(file: UploadFile = File(...), doc_type: str = "CCCD"):
    """Bóc tách thông tin từ giấy tờ qua VNPT eKYC OCR."""
    try:
        contents = await file.read()
        image_b64 = base64.b64encode(contents).decode("utf-8")

        # Gọi VNPT API thật
        raw_result = await vnpt_client.ocr_id_card(image_b64, doc_type)

        # Chuẩn hóa output
        normalized = normalize_ocr_result(raw_result, doc_type)

        return {
            "provider": "VNPT_EKYC",
            "extractedFields": normalized["fields"],
            "confidence": normalized["avg_confidence"],
            "rawResponse": raw_result,
            "processingTimeMs": normalized["processing_time"]
        }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"VNPT API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Mẫu VNPT SmartBot Client

```python
# apps/ai-gateway/app/services/vnpt_smartbot.py

import httpx
from app.config import settings

class VNPTSmartBotClient:
    """Client gọi VNPT SmartBot API cho HoSoBot."""

    def __init__(self):
        self.base_url = settings.VNPT_SMARTBOT_BASE_URL
        self.api_key = settings.VNPT_SMARTBOT_API_KEY

    async def chat(self, message: str, session_id: str = None) -> dict:
        """
        Gửi tin nhắn tới SmartBot để nhận diện thủ tục.

        Args:
            message: Câu hỏi/yêu cầu của người dân
            session_id: ID phiên hội thoại

        Returns:
            dict chứa intent, response, suggestions
        """
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/chat",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "message": message,
                    "session_id": session_id
                }
            )
            response.raise_for_status()
            return response.json()

    async def chat_advanced_llm(self, message: str, context: str = "") -> dict:
        """SmartBot nâng cao — Hỏi đáp dùng LLM cho LawGuard."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/chat-advanced",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "message": message,
                    "context": context,
                    "mode": "llm"
                }
            )
            response.raise_for_status()
            return response.json()
```

---

## 7. Data Models & Database Schema

### MongoDB Collections (NestJS sở hữu)

> Đồng bộ với `DATABASE_DESIGN.md` v2.1 — **6 collections**: `users`, `document_types`, `procedures`, `sessions`, `jobs`, `insight_logs`.

```typescript
// === Document Type (catalog dùng chung — định nghĩa mỗi giấy tờ ĐÚNG 1 LẦN) ===
interface DocumentType {
  _id: ObjectId;
  code: string;                   // "GIAY_KHAI_SINH" — unique, viết hoa không dấu
  name: string;                   // "Giấy khai sinh"
  category: 'NHAN_THAN' | 'HO_TICH' | 'DAT_DAI' | 'DOANH_NGHIEP';
  issuingAuthority: string;       // "UBND cấp xã"
  hasPortrait: boolean;           // có ảnh chân dung → liveness/eKYC
  pagesRequired: number;          // số mặt cần chụp (CCCD=2)
  fields: DocumentField[];        // bộ trường — OCR lưu theo key ở đây (hết hardcode)
  validity: ValidityRule;
  aliasCodes: string[];           // giấy thay thế, vd CCCD ⟷ ["CMND"]
  isActive: boolean;
}

interface DocumentField {
  key: string;                    // "hoTenMe" — dùng để CrossCheck ghép field giữa các giấy
  label: string;                  // "Họ tên mẹ"
  dataType: 'string' | 'date' | 'enum' | 'number' | 'id_number';
  format?: string;                // "dd/mm/yyyy"
  regex?: string;                 // "^\\d{12}$" (số CCCD)
  required: boolean;              // OCR bắt buộc đọc được
  isIdentity: boolean;            // trường định danh (PII) → cross-check & ẩn danh hoá
  enumValues?: string[];          // ["Nam","Nữ"] nếu enum
}

interface ValidityRule {
  hasExpiry: boolean;             // giấy khai sinh = false (không hết hạn)
  expiryField?: string;           // CCCD = "coGiaTriDen"
  validityRule?: string;          // "AGE_MILESTONE_25_40_60" nếu hạn không in sẵn
  gracePeriodDays?: number;
}

// === Procedure Template ===
interface Procedure {
  _id: ObjectId;
  code: string;                   // "DK_KHAI_SINH"
  name: string;                   // "Đăng ký khai sinh"
  category: string;               // "HO_TICH"
  description: string;
  checklist: ChecklistItem[];     // CHỈ trỏ document_types, không định nghĩa lại giấy
  crossCheckRules: CrossCheckRule[]; // đối chiếu chéo đa giấy tờ (cốt lõi khai sinh)
  formFields: FormField[];        // SmartForm map vào
  legalSourceIds: string[];       // liên kết văn bản luật (Qdrant)
  scoreWeights: ScoreWeight[];    // trọng số chấm điểm
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ChecklistItem {
  id: string;                     // "cccd_cha_me" — khoá nội bộ (gắn ảnh upload)
  documentTypeCode: string;       // "CCCD" → trỏ document_types.code
  acceptedCodes?: string[];       // mã thay thế chấp nhận: ["CCCD","CMND","PASSPORT"]
  roleInProcedure?: string;       // "CCCD của cha hoặc mẹ"
  quantity?: number;              // số bản (2 = cha + mẹ)
  required: boolean;
  conditionalOn?: string;         // chỉ cần khi điều kiện nào đó
  points?: number;
}

interface CrossCheckRule {
  name: string;                   // "Tên mẹ khớp giữa tờ khai và giấy chứng sinh"
  left: string;                   // "to_khai.hoTenMe"  (checklistId.fieldKey)
  right: string;                  // "chung_sinh.hoTenMe"
  matchType: 'exact' | 'normalized' | 'fuzzy';  // normalized = bỏ dấu/hoa-thường
  tolerance?: number;             // ngưỡng cho fuzzy
  severityIfMismatch: 'HIGH' | 'MEDIUM' | 'LOW';
  skipIfMissing?: string;         // bỏ qua nếu giấy này thiếu (vd "dkkh" optional)
}

// === Session (phiên kiểm tra hồ sơ) ===
interface Session {
  _id: ObjectId;
  sessionId: string;
  procedureId: string;
  userId?: string;                // null nếu anonymous
  status: 'CREATED' | 'UPLOADING' | 'PROCESSING' | 'SCORED' | 'CONFIRMED' | 'RECHECKED' | 'REJECTED';
  documents: DocumentRef[];       // con trỏ fileUrl — KHÔNG lưu ảnh trong DB
  crosscheckResult?: CrossCheckResult;
  score?: ScoreResult;
  lawguardAlerts?: LawGuardAlert[];
  smartformData?: Record<string, FormFieldValue>;
  govReCheck?: GovReCheckResult;  // BƯỚC 9 — góc nhìn cơ quan (riskFlags), ẩn với dân
  priority?: PriorityResult;      // BƯỚC 10 — xếp hồ sơ nào xử trước theo SLA
  officerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;                // TTL — tự xóa sau SESSION_TTL_HOURS (mặc định 24h)
}

// BƯỚC 9 ≠ Score(b5): b5 cho DÂN biết "đủ chưa"; b9 cho CÁN BỘ biết "có RỦI RO gì"
interface GovReCheckResult {
  completenessLevel: 'DAY_DU' | 'CAN_BO_SUNG' | 'CAN_KIEM_TRA_KY';  // xác nhận lại (phụ)
  riskFlags: RiskFlag[];          // GIÁ TRỊ CHÍNH — ẩn với dân
  reviewedBy?: string;            // userId officer
  reviewedAt?: Date;
}

interface RiskFlag {
  type: 'SUSPECTED_EDIT' | 'NAME_MISMATCH_MULTI' | 'FRAUD_SUSPECTED' | 'MANUAL_REVIEW';
  message: string;                // "Tên mẹ lệch trên 3 giấy — cần kiểm tra kỹ"
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

// BƯỚC 10 ≠ Score: Score="hồ sơ TỐT không" (không thời gian); Priority="xử cái nào TRƯỚC" (có SLA)
interface PriorityResult {
  level: 'A' | 'B' | 'C' | 'D';   // A=xử ngay … D=để sau → SORT hàng đợi cán bộ
  reason: string;                 // "Khai sinh - hạn còn 2 ngày, hồ sơ đầy đủ"
  slaDeadline: Date;              // = tiếp nhận + procedures.priorityConfig.slaDays
  finalDecisionByOfficer?: string;
}

// === Insight Log (ẩn danh — sống vĩnh viễn) ===
interface InsightLog {
  _id: ObjectId;
  procedureId: string;            // Chỉ lưu ID thủ tục
  errorType: 'MISSING_DOC' | 'INFO_MISMATCH' | 'EXPIRED_DOC' | 'LOW_QUALITY_IMG' | 'LIVENESS_FAIL';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  specificDocType?: string;       // "chung_sinh" — giấy nào lỗi
  finalScore: number;
  droppedAtStep?: string;         // "Upload" | "Score" | "Form" — đo funnel
  deviceType?: 'MOBILE' | 'DESKTOP';
  processingTimeMs?: number;
  timestamp: Date;
  // KHÔNG lưu: tên, CCCD, địa chỉ, ảnh giấy tờ
}

// === Job (outbox — backstop hàng đợi AI, để Redis chết không mất job) ===
interface Job {
  _id: ObjectId;
  sessionId: string;
  type: 'OCR' | 'CROSSCHECK' | 'LAWGUARD' | 'SCORE' | 'SMARTFORM';
  state: 'PENDING' | 'ENQUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
  attempts: number;
  lastError?: string;
  createdAt: Date;
  expiresAt: Date;                // TTL nhẹ dọn job DONE
}

// === User (RBAC) ===
interface User {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  fullName: string;
  organization?: string;          // Cho OFFICER, vd "UBND Phường X"
  createdAt: Date;
}
```

### Vector DB Collections (FastAPI sở hữu)

> Đồng bộ OI-1: dùng **Qdrant** (không phải ChromaDB), collection **`legal_chunks`**, vector **768**, distance **Cosine**.

```python
# Qdrant collection cho LawGuard
# Collection: "legal_chunks"  (vector size 768, distance Cosine)
{
    "id": "luat-ho-tich-2014-dieu16-chunk1",
    "vector": [0.123, -0.456, ...],   # 768 floats — sentence-transformers
    "payload": {
        "chunkId": "luat-ho-tich-2014-dieu16-chunk1",
        "category": "HO_TICH",         # payload index để filter nhanh
        "title": "Luật Hộ tịch 2014",
        "article": "Điều 16",
        "url": "https://thuvienphapluat.vn/...",
        "sourceVersion": "2014",
        "text": "Điều 16. Thủ tục đăng ký khai sinh..."  # chunk 300-500 từ
    }
}
```

---

## 8. Frontend — Citizen App & Dashboard

### Cấu trúc Routes

| Route | Vai trò | Quyền truy cập | Mô tả |
| --- | --- | --- | --- |
| `/` | Trang chủ | Public | Giới thiệu + nút "Kiểm tra hồ sơ" |
| `/procedures` | Chọn thủ tục | Public | HoSoBot chat + danh sách thủ tục |
| `/upload/:procedureId` | Upload giấy tờ | Public | Drag & drop, kiểm tra chất lượng ảnh |
| `/result/:sessionId` | Kết quả kiểm tra | Public | Score, CrossCheck, LawGuard, cảnh báo |
| `/smartform/:sessionId` | Form tự điền | Public | Preview form, sửa trường, missing alert |
| `/confirm/:sessionId` | Xác nhận hồ sơ | Public | Tổng hợp + nút xác nhận |
| `/login` | Đăng nhập | Public | Login cho cán bộ/admin |
| `/officer/recheck` | Tái kiểm hồ sơ | Officer | Danh sách hồ sơ đã xác nhận |
| `/officer/priority` | Phân loại ưu tiên | Officer | Ranking A/B/C/D |
| `/officer/dashboard` | InsightMap | Officer/Admin | Charts, heatmap, top lỗi, trend |

### Yêu cầu UI/UX bắt buộc

1. **Progress bar toàn luồng** — Người dân thấy mình đang ở bước nào trong 8 bước
2. **Loading state rõ ràng** — Spinner + thông báo "Đang gọi VNPT OCR..." khi chờ API
3. **Giải thích kết quả bằng ngôn ngữ dễ hiểu** — Không dùng thuật ngữ kỹ thuật
4. **Responsive** — Ưu tiên mobile-first (người dân dùng điện thoại)
5. **Accessibility** — Font lớn, contrast cao, label rõ ràng (cho người dân ít rành công nghệ)
6. **Disclaimer** — Mọi trang kết quả phải có dòng "Thông tin chỉ mang tính tham khảo"
7. **Tích hợp VNPT SmartUX** — Thu thập tương tác người dùng để đo UX Metrics

### Component chính cần phát triển

```
components/
├── ui/                    # Atomic components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx          # Score badge (A/B/C/D), severity badge
│   ├── Progress.tsx       # Multi-step progress bar
│   ├── Modal.tsx
│   ├── Skeleton.tsx       # Loading skeleton
│   └── Disclaimer.tsx     # Disclaimer banner cố định
│
├── upload/
│   ├── UploadZone.tsx     # Drag & drop + camera capture
│   ├── FilePreview.tsx    # Preview ảnh uploaded
│   └── QualityCheck.tsx   # Hiển thị blur/brightness check
│
├── score/
│   ├── ScoreCard.tsx      # Vòng tròn Score 0-100 + Grade
│   ├── ScoreBreakdown.tsx # Bảng chi tiết từng rule và impact
│   ├── WarningList.tsx    # Danh sách cảnh báo + severity
│   └── Recommendation.tsx # Gợi ý sửa lỗi
│
├── lawguard/
│   ├── AlertCard.tsx      # 1 cảnh báo pháp lý + citation
│   ├── SourceLink.tsx     # Link tới văn bản gốc
│   ├── ConfidenceBar.tsx  # Thanh confidence 0-100%
│   └── DisclaimerBox.tsx  # Box disclaimer nổi bật
│
├── dashboard/             # InsightMap
│   ├── TopErrorsChart.tsx # Bar chart top lỗi
│   ├── ScoreDistribution.tsx # Histogram phân bố score
│   ├── HeatMap.tsx        # Thủ tục x Loại lỗi
│   ├── TrendLine.tsx      # Xu hướng theo tuần
│   └── FilterBar.tsx      # Lọc theo thủ tục, thời gian
│
└── chatbot/
    └── HoSoBot.tsx        # Widget chat (tích hợp VNPT SmartBot)
```

---

## 9. Backend — NestJS API Orchestrator

### Module Structure

```typescript
// src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({ /* ... */ }),
    BullModule.forRootAsync({ /* Redis config */ }),
    AuthModule,
    ProceduresModule,
    DocumentsModule,
    ScoringModule,
    SessionsModule,
    SmartFormModule,
    RecheckModule,
    PriorityModule,
    InsightsModule,
  ],
})
export class AppModule {}
```

### API Endpoints tổng quan

| Method | Endpoint | Module | Mô tả |
| --- | --- | --- | --- |
| POST | `/auth/login` | Auth | Đăng nhập |
| POST | `/auth/register` | Auth | Tạo tài khoản demo |
| GET | `/procedures` | Procedures | Danh sách thủ tục |
| GET | `/procedures/:id` | Procedures | Chi tiết thủ tục + checklist |
| POST | `/procedures/identify` | Procedures | HoSoBot nhận diện thủ tục |
| POST | `/sessions` | Sessions | Tạo phiên kiểm tra mới |
| GET | `/sessions/:id` | Sessions | Lấy trạng thái phiên |
| POST | `/documents/upload` | Documents | Upload giấy tờ |
| POST | `/documents/:id/ocr` | Documents | Trigger OCR (→ AI Gateway) |
| POST | `/sessions/:id/crosscheck` | Scoring | Trigger CrossCheck |
| POST | `/sessions/:id/score` | Scoring | Trigger Score Engine |
| POST | `/sessions/:id/lawguard` | Scoring | Trigger LawGuard |
| POST | `/sessions/:id/smartform` | SmartForm | Tạo form tự điền |
| POST | `/sessions/:id/confirm` | Sessions | Xác nhận hồ sơ |
| POST | `/sessions/:id/recheck` | Recheck | Cán bộ tái kiểm |
| GET | `/priority` | Priority | Danh sách hồ sơ theo ưu tiên |
| GET | `/insights/dashboard` | Insights | InsightMap data |
| GET | `/insights/top-errors` | Insights | Top lỗi aggregate |
| GET | `/insights/trend` | Insights | Xu hướng theo thời gian |

### Ví dụ module NestJS

```typescript
// src/modules/documents/documents.service.ts
@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name) private docModel: Model<Document>,
    @InjectQueue('ai-tasks') private aiQueue: Queue,
    private readonly sessionsService: SessionsService,
  ) {}

  async uploadDocument(dto: UploadDocumentDto, file: Express.Multer.File) {
    // 1. Lưu metadata vào MongoDB
    const doc = await this.docModel.create({
      sessionId: dto.sessionId,
      documentType: dto.documentType,
      fileName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: 'UPLOADED',
    });

    // 2. Check chất lượng ảnh cơ bản
    const quality = await this.checkImageQuality(file.path);

    return { documentId: doc._id, imageQuality: quality, status: 'uploaded' };
  }

  async triggerOCR(documentId: string) {
    const doc = await this.docModel.findById(documentId);
    if (!doc) throw new NotFoundException('Document not found');

    // Đẩy job vào BullMQ → AI Gateway xử lý
    const job = await this.aiQueue.add('ocr-extract', {
      documentId: doc._id,
      filePath: doc.filePath,
      documentType: doc.documentType,
    });

    doc.status = 'PROCESSING';
    await doc.save();

    return { jobId: job.id, status: 'processing' };
  }
}
```

---

## 10. AI Gateway — FastAPI

### Cấu trúc FastAPI

```python
# apps/ai-gateway/app/main.py
from fastapi import FastAPI
from app.api.routes import ocr, crosscheck, lawguard, embeddings, health

app = FastAPI(
    title="GovTrust AI Gateway",
    description="AI Gateway xử lý OCR, CrossCheck, LawGuard",
    version="1.0.0"
)

app.include_router(health.router)
app.include_router(ocr.router, prefix="/api/v1")
app.include_router(crosscheck.router, prefix="/api/v1")
app.include_router(lawguard.router, prefix="/api/v1")
app.include_router(embeddings.router, prefix="/api/v1")
```

### OCR Normalizer

```python
# apps/ai-gateway/app/services/ocr_normalizer.py

def normalize_ocr_result(raw_result: dict, doc_type: str) -> dict:
    """
    Chuẩn hóa output từ VNPT OCR API thành format thống nhất.
    Vì VNPT trả field name khác nhau cho CCCD vs Hộ chiếu vs Giấy khai sinh,
    module này map tất cả về cùng schema.
    """
    field_mapping = {
        "CCCD": {
            "id_number": "soCCCD",
            "full_name": "hoTen",
            "date_of_birth": "ngaySinh",
            "gender": "gioiTinh",
            "nationality": "quocTich",
            "place_of_origin": "queQuan",
            "place_of_residence": "noiThuongTru",
            "expiry_date": "ngayHetHan",
        },
        # Thêm mapping cho các loại giấy tờ khác
    }

    mapping = field_mapping.get(doc_type, {})
    normalized_fields = {}

    for vnpt_key, our_key in mapping.items():
        if vnpt_key in raw_result.get("data", {}):
            value = raw_result["data"][vnpt_key]
            confidence = raw_result.get("confidence", {}).get(vnpt_key, 0.0)
            normalized_fields[our_key] = {
                "value": value,
                "confidence": confidence
            }

    avg_confidence = sum(
        f["confidence"] for f in normalized_fields.values()
    ) / max(len(normalized_fields), 1)

    return {
        "fields": normalized_fields,
        "avg_confidence": round(avg_confidence, 2),
        "processing_time": raw_result.get("processing_time", 0)
    }
```

### LawGuard RAG Engine

> Đồng bộ OI-1 + code thật: dùng **Qdrant** collection `legal_chunks`, qua `LegalSearchService`
> (`app/vector_db/search.py`) — hỗ trợ hybrid (dense + sparse BM25) + rerank, filter theo `category`/`status`.

```python
# apps/ai-gateway/app/services/rag_engine.py

from app.vector_db.search import LegalSearchService

class RAGEngine:
    """
    Retrieval-Augmented Generation cho LawGuard.
    Truy xuất văn bản pháp luật liên quan và tạo cảnh báo tham khảo.
    """

    def __init__(self):
        # LegalSearchService tự khởi tạo Qdrant client + embedder + reranker theo config
        self.search_service = LegalSearchService()

    async def retrieve(self, query: str, category: str | None = None, top_k: int = 5) -> list[dict]:
        """Truy xuất top-k chunk luật liên quan (đã rerank nếu bật)."""
        results = self.search_service.search(query, category=category, top_k=top_k)
        return [
            {
                "content": r.text,
                "relevance_score": r.score,    # rerank [0,1] nếu bật, không thì cosine/fusion
                "source": {
                    "title": r.title,
                    "article": r.article,
                    "sourceVersion": r.sourceVersion,
                },
            }
            for r in results
        ]

    async def generate_alerts(self, checklist: list, procedure_id: str) -> list[dict]:
        """Tạo cảnh báo pháp lý cho từng mục trong checklist."""
        alerts = []
        for item in checklist:
            query = f"Yêu cầu giấy tờ {item['name']} cho thủ tục {procedure_id}"
            sources = await self.retrieve(query, top_k=3)

            if sources:
                best = sources[0]
                alert = {
                    "type": "REFERENCE" if best["relevance_score"] > 0.7 else "WARNING",
                    "checklistItem": item["id"],
                    "message": f"Căn cứ: {best['metadata']['source_title']}, "
                               f"{best['metadata']['article']}",
                    "legalSource": best["metadata"],
                    "confidence": round(best["relevance_score"], 2),
                    "needsVerification": best["relevance_score"] < 0.7
                }
                alerts.append(alert)

        return alerts
```

---

## 11. Rule Engine & Score Engine

### Cấu trúc Rule

```typescript
// packages/rule-engine/src/rules/missing-document.rule.ts

export interface Rule {
  id: string;
  name: string;
  description: string;
  evaluate(context: ScoringContext): RuleResult;
}

export interface ScoringContext {
  procedure: ProcedureTemplate;
  documents: ExtractedDocument[];
  crosscheckResult: CrossCheckResult;
}

export interface RuleResult {
  ruleId: string;
  passed: boolean;
  impact: number;          // Điểm trừ (negative)
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detail: string;          // Giải thích bằng tiếng Việt
}

// Ví dụ: Rule kiểm tra thiếu giấy tờ
export class MissingDocumentRule implements Rule {
  id = 'missing-document';
  name = 'Kiểm tra giấy tờ thiếu';
  description = 'Trừ điểm nếu thiếu giấy tờ bắt buộc trong checklist';

  evaluate(ctx: ScoringContext): RuleResult {
    const required = ctx.procedure.checklist.filter(c => c.required);
    const uploaded = ctx.documents.map(d => d.documentType);
    const missing = required.filter(r => !uploaded.includes(r.documentType));

    if (missing.length === 0) {
      return { ruleId: this.id, passed: true, impact: 0, severity: 'LOW', detail: 'Đủ giấy tờ' };
    }

    const names = missing.map(m => m.name).join(', ');
    const impactPerDoc = -15;  // Mỗi giấy tờ thiếu trừ 15 điểm

    return {
      ruleId: this.id,
      passed: false,
      impact: impactPerDoc * missing.length,
      severity: missing.length >= 2 ? 'CRITICAL' : 'HIGH',
      detail: `Thiếu giấy tờ bắt buộc: ${names}`,
    };
  }
}
```

### Score Engine

```typescript
// packages/rule-engine/src/engine.ts

import { MissingDocumentRule } from './rules/missing-document.rule';
import { ExpiredDocumentRule } from './rules/expired-document.rule';
import { MismatchInfoRule } from './rules/mismatch-info.rule';
import { ImageQualityRule } from './rules/image-quality.rule';
import { OCRConfidenceRule } from './rules/ocr-confidence.rule';

export class ScoreEngine {
  private rules: Rule[] = [
    new MissingDocumentRule(),
    new ExpiredDocumentRule(),
    new MismatchInfoRule(),
    new ImageQualityRule(),
    new OCRConfidenceRule(),
  ];

  evaluate(context: ScoringContext): ScoreResult {
    const baseScore = 100;
    const results = this.rules.map(rule => rule.evaluate(context));
    const totalImpact = results.reduce((sum, r) => sum + r.impact, 0);
    const finalScore = Math.max(0, Math.min(100, baseScore + totalImpact));

    return {
      score: finalScore,
      grade: this.toGrade(finalScore),
      breakdown: results.filter(r => !r.passed),
      canSubmit: finalScore >= 60 && !results.some(r => r.severity === 'CRITICAL'),
      recommendation: this.generateRecommendation(results),
    };
  }

  private toGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  private generateRecommendation(results: RuleResult[]): string {
    const failed = results.filter(r => !r.passed);
    if (failed.length === 0) return 'Hồ sơ đạt yêu cầu, có thể nộp.';
    return 'Cần khắc phục: ' + failed.map(r => r.detail).join('; ');
  }
}
```

---

## 12. LawGuard — RAG Pipeline

### Pipeline xử lý

```
1. Chuẩn bị nguồn luật
   ├── Thu thập văn bản từ thuvienphapluat.vn (công khai)
   ├── Chunk theo điều/khoản (500-1000 tokens)
   ├── Gắn metadata: tên luật, điều, URL, ngày truy cập
   └── Tạo embeddings → lưu Qdrant

2. Truy xuất (Retrieval)
   ├── Nhận checklist từ procedure template
   ├── Tạo query cho từng mục checklist
   ├── Encode query → tìm top-5 chunks gần nhất
   └── Lọc theo relevance threshold (> 0.5)

3. Tạo cảnh báo (Generation)
   ├── Nếu confidence > 0.7 → type: REFERENCE (tham khảo rõ)
   ├── Nếu 0.5 < confidence ≤ 0.7 → type: WARNING (cần kiểm tra thêm)
   ├── Kèm nguồn: tên luật, điều/khoản, URL
   └── Luôn có disclaimer: "Thông tin chỉ mang tính tham khảo"

4. TUYỆT ĐỐI KHÔNG:
   ├── ❌ Kết luận hồ sơ hợp pháp/không hợp pháp
   ├── ❌ Phán quyết thay cán bộ/cơ quan
   ├── ❌ Dùng LLM để ra quyết định scoring
   └── ❌ Cho người dùng ghi vào legal knowledge base
```

### Benchmark RAG cần đo

| Metric | Mô tả | Target |
| --- | --- | --- |
| Context Precision | % chunks truy xuất đúng liên quan | > 80% |
| Context Recall | % thông tin cần thiết được truy xuất | > 75% |
| Faithfulness | Cảnh báo có bám sát nội dung nguồn không | > 85% |
| Citation Accuracy | Link nguồn có đúng điều/khoản không | > 90% |
| Latency | Thời gian truy xuất + tạo cảnh báo | < 3s |

---

## 13. Bảo mật & Xử lý dữ liệu

### Nguyên tắc bất di bất dịch

| # | Nguyên tắc | Cách triển khai trong code |
| --- | --- | --- |
| 1 | **Không lưu giấy tờ gốc dài hạn** | File upload có TTL 30 phút, cronjob xóa file hết hạn |
| 2 | **Xử lý theo phiên** | Session có `expiresAt`, MongoDB TTL index tự xóa |
| 3 | **InsightMap chỉ dùng metadata ẩn danh** | Log chỉ lưu: procedureId, errorType, score, timestamp |
| 4 | **API key không commit vào repo** | `.env.example` + `.gitignore` + secret scan |
| 5 | **RBAC cho dashboard** | JWT + role guard: citizen / officer / admin |
| 6 | **Legal KB không bị ghi đè** | Chỉ admin seed data, user không có quyền write |
| 7 | **Sanitize input** | Validate DTO, escape HTML, limit file size/type |

### Triển khai cụ thể

```typescript
// MongoDB TTL Index — tự xóa session sau 30 phút
// src/modules/sessions/session.schema.ts
@Schema()
export class Session {
  @Prop({ type: Date, expires: 1800 })  // 30 phút = 1800 giây
  expiresAt: Date;
}

// File cleanup cronjob
// src/modules/documents/documents.service.ts
@Cron(CronExpression.EVERY_5_MINUTES)
async cleanupExpiredFiles() {
  const expired = await this.docModel.find({
    createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }
  });
  for (const doc of expired) {
    await fs.unlink(doc.filePath).catch(() => {});
    await doc.deleteOne();
  }
  this.logger.log(`Cleaned up ${expired.length} expired files`);
}
```

---

## 14. Testing Strategy

### Cấu trúc test

| Loại test | Thư mục | Công cụ | Mục tiêu |
| --- | --- | --- | --- |
| Unit test | `packages/rule-engine/__tests__/` | Jest | Mỗi rule đúng logic, score đúng công thức |
| Unit test | `apps/api/test/` | Jest | Mỗi service/controller đúng behavior |
| Unit test | `apps/ai-gateway/tests/` | pytest | OCR normalizer, RAG retrieval |
| Integration test | `tests/integration/` | Jest + Supertest | API endpoint end-to-end |
| Contract test | `tests/contract/` | Jest | API contract giữa NestJS ↔ FastAPI |
| RAG evaluation | `tests/rag-evaluation/` | pytest + RAGAS | Precision, Recall, Faithfulness |
| Demo cases | `tests/demo-cases/` | Custom script | 20 hồ sơ mẫu chạy ≥ 3 lần ổn định |

### 20 Demo Cases bắt buộc

| # | Tên case | Thủ tục | Đầu vào | Kết quả kỳ vọng |
| --- | --- | --- | --- | --- |
| 1 | Hồ sơ đầy đủ | Khai sinh | Đủ CCCD + Giấy chứng sinh | Score > 80, canSubmit: true |
| 2 | Thiếu 1 giấy tờ bắt buộc | Khai sinh | Chỉ có CCCD | Score giảm, báo thiếu giấy chứng sinh |
| 3 | Thiếu 2 giấy tờ | Cấp đổi CCCD | Thiếu ảnh + hộ khẩu | Score < 50, severity: CRITICAL |
| 4 | Sai tên giữa 2 giấy tờ | Chứng thực | Tên CCCD ≠ tên hộ khẩu | CrossCheck: MISMATCH |
| 5 | Sai ngày sinh | Khai sinh | Ngày sinh CCCD ≠ giấy khai sinh | CrossCheck: MISMATCH, severity: HIGH |
| 6 | Giấy tờ hết hạn | Cư trú | CCCD hết hạn 2025 | Phát hiện expired, score giảm |
| 7 | Ảnh mờ | Khai sinh | Ảnh CCCD blurry | OCR confidence thấp, yêu cầu upload lại |
| 8 | Ảnh tối | Chứng thực | Ảnh độ sáng thấp | Quality check failed |
| 9 | File PDF | Cư trú | Scan PDF hộ khẩu | OCR xử lý được PDF |
| 10 | Hồ sơ hoàn hảo | Hộ tịch | Tất cả đúng và đủ | Score = 100, Grade A |
| 11–15 | Thủ tục khác nhau | Chứng thực, HKD... | Đa dạng cases | Đa dạng kết quả |
| 16–18 | LawGuard cases | Khai sinh | Checklist có yêu cầu mơ hồ | Cảnh báo + citation đúng |
| 19 | SmartForm | Khai sinh | Đủ dữ liệu OCR | Form tự điền đúng trường |
| 20 | InsightMap | Aggregate | 19 case trên | Dashboard hiển thị top lỗi |

### Script chạy demo ≥ 3 lần

```bash
#!/bin/bash
# scripts/demo.sh — Chạy demo 3 lần, kiểm tra ổn định

echo "=== GovTrust AI Demo — Kiểm tra ổn định ==="
PASS=0
FAIL=0

for i in 1 2 3; do
  echo ""
  echo "--- Lần chạy $i/3 ---"

  # Chạy toàn bộ 20 demo cases
  result=$(pnpm --filter rule-engine test 2>&1)
  api_result=$(cd apps/api && pnpm test:e2e 2>&1)
  ai_result=$(cd apps/ai-gateway && python -m pytest tests/ -v 2>&1)

  if echo "$result $api_result $ai_result" | grep -q "FAIL"; then
    echo "❌ Lần $i: CÓ LỖI"
    FAIL=$((FAIL + 1))
  else
    echo "✅ Lần $i: PASS"
    PASS=$((PASS + 1))
  fi
done

echo ""
echo "=== KẾT QUẢ: $PASS/3 lần PASS, $FAIL/3 lần FAIL ==="

if [ $FAIL -eq 0 ]; then
  echo "🎉 Sản phẩm ổn định — sẵn sàng demo!"
else
  echo "⚠️ Cần sửa lỗi trước khi demo!"
  exit 1
fi
```

---

## 15. CI/CD & Deployment

### GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: GovTrust AI CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-rule-engine:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm install
      - run: pnpm --filter rule-engine test

  test-api:
    runs-on: ubuntu-latest
    services:
      mongo:
        image: mongo:7
        ports: ['27017:27017']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm install
      - run: pnpm --filter api test
        env:
          MONGO_URI: mongodb://localhost:27017/govtrust-test
          REDIS_HOST: localhost

  test-ai-gateway:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r apps/ai-gateway/requirements.txt
      - run: cd apps/ai-gateway && python -m pytest tests/ -v

  build-docker:
    needs: [test-rule-engine, test-api, test-ai-gateway]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose -f infra/docker-compose.yml build
```

---

## 16. Phân công & Timeline chi tiết

### Timeline 7 ngày (26/6 – 03/7/2026)

| Ngày | Ngày tháng | Mục tiêu chính | Deliverable | Checkpoint |
| --- | --- | --- | --- | --- |
| **Day 1** | 26/6 (T5) | Setup repo + infra + API skeleton | Repo chạy được, Docker up, endpoints stub | Toàn bộ stack chạy local |
| **Day 2** | 27/6 (T6) | Tích hợp VNPT API + Rule Engine | OCR gọi VNPT thật, 5 rules hoạt động | Demo OCR + Score cơ bản |
| **Day 3** | 28/6 (T7) | Frontend luồng chính + CrossCheck | Upload → OCR → CrossCheck → Score hiển thị | Luồng người dân chạy E2E |
| **Day 4** | 29/6 (CN) | LawGuard RAG + SmartForm + UI polish | RAG hoạt động, form tự điền, UI đẹp | Demo 5 test case pass |
| **Day 5** | 30/6 (T2) | Dashboard InsightMap + Gov ReCheck + Priority | Cán bộ dùng được, charts hoạt động | Cả 2 role citizen/officer chạy |
| **Day 6** | 01/7 (T3) | Testing + Bug fix + 20 demo cases | ≥ 3 lần chạy ổn định, test pass | Script demo.sh pass 3/3 |
| **Day 7** | 02/7 (T4) | Viết báo cáo + Video demo + Final polish | Báo cáo MD hoàn chỉnh, video 5 phút | Sẵn sàng nộp |
| **Buffer** | 03/7 (T5) | Nộp bài + Fix last minute | Submission | ✅ Done |

### Phân công theo thành viên

| Thành viên | Vai trò | Phụ trách module | Ngày chính | Deliverable |
| --- | --- | --- | --- | --- |
| **Tech Lead** | Kiến trúc + DevOps | Repo setup, Docker, CI/CD, infra | Day 1-2 | Monorepo chạy, Docker Compose |
| **Backend Dev** | NestJS API | Auth, Sessions, Procedures, Scoring, Insights modules | Day 1-5 | Toàn bộ REST API |
| **AI Lead** | FastAPI + VNPT API | Tích hợp VNPT OCR/eKYC, OCR Normalizer, CrossCheck, RAG | Day 1-4 | AI Gateway hoạt động, gọi VNPT thật |
| **Frontend Dev 1** | Citizen App | Upload, Result, SmartForm, Confirm, HoSoBot | Day 2-5 | Luồng người dân E2E |
| **Frontend Dev 2** | Officer Dashboard | ReCheck, Priority, InsightMap charts, RBAC UI | Day 3-5 | Dashboard cán bộ |
| **Rule Engine Dev** | Score + CrossCheck | 5 rules, weights, validators, unit tests | Day 2-3 | Rule Engine + 100% test pass |
| **QA / Docs** | Testing + Báo cáo | 20 demo cases, script demo, báo cáo, video | Day 5-7 | Test pass + Báo cáo hoàn chỉnh |

### Daily Standup (15 phút)

Mỗi ngày 9:00 sáng, trả lời 3 câu:
1. Hôm qua làm gì?
2. Hôm nay làm gì?
3. Có blocker không?

---

## 17. Quy ước code & Git workflow

### Git Branching

```
main              ← Chỉ merge khi stable, dùng cho demo
  └── develop     ← Integration branch
       ├── feat/web-upload          ← Frontend features
       ├── feat/api-scoring         ← Backend features
       ├── feat/ai-vnpt-ocr        ← AI Gateway features
       ├── feat/rule-engine         ← Rule Engine
       ├── fix/ocr-normalizer       ← Bug fixes
       └── docs/bao-cao            ← Tài liệu
```

### Commit Convention

```
feat(web): thêm upload zone với drag & drop
feat(api): tạo scoring module với BullMQ
feat(ai): tích hợp VNPT eKYC OCR API
feat(rule): thêm rule kiểm tra giấy tờ hết hạn
fix(ai): sửa lỗi normalize ngày sinh từ VNPT OCR
docs: cập nhật README hướng dẫn cài đặt
test(rule): thêm test case hồ sơ thiếu giấy tờ
chore: cập nhật docker-compose
```

### Code Review Checklist

- [ ] Không commit API key / secret
- [ ] Có error handling cho VNPT API calls
- [ ] Response format đúng contract
- [ ] Có TypeScript types / Pydantic models
- [ ] Có unit test cho logic mới
- [ ] UI có loading state và error state
- [ ] Disclaimer hiển thị ở trang kết quả
- [ ] Log không chứa thông tin cá nhân

### Naming Convention

| Loại | Convention | Ví dụ |
| --- | --- | --- |
| File TypeScript | camelCase | `scoreEngine.ts`, `uploadZone.tsx` |
| File Python | snake_case | `vnpt_ocr.py`, `rag_engine.py` |
| Component React | PascalCase | `ScoreCard.tsx`, `UploadZone.tsx` |
| API endpoint | kebab-case | `/api/sessions/:id/cross-check` |
| Database field | camelCase | `sessionId`, `procedureId` |
| Env variable | UPPER_SNAKE | `VNPT_EKYC_BASE_URL` |
| CSS class | kebab-case | `score-card`, `upload-zone` |
| Branch | kebab-case | `feat/api-scoring` |

---

## 18. Checklist hoàn thành MVP

### Kỹ thuật

- [ ] Monorepo setup + pnpm workspace hoạt động
- [ ] Docker Compose chạy toàn stack bằng 1 lệnh
- [ ] `.env.example` đầy đủ, không commit secret
- [ ] README hướng dẫn cài đặt rõ ràng
- [ ] VNPT eKYC OCR API gọi thành công
- [ ] VNPT SmartReader API gọi thành công
- [ ] VNPT SmartBot API gọi thành công (cho HoSoBot)
- [ ] OCR Normalizer chuẩn hóa output đúng
- [ ] CrossCheck phát hiện mismatch/missing/expired
- [ ] Score Engine chấm điểm 0-100 đúng logic
- [ ] LawGuard RAG truy xuất văn bản pháp luật + citation
- [ ] SmartForm tự điền form từ dữ liệu OCR
- [ ] Gov Re-Check cho cán bộ hoạt động
- [ ] Priority Ranking phân loại A/B/C/D
- [ ] InsightMap Dashboard hiển thị charts
- [ ] RBAC: citizen / officer / admin
- [ ] Session TTL 30 phút + file cleanup

### Testing

- [ ] Unit test Rule Engine: 100% pass
- [ ] Unit test API services: pass
- [ ] Unit test AI Gateway: pass
- [ ] Integration test luồng chính: pass
- [ ] 20 demo cases: pass
- [ ] Script demo.sh chạy ≥ 3 lần ổn định: pass
- [ ] RAG benchmark: Precision > 80%, Recall > 75%

### UX

- [ ] Progress bar toàn luồng
- [ ] Loading state cho mọi API call
- [ ] Error state + retry cho VNPT API
- [ ] Giải thích kết quả bằng tiếng Việt dễ hiểu
- [ ] Mobile responsive
- [ ] Font lớn + contrast cao (accessibility)
- [ ] Disclaimer ở mọi trang kết quả
- [ ] Tích hợp VNPT SmartUX (nếu kịp)

### Báo cáo & Demo

- [ ] Báo cáo bám sát 5 nhóm tiêu chí (100 điểm)
- [ ] Sơ đồ kiến trúc hệ thống
- [ ] Bảng API contract input–output
- [ ] Bảng test case + kết quả
- [ ] Video demo 5 phút
- [ ] Slide trình bày
- [ ] Q&A phòng thủ cho BGK

---

> **Tài liệu này là kim chỉ nam kỹ thuật cho team GovTrust AI trong 7 ngày Vòng 2.**
> Mọi thành viên phải đọc và hiểu trước khi code.
> Cập nhật liên tục tại: `docs/tai_lieu_phat_trien.md`

*GovTrust AI — Tài liệu phát triển v1.0, Vietnamese Student HackAIthon 2026.*
