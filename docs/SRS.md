# GovTrust AI — Software Requirements Specification (SRS)

> **Dự án:** GovTrust AI — Lớp tiền kiểm hồ sơ dịch vụ công
> **Cuộc thi:** Vietnamese Student HackAIthon 2026 — Bảng B (Challenger)
> **Phiên bản:** 1.0
> **Ngày:** 29/06/2026
> **Nguồn tham chiếu:** `docs/tai_lieu_phat_trien.md`, `docs/DATABASE_DESIGN.md`, `docs/DESIGN_UX_UI.md`, `Gov_Trust.md`
> **Tài liệu liên quan:** `docs/BRS.md` (yêu cầu nghiệp vụ)

---

## 1. Giới thiệu

### 1.1. Mục đích
SRS mô tả **yêu cầu phần mềm** cho GovTrust AI: kiến trúc, yêu cầu chức năng theo module, yêu cầu phi chức năng, mô hình dữ liệu, đặc tả API, use case. Tài liệu trả lời câu hỏi **"Xây dựng như thế nào?"**, hiện thực hóa các yêu cầu nghiệp vụ BR trong `docs/BRS.md`.

### 1.2. Phạm vi hệ thống
Web app độc lập, kiến trúc Microservices, mô phỏng luồng tiền kiểm hồ sơ 2 phía (người dân + cơ quan) cho 3 thủ tục MVP, dùng dữ liệu mẫu và văn bản pháp luật công khai.

### 1.3. Định nghĩa & viết tắt
| Thuật ngữ | Ý nghĩa |
|---|---|
| OCR | Optical Character Recognition — bóc tách chữ từ ảnh giấy tờ |
| RAG | Retrieval-Augmented Generation — sinh nội dung dựa trên truy xuất văn bản |
| eKYC | Electronic Know Your Customer — định danh điện tử |
| TTL | Time To Live — thời gian sống của bản ghi trước khi tự xóa |
| RBAC | Role-Based Access Control — phân quyền theo vai trò |
| PII | Personally Identifiable Information — thông tin định danh cá nhân |
| Session | Phiên tiền kiểm một bộ hồ sơ |

---

## 2. Mô tả tổng quan

### 2.1. Kiến trúc hệ thống (Microservices)

```
┌──────────────────────────────────────────────────────────┐
│  apps/web (Next.js 14)  — Citizen App + InsightMap Dashboard │
└───────────────┬──────────────────────────────────────────┘
                │ HTTPS / REST
┌───────────────▼──────────────────────────────────────────┐
│  apps/api (NestJS Orchestrator, :4000)                    │
│  Auth/RBAC · Session · Procedure · Scoring · SmartForm    │
│  Recheck · Priority · Insights · Queue(BullMQ)            │
└───┬───────────────────────────┬──────────────────────────┘
    │ REST nội bộ               │ Redis Queue (job bất đồng bộ)
    │                           ▼
    │              ┌──────────────────────────────────────┐
    │              │  apps/ai-gateway (FastAPI, :8000)     │
    │              │  OCR · CrossCheck · LawGuard/RAG ·    │
    │              │  Embeddings · VNPT clients · Workers  │
    │              └───────────┬──────────────────────────┘
    ▼                          ▼
┌─────────────┐   ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ MongoDB     │   │ Qdrant      │   │ Redis        │   │ Object Storage│
│ (NestJS)    │   │ Qdrant(AI)  │   │ Queue+Cache  │   │ (file tạm,TTL)│
└─────────────┘   └─────────────┘   └──────────────┘   └──────────────┘

packages/rule-engine (TS dùng chung): CrossCheck + Score Engine
```

**Nguyên tắc Database per Service:** NestJS sở hữu MongoDB; FastAPI sở hữu Vector DB. Hai service không truy cập chéo DB — trao đổi qua REST nội bộ + Redis Queue theo `sessionId`.

### 2.2. Vai trò người dùng (Actors)
| Actor | Quyền |
|---|---|
| CITIZEN | Tạo session, upload, xem kết quả/score, sửa form, xác nhận; chỉ xem session của mình |
| OFFICER | Tái kiểm hồ sơ CONFIRMED, xem Priority, xem InsightMap |
| ADMIN | Quản lý thủ tục, tài khoản, cấu hình |
| AI WORKER | Chỉ UPDATE kết quả vào `sessions`; không DELETE/DROP |

### 2.3. Stack công nghệ
| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind, React Hook Form + Zod, Zustand, Recharts/Chart.js |
| Orchestrator | NestJS, Mongoose, @nestjs/jwt + passport, BullMQ |
| AI Gateway | FastAPI (Python), Celery/RQ workers, sentence-transformers |
| Database | MongoDB (nghiệp vụ), Qdrant (vector), Redis (queue/cache) |
| Storage | Local/temporary object storage (auto-delete) |
| Deploy | Vercel (web) + Render/Railway/VPS, Docker Compose |
| OCR/AI API | VNPT SmartReader, eKYC, SmartBot, SmartVoice |

---

## 3. Yêu cầu chức năng (Functional Requirements — FR)

> Ký hiệu ưu tiên: **M** = Must, **S** = Should, **C** = Could.

### 3.1. Module Auth & RBAC
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-AUTH-01 | Đăng nhập/đăng ký bằng JWT; hỗ trợ Guest (ẩn danh) cho người dân | M |
| FR-AUTH-02 | Phân quyền theo role CITIZEN/OFFICER/ADMIN qua RolesGuard | M |
| FR-AUTH-03 | CITIZEN chỉ truy cập session của chính mình | M |

### 3.2. Module Procedures & HoSoBot
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-PROC-01 | Liệt kê và xem chi tiết thủ tục kèm checklist giấy tờ + formFields | M |
| FR-PROC-02 | HoSoBot nhận diện thủ tục từ câu hỏi tự nhiên của người dân (tích hợp VNPT SmartBot) | S |
| FR-PROC-03 | Cấu hình thủ tục động qua document trong DB, không sửa code | M |
| FR-PROC-04 | Output HoSoBot: `procedureId, procedureName, confidence, checklist[], formFields[]` | M |

### 3.3. Module Documents & OCR
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-DOC-01 | Upload nhiều giấy tờ (ảnh/PDF) theo phiên (multipart) | M |
| FR-DOC-02 | Kiểm tra định dạng & chất lượng ảnh (blur/brightness) ngay sau upload | M |
| FR-DOC-03 | Gọi OCR (VNPT SmartReader/eKYC) bóc tách field theo `doc_type` (CCCD/CMND/PASSPORT) | M |
| FR-DOC-04 | Chuẩn hóa output OCR về schema thống nhất: `{fields{value,confidence}, avg_confidence, processing_time}` | M |
| FR-DOC-05 | Ảnh gốc chỉ lưu tạm trong object storage; DB chỉ giữ con trỏ `fileUrl` | M |

### 3.4. Module CrossCheck
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-CC-01 | Đối chiếu chéo các field giữa nhiều giấy tờ: họ tên, ngày sinh, địa chỉ, số giấy tờ | M |
| FR-CC-02 | Phát hiện trạng thái MATCH/MISMATCH kèm severity và vị trí lỗi | M |
| FR-CC-03 | Phát hiện giấy tờ thiếu (`missingDocuments[]`) và hết hạn (`expiredDocuments[]`) | M |
| FR-CC-04 | Dùng validators: date, name (phát hiện sai đệm), address | M |

### 3.5. Module Score Engine (rule-based)
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-SCORE-01 | Chấm điểm 0–100: `finalScore = max(0, min(100, 100 + Σ rule.impact))` | M |
| FR-SCORE-02 | Áp 5 rule: MissingDocument, ExpiredDocument, MismatchInfo, ImageQuality, OCRConfidence | M |
| FR-SCORE-03 | Trọng số trừ điểm cấu hình theo thủ tục (`procedures.scoringRules.penalties`) | M |
| FR-SCORE-04 | Xếp loại: A≥90, B≥75, C≥60, D<60 | M |
| FR-SCORE-05 | `canSubmit = score ≥ ngưỡng && không có rule severity CRITICAL` | M |
| FR-SCORE-06 | Sinh `recommendation` tiếng Việt từ các rule failed; mọi điểm trừ có lý do (audit được) | M |

### 3.6. Module LawGuard / RAG
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-LAW-01 | Chunk + embedding văn bản pháp luật, lưu vào Vector DB | M |
| FR-LAW-02 | Truy xuất top-k căn cứ liên quan theo checklist + procedureId (có filter metadata.category) | M |
| FR-LAW-03 | Sinh cảnh báo `alerts[]{type REFERENCE/WARNING, message, legalSource, confidence}` | M |
| FR-LAW-04 | Mỗi cảnh báo kèm nguồn (title, article) + confidence + disclaimer | M |
| FR-LAW-05 | Nếu căn cứ yếu/thiếu → trạng thái "cần kiểm tra thêm", không khẳng định | M |

### 3.7. Module SmartForm
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-FORM-01 | Tự điền form từ dữ liệu OCR theo `formFields.sourceMap` | S |
| FR-FORM-02 | Output `formData{field:{value,source,editable}}, filledCount, totalCount, missingFields[]` | S |
| FR-FORM-03 | Người dân chỉnh sửa được trường đã điền | S |

### 3.8. Luồng xác nhận của người dân
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-CONF-01 | Người dân xem tổng hợp score + cảnh báo + form, quyết định xác nhận | M |
| FR-CONF-02 | Hệ thống KHÔNG nộp hồ sơ thay; chỉ chuyển trạng thái CONFIRMED (mock) | M |

### 3.9. Module Gov Re-Check (cán bộ)
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-REC-01 | Cán bộ tái kiểm hồ sơ CONFIRMED, phân loại đầy đủ/cần bổ sung/cần kiểm tra kỹ | S |
| FR-REC-02 | Output `issues[]{type,field,action}` + `officerNote` | S |

### 3.10. Module Priority Ranking
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-PRI-01 | Gợi ý thứ tự ưu tiên A/B/C/D từ re-check + hạn xử lý + mức cấp bách | S |
| FR-PRI-02 | Output `rankings[]{sessionId, priority, reason, score}`; quyết định cuối thuộc cán bộ | S |

### 3.11. Module InsightMap
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-INS-01 | Rút metadata ẩn danh từ session trước khi xóa, ghi vào `insight_logs` | M |
| FR-INS-02 | Dashboard: top lỗi, phân bố score, heatmap điểm nghẽn, xu hướng theo tuần/tháng | S |
| FR-INS-03 | Dữ liệu tuyệt đối không chứa PII | M |

### 3.12. Xử lý bất đồng bộ & trạng thái
| FR | Mô tả | Ưu tiên |
|---|---|---|
| FR-ASYNC-01 | Tác vụ nặng (LawGuard/RAG, embedding) chạy async qua Redis Queue (NestJS producer, FastAPI consumer) | M |
| FR-ASYNC-02 | Frontend theo dõi trạng thái job theo sessionId (polling/WebSocket): queued/processing/done/failed | M |
| FR-ASYNC-03 | Hiển thị progress bar theo bước: Upload→OCR→CrossCheck→Score→LawGuard→SmartForm | M |
| FR-ASYNC-04 | Khi API ngoài lỗi/chậm: dùng mock fallback đã chuẩn bị để demo ổn định | S |

> ⚠️ **Lưu ý mâu thuẫn tài liệu (cần chốt):** `docs/tai_lieu_phat_trien.md` nêu "KHÔNG dùng mock cho API VNPT" trong khi `nội dung.md` cho phép mock fallback. FR-ASYNC-04 đặt mock fallback ở mức "Should" cho mục đích demo — quyết định cuối tùy chính sách BTC.

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements — NFR)

### 4.1. Bảo mật & quyền riêng tư
| NFR | Mô tả |
|---|---|
| NFR-SEC-01 | Zero-Retention: `sessions` có TTL Index tự xóa; ảnh gốc xóa qua cronjob/TTL |
| NFR-SEC-02 | `insight_logs` tồn tại lâu dài nhưng không chứa PII (tên, số CCCD, ảnh, địa chỉ) |
| NFR-SEC-03 | HTTPS toàn tuyến; API key quản lý qua biến môi trường, không commit secret |
| NFR-SEC-04 | RBAC theo role; chống prompt/RAG injection (sanitize input, tách nguồn luật khỏi input người dùng) |
| NFR-SEC-05 | Người dùng không ghi đè được legal KB |

### 4.2. Hiệu năng
| NFR | Mô tả |
|---|---|
| NFR-PERF-01 | Tác vụ đồng bộ (chọn thủ tục, kiểm tra ảnh) phản hồi nhanh, độ trễ thấp |
| NFR-PERF-02 | Tiền xử lý & cache embedding văn bản luật/template trước demo |
| NFR-PERF-03 | Cache kết quả truy xuất căn cứ theo thủ tục để giảm gọi Vector DB/LLM |
| NFR-PERF-04 | Pipeline đủ bước không timeout, không màn hình trắng |

### 4.3. Khả năng mở rộng
| NFR | Mô tả |
|---|---|
| NFR-SCALE-01 | Scale-out độc lập AI Gateway/Vector DB/queue worker khi tải tăng |
| NFR-SCALE-02 | Thêm thủ tục mới bằng template (document trong DB), không sửa code lõi |
| NFR-SCALE-03 | Hướng multi-tenant cho giai đoạn SaaS/white-label |

### 4.4. Khả dụng & UX (theo DESIGN_UX_UI.md)
| NFR | Mô tả |
|---|---|
| NFR-UX-01 | Accessibility WCAG 2.1 AA: contrast, font ≥16px, nút chạm ≥48px, aria-label |
| NFR-UX-02 | Responsive, ưu tiên mobile cho người dân; desktop cho cán bộ |
| NFR-UX-03 | Loading skeleton/progress bar cho mọi tác vụ chờ |
| NFR-UX-04 | Đo UX: TCR, Time-to-Result, CSAT, NPS, SUS, Abandon rate |

### 4.5. Độ tin cậy & chất lượng AI
| NFR | Mô tả |
|---|---|
| NFR-AI-01 | LawGuard đánh giá bằng Context Precision/Recall, Faithfulness, Citation Accuracy |
| NFR-AI-02 | Human Review Pass Rate cho 20–30 case demo trước khi nộp |
| NFR-AI-03 | Score Engine dùng rule (không LLM phán quyết) để audit được |

### 4.6. Khả năng kiểm thử & vận hành
| NFR | Mô tả |
|---|---|
| NFR-OPS-01 | Test: unit (rule engine), integration (API), contract (NestJS↔FastAPI), rag-evaluation, 20 demo-cases |
| NFR-OPS-02 | Chạy local 1 lệnh (docker compose); có `.env.example`, seed data |
| NFR-OPS-03 | Logging ẩn danh, không log giấy tờ gốc |

---

## 5. Mô hình dữ liệu (Data Model)

### 5.1. MongoDB (NestJS) — Collections chính
| Collection | Trường chính | Vòng đời |
|---|---|---|
| `users` | username, passwordHash, fullName, role(CITIZEN/OFFICER/ADMIN), organization | Persistent |
| `procedures` | code, name, checklist[], formFields[], scoringRules{baseScore, penalties} | Persistent |
| `sessions` | userId, procedureId, status, documents[], **aiResult**, officerNotes, **expiresAt (TTL)** | Ephemeral (24h) |
| `insight_logs` | procedureId, errorType, severity, specificDocType, finalScore, droppedAtStep, deviceType | Persistent (không PII) |

**`sessions.aiResult`** (kết quả AI lồng nhau): `ocrData{provider,confidence,fields,liveness}`, `crossCheck{mismatches[],missing[]}`, `score{total,grade,breakdown[],canSubmit}`, `lawGuardAlerts[]{itemId,message,source,confidence}`, `formData{field:{value,source,confidence}}`.

`status` enum: INIT → UPLOADING → AI_PROCESSING → SCORED → CONFIRMED → REJECTED.

### 5.2. Vector DB (FastAPI) — `legal_chunks` (Qdrant)
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | String | vd `luat-ho-tich-2014-dieu16-chunk1` |
| `embedding` | Vector[768] | từ `sentence-transformers` |
| `document` | String | text chunk (~300–500 từ) |
| `metadata` | JSON | `{category, title, article, url}` |

> **ĐÃ CHỐT (xem DATABASE_DESIGN.md v2.0):** Dùng **Qdrant**, collection `legal_chunks`, vector 768, distance Cosine. Field TTL: `expiresAt`, mặc định 24h. Embed `aiResult` trong `sessions`. Penalties: -20/-10/-15/-5.

### 5.3. Redis
Job/queue (BullMQ), trạng thái pipeline theo sessionId, cache Top-k retrieval — đều có TTL.

---

## 6. Đặc tả API

### 6.1. NestJS Orchestrator (:4000)
| Method | Path | Mô tả |
|---|---|---|
| POST | `/auth/login`, `/auth/register` | Xác thực |
| GET | `/procedures`, `/procedures/:id` | Danh sách / chi tiết thủ tục |
| POST | `/procedures/identify` | HoSoBot nhận diện thủ tục |
| POST | `/sessions` · GET `/sessions/:id` | Tạo / lấy trạng thái phiên |
| POST | `/documents/upload` | Upload giấy tờ (multipart) |
| POST | `/documents/:id/ocr` | Trigger OCR → AI Gateway |
| POST | `/sessions/:id/crosscheck` | Trigger CrossCheck |
| POST | `/sessions/:id/score` | Trigger Score Engine |
| POST | `/sessions/:id/lawguard` | Trigger LawGuard |
| POST | `/sessions/:id/smartform` | Tạo form tự điền |
| POST | `/sessions/:id/confirm` | Người dân xác nhận |
| POST | `/sessions/:id/recheck` | Cán bộ tái kiểm |
| GET | `/priority?status=pending` | Danh sách theo ưu tiên |
| GET | `/insights/dashboard`, `/insights/top-errors`, `/insights/trend` | InsightMap |

### 6.2. FastAPI AI Gateway (prefix `/api/v1`, :8000)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/ocr/extract` | Bóc tách giấy tờ (`file`, `doc_type`) |
| POST | `/crosscheck` | Đối chiếu chéo |
| POST | `/lawguard` | RAG/LawGuard alerts |
| POST | `/embeddings` | Tạo embedding legal chunks |

### 6.3. Hàm chính (interface)
- AI Gateway: `VNPTOCRClient.ocr_id_card(image_base64, doc_type)`, `.liveness_check()`, `.compare_faces()`; `VNPTSmartBotClient.chat()`, `.chat_advanced_llm()`; `normalize_ocr_result(raw, doc_type)`; `RAGEngine.retrieve(query, top_k=5)`, `.generate_alerts(checklist, procedure_id)`.
- NestJS: `DocumentsService.uploadDocument(dto, file)`, `.triggerOCR(documentId)`, `.checkImageQuality(filePath)`, `.cleanupExpiredFiles()` (@Cron).
- rule-engine: `ScoreEngine.evaluate(context): ScoreResult`; mỗi `Rule.evaluate(context): RuleResult{ruleId, passed, impact, severity, detail}`.

---

## 7. Use Cases chính

### UC-01: Người dân tiền kiểm hồ sơ (ví dụ Đăng ký khai sinh)
**Actor:** CITIZEN
**Tiền điều kiện:** Chọn được thủ tục khai sinh.
**Luồng chính:**
1. Chọn thủ tục → nhận checklist (giấy chứng sinh, CCCD cha/mẹ, xác nhận cư trú).
2. Upload các giấy tờ → hệ thống kiểm tra chất lượng ảnh.
3. OCR bóc tách field từng giấy.
4. CrossCheck đối chiếu chéo → phát hiện lệch/thiếu/hết hạn.
5. Score chấm điểm 0–100 + giải thích.
6. LawGuard cảnh báo căn cứ pháp lý (nếu có).
7. SmartForm tự điền biểu mẫu.
8. Người dân kiểm tra/sửa → xác nhận (CONFIRMED).
**Hậu điều kiện:** Hồ sơ ở trạng thái CONFIRMED; metadata lỗi ẩn danh ghi vào insight_logs; ảnh gốc xóa sau phiên.

### UC-02: Cán bộ tái kiểm & ưu tiên
**Actor:** OFFICER → Gov Re-Check (UC) phân loại hồ sơ → Priority Ranking gợi ý thứ tự A/B/C/D.

### UC-03: Cơ quan xem InsightMap
**Actor:** OFFICER/ADMIN → xem top lỗi, heatmap điểm nghẽn, xu hướng để cải tiến thủ tục.

---

## 8. Tiêu chí kiểm thử (Acceptance — từ test cases)
| Test case | Kết quả đạt |
|---|---|
| Hồ sơ đủ | Score > 80, có thể nộp, form điền đủ trường chính |
| Thiếu giấy tờ | Score giảm, báo thiếu + gợi ý bổ sung |
| Sai thông tin | CrossCheck cảnh báo mismatch + vị trí |
| Giấy tờ hết hạn | Báo hết hạn/cần cập nhật |
| Ảnh mờ | OCR confidence thấp, yêu cầu upload lại |
| Yêu cầu chưa rõ căn cứ | LawGuard cảnh báo kèm nguồn |
| InsightMap (20 hồ sơ) | Dashboard top lỗi, tỷ lệ score |
| RAG/LawGuard | Đạt Context Precision/Recall ngưỡng MVP, có trích dẫn |
| Độ trễ pipeline | Progress bar, async, không timeout |

---

## 9. Quyết định đã chốt (Closed Issues — xem DATABASE_DESIGN.md v2.0)
| # | Quyết định |
|---|---|
| OI-1 | **Qdrant**, collection `legal_chunks`, vector 768, distance Cosine |
| OI-2 | Field TTL: **`expiresAt`**, mặc định **24h** (env `SESSION_TTL_HOURS`) |
| OI-3 | **Embed `aiResult`** trong `sessions` (không tách collection con) |
| OI-4 | Penalties mặc định trong `procedures.scoringRules`: -20/-10/-15/-5 |
| OI-5 | Chính sách mock OCR — theo yêu cầu BTC |

---

## 10. Ma trận truy vết (Traceability BR → FR)
| BR (BRS) | FR (SRS) |
|---|---|
| BR-01 | FR-PROC-01, FR-PROC-02, FR-PROC-04 |
| BR-02 | FR-DOC-01 |
| BR-03 | FR-DOC-03, FR-DOC-04 |
| BR-04 | FR-CC-01…FR-CC-04 |
| BR-05 | FR-SCORE-01…FR-SCORE-06 |
| BR-06 | FR-LAW-01…FR-LAW-05 |
| BR-07 | FR-FORM-01…FR-FORM-03 |
| BR-08 | FR-CONF-01, FR-CONF-02 |
| BR-09 | FR-REC-01, FR-PRI-01, FR-PRI-02 |
| BR-10 | FR-INS-01…FR-INS-03 |
| BR-11 | NFR-SEC-01…NFR-SEC-05, FR-DOC-05 |
| BR-12 | FR-LAW-04, FR-PRI-02, NFR-AI-03 |
