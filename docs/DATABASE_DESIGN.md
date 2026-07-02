# GovTrust AI — Tài Liệu Thiết Kế Cơ Sở Dữ Liệu (Database Design)
### Vietnamese Student HackAIthon 2026 | Bảng B — Challenger

> **Vai trò:** Database Expert
> **Phiên bản:** 2.1 — 29/06/2026 (bổ sung collection `document_types` cho đa dạng giấy tờ)
> **Mục tiêu:** Thiết kế CSDL cho kiến trúc Microservices, xử lý AI bất đồng bộ, lưu vết phân tích (InsightMap), tuân thủ khắt khe **Bảo mật dữ liệu công dân (Data Privacy)**.

> **Triết lý cốt lõi — MongoDB là nguồn sự thật (Source of Truth):**
> - **MongoDB** luôn được tin cậy tuyệt đối. Mọi dữ liệu nghiệp vụ "chính thức" chỉ tồn tại khi đã ghi vào MongoDB.
> - **Qdrant** và **Redis** chỉ là lớp phái sinh/tăng tốc — **rebuild được** và **fallback xuống MongoDB** khi mất.

---

## 1. Tổng quan Kiến trúc Dữ liệu (Polyglot Persistence)

GovTrust AI áp dụng **Polyglot Persistence** (chọn DB theo đặc thù dữ liệu) để tách AI khỏi Nghiệp vụ và tối ưu hiệu năng:

| Store | Chủ sở hữu | Vai trò | Mất thì sao? |
|---|---|---|---|
| **MongoDB** `govtrust_business` | core-svc | **Nguồn sự thật**: users, document_types, procedures, sessions (+aiResult), jobs, insight_logs | Hệ thống dừng — đây là chân lý |
| **Qdrant** `legal_chunks` | ai-svc | Chỉ mục ngữ nghĩa văn bản pháp luật (vector + payload) | Rebuild từ nguồn luật; LawGuard tạm degrade |
| **Redis** | Shared qua API | Tăng tốc + vận chuyển job (BullMQ queue, cache, pipeline status) | **Fallback xuống MongoDB**, chạy degraded |
| **Object Storage** (Local/S3) | core-svc | File ảnh gốc (CCCD, giấy khai sinh) — **tạm**, auto-delete | Ảnh mất sau phiên (đúng thiết kế zero-retention) |

**Nguyên tắc Database per Service:** core-svc **không** truy cập Qdrant; ai-svc **không** truy cập MongoDB. Trao đổi qua **gRPC** (tác vụ nhanh) + **Redis Queue/BullMQ** (tác vụ nặng) theo `sessionId`.

```
Upload ảnh → Object Storage (tạm)
                │ fileUrl
                ▼
core-svc ghi session (MongoDB, status=AI_PROCESSING)
   │  insert job (jobs, state=PENDING)  ← chân lý của hàng đợi
   │  enqueue BullMQ (Redis)            → state=ENQUEUED
   ▼
BullMQ consumer (core-svc) gọi ai-svc qua gRPC: ExtractOCR → ghi ocrData vào session
   ▼
core-svc: CrossCheck + Score (rule-engine, MongoDB) ; LawGuard gọi ai-svc gRPC (query Qdrant)
   │ ghi aiResult vào session
   ▼
core-svc GHI aiResult vào session (MongoDB)  ◄── chỉ lúc này mới "chính thức"
   │ trước khi session bị TTL xóa
   ▼
rút metadata ẩn danh → insight_logs (MongoDB, vĩnh viễn, KHÔNG PII)
```

---

## 2. Thiết kế Lược đồ (Schema Design) — MongoDB

DB `govtrust_business`. 6 collections: `users`, `document_types`, `procedures`, `sessions`, `jobs`, `insight_logs`.

> **Quan hệ cốt lõi (catalog → tham chiếu):** `document_types` là **từ điển dùng chung** định nghĩa mỗi loại giấy tờ **đúng 1 lần** (CCCD, giấy khai sinh…). `procedures.checklist` **không** định nghĩa lại giấy tờ mà chỉ **trỏ** tới `document_types.code`. Nhờ vậy thêm thủ tục mới chủ yếu là tái dùng giấy tờ đã có — **không sửa code, không sửa schema**.

### 2.1. Collection: `users` (Tài khoản người dùng)
*Phân quyền RBAC. Người dân có thể dùng ẩn danh (Guest) hoặc tạo tài khoản để lưu lịch sử.*

```typescript
{
  _id: ObjectId,
  username: String,       // Số điện thoại hoặc CCCD
  passwordHash: String,   // Bcrypt hash
  fullName: String,
  role: Enum("CITIZEN", "OFFICER", "ADMIN"),
  organization: String,   // Nơi công tác (nếu OFFICER, vd: "UBND Phường X")
  createdAt: Date,
  updatedAt: Date
}
```
**Index:** `{ username: 1 }` unique.

### 2.2. Collection: `document_types` (Danh mục loại giấy tờ — Catalog dùng chung)
*Từ điển định nghĩa **mỗi loại giấy tờ đúng 1 lần** (CCCD, giấy khai sinh, giấy chứng sinh…). Đây là chìa khoá để hệ thống tổng quát: thêm 1 loại giấy tờ = thêm 1 document, **không sửa code**. `procedures` và `aiResult.ocrData` đều tham chiếu mã ở đây thay vì hardcode field.*

```typescript
{
  _id: ObjectId,
  code: String,                 // "GIAY_KHAI_SINH" — unique, viết hoa không dấu
  name: String,                 // "Giấy khai sinh"
  category: Enum("NHAN_THAN", "HO_TICH", "DAT_DAI", "DOANH_NGHIEP"),
  issuingAuthority: String,     // "UBND cấp xã", "Bộ Công an"
  hasPortrait: Boolean,         // có ảnh chân dung → phục vụ liveness/eKYC
  pagesRequired: Number,        // số mặt/trang cần chụp (CCCD=2)

  // ====== BỘ TRƯỜNG DỮ LIỆU (Field Schema) — thay cho fields hardcode ======
  // OCR result lưu theo các key ở đây → mọi giấy tờ dùng chung 1 khuôn { value, confidence }
  fields: [{
    key: String,                // "hoTenMe" — tên máy, dùng để CrossCheck ghép field
    label: String,              // "Họ tên mẹ"
    dataType: Enum("string", "date", "enum", "number", "id_number"),
    format: String,             // "dd/mm/yyyy" (nếu date)
    regex: String,              // "^\\d{12}$" (validate, vd số CCCD)
    required: Boolean,          // OCR bắt buộc đọc được field này
    isIdentity: Boolean,        // trường định danh người (PII) → dùng cross-check & ẩn danh hoá
    enumValues: [String]        // ["Nam","Nữ"] nếu dataType=enum
  }],

  // ====== QUY TẮC HẾT HẠN (Validity) — thay cho expiredDoc cố định ======
  validity: {
    hasExpiry: Boolean,         // giấy khai sinh = false (không bao giờ hết hạn)
    expiryField: String,        // field chứa ngày hết hạn, vd CCCD = "coGiaTriDen"
    validityRule: String,       // rule có tên nếu hạn không in sẵn, vd "AGE_MILESTONE_25_40_60"
    gracePeriodDays: Number     // số ngày ân hạn (nếu có)
  },

  aliasCodes: [String],         // giấy tờ thay thế được, vd CCCD ⟷ ["CMND"]
  qualityRule: { minResolution: Number },   // ngưỡng chất lượng ảnh
  legal: {                      // map sang căn cứ pháp lý cho LawGuard/Qdrant
    category: String,           // khớp Qdrant payload "category"
    governingLaws: [String]     // ["Luật Hộ tịch 2014"]
  },

  isActive: Boolean
}
```
**Index:** `{ code: 1 }` unique, `{ category: 1 }`, `{ isActive: 1 }`.

> **Lợi ích trực tiếp cho thủ tục đa giấy tờ (vd khai sinh):** muốn đối chiếu chéo `hoTenMe` giữa *tờ khai* và *giấy chứng sinh*, cả hai giấy phải phơi ra **cùng một `key` chuẩn** (`hoTenMe`). `document_types` đảm bảo điều đó — nếu thiếu catalog, mỗi kết quả OCR đặt key tuỳ ý (`ten_me`, `mother_name`…) và **bước CrossCheck không ghép được**.

### 2.3. Collection: `procedures` (Định nghĩa Thủ tục hành chính)
*Cấu hình động. Thêm thủ tục mới = thêm 1 document, không sửa code.*

```typescript
{
  _id: ObjectId,
  code: String,                 // "DK_KHAI_SINH"
  name: String,
  description: String,
  department: String,

  // CHỈ THAM CHIẾU document_types — KHÔNG tự định nghĩa lại giấy tờ
  checklist: [{
    id: String,                 // "cccd_cha_me" — khoá nội bộ trong thủ tục (gắn với ảnh upload)
    documentTypeCode: String,   // "CCCD" → trỏ document_types.code
    acceptedCodes: [String],    // mã thay thế chấp nhận, vd ["CCCD","CMND","PASSPORT"]
    roleInProcedure: String,    // "CCCD của cha hoặc mẹ"
    quantity: Number,           // số bản cần nộp (vd 2: cha + mẹ)
    isRequired: Boolean,
    conditionalOn: String,      // chỉ cần khi điều kiện nào đó (optional)
    points: Number
  }],

  formFields: [{
    id: String,                 // "hoTenNguoiYeuCau"
    label: String,
    required: Boolean,
    sourceMap: [String]         // ["cccd.hoTen", "hk.chuHo"]
  }],

  // ====== QUY TẮC ĐỐI CHIẾU CHÉO (CrossCheck) — cốt lõi cho thủ tục ĐA GIẤY TỜ ======
  // Khai báo các cặp field phải KHỚP giữa nhiều giấy. Tham chiếu theo checklist.id + field key.
  // (MVP có thể đặt rule trong code/Rule Engine; cấu hình ở đây khi muốn thêm thủ tục không sửa code.)
  crossCheckRules: [{
    name: String,               // "Tên mẹ khớp giữa tờ khai và giấy chứng sinh"
    left: String,               // "to_khai.hoTenMe"   (checklistId.fieldKey)
    right: String,              // "chung_sinh.hoTenMe"
    matchType: Enum("exact", "normalized", "fuzzy"),   // normalized = bỏ dấu/hoa-thường
    tolerance: Number,          // ngưỡng sai khác cho fuzzy (optional)
    severityIfMismatch: Enum("HIGH", "MEDIUM", "LOW"),
    skipIfMissing: String       // bỏ qua rule nếu giấy này thiếu (vd "dkkh" không bắt buộc)
  }],

  // Trọng số chấm điểm — CHỐT giá trị mặc định
  scoringRules: {
    baseScore: Number,          // 100
    penalties: {
      missingRequired: Number,  // -20
      infoMismatch: Number,     // -10
      expiredDoc: Number,       // -15
      lowQualityImage: Number   // -5
    }
  },

  // Cấu hình ưu tiên xử lý (Priority Ranking - bước 10)
  priorityConfig: {
    baseUrgency: Enum("HIGH", "MEDIUM", "LOW"),
    slaDays: Number             // Hạn xử lý mặc định (ngày)
  },

  isActive: Boolean
}
```
**Index:** `{ code: 1 }` unique, `{ isActive: 1 }`.

### 2.4. Collection: `sessions` (Phiên tiền kiểm hồ sơ) — BẢNG QUAN TRỌNG NHẤT
*Toàn bộ vòng đời 1 lần kiểm hồ sơ. Embed `aiResult` (idiomatic MongoDB — 1 lần đọc lấy đủ). **TTL Index** tự hủy.*

```typescript
{
  _id: ObjectId,
  userId: ObjectId,             // Null nếu Guest
  procedureId: ObjectId,        // Ref -> procedures

  status: Enum(
    "INIT", "UPLOADING", "AI_PROCESSING",
    "SCORED", "CONFIRMED", "RECHECKED", "REJECTED"
  ),

  // Theo dõi tiến độ pipeline — NGUỒN SỰ THẬT cho progress bar
  // (Redis chỉ cache lại; mất Redis thì đọc thẳng từ đây)
  pipeline: {
    step: String,               // "LAWGUARD"
    steps: {                    // trạng thái từng bước
      ocr: String, crosscheck: String, score: String,
      lawguard: String, smartform: String
    },                          // mỗi giá trị: "queued|processing|done|failed"
    updatedAt: Date
  },

  // File đính kèm — CHỈ lưu con trỏ, KHÔNG lưu ảnh trong DB
  documents: [{
    docTypeId: String,          // Map với checklist.id
    fileUrl: String,            // Đường dẫn Object Storage tạm
    uploadTime: Date
  }],

  // ====== KẾT QUẢ TỪ AI GATEWAY (embed) ======
  aiResult: {
    // Key ngoài = checklist.id; mỗi field khớp document_types.fields[].key (hết hardcode)
    ocrData: {
      "cccd_cha_me": {
        documentTypeCode: "CCCD",   // trỏ document_types → biết field schema
        provider: "VNPT_EKYC",
        confidence: 0.95,
        fields: {                   // khuôn chung mọi giấy: { value, confidence }
          soCCCD:   { value: "0010xxxxxxx", confidence: 0.97 },
          hoTen:    { value: "NGUYỄN VĂN A", confidence: 0.95 },
          ngaySinh: { value: "01/01/1990",  confidence: 0.96 }
        },
        liveness: true
      }
    },
    crossCheck: {
      // field = key chuẩn trong catalog; docs = các checklist.id liên quan
      mismatches: [{ field: "hoTen", docs: ["cccd_cha_me", "to_khai"], diff: "Sai đệm", severity: "HIGH" }],
      missing: ["giay_chung_sinh"],
      expired: []
    },
    score: {
      total: Number,            // 72
      grade: Enum("A", "B", "C", "D"),
      breakdown: [{ rule: "missingRequired", impact: -20, message: "Thiếu giấy chứng sinh" }],
      canSubmit: Boolean
    },
    lawGuardAlerts: [{
      itemId: String,
      message: String,
      source: { title: "Luật Hộ tịch", article: "Điều 16" },
      confidence: Number,
      needsVerification: Boolean
    }],
    formData: {
      hoTenNguoiYeuCau: { value: "NGUYỄN VĂN A", source: "cccd", confidence: 0.95, editable: true }
    }
  },

  // ====== BƯỚC 9 — GOV RE-CHECK (phía CƠ QUAN, RBAC=OFFICER) ======
  // KHÁC bước 5 (Score): bước 5 cho NGƯỜI DÂN biết "hồ sơ đủ chưa"; bước 9 cho CÁN BỘ
  // biết "có RỦI RO/đáng nghi gì không" trên trạng thái CONFIRMED cuối cùng (dân đã tự sửa form ở b8).
  // Giá trị cốt lõi nằm ở `riskFlags` — thứ KHÔNG hiển thị cho dân ở bước 5.
  govReCheck: {
    completenessLevel: Enum("DAY_DU", "CAN_BO_SUNG", "CAN_KIEM_TRA_KY"),  // xác nhận lại (phụ)
    riskFlags: [{                 // ← GIÁ TRỊ CHÍNH: góc nhìn cơ quan, ẩn với dân
      type: Enum("SUSPECTED_EDIT", "NAME_MISMATCH_MULTI", "FRAUD_SUSPECTED", "MANUAL_REVIEW"),
      message: String,            // "Tên mẹ lệch trên 3 giấy — cần kiểm tra kỹ"
      severity: Enum("HIGH", "MEDIUM", "LOW")
    }],
    reviewedBy: ObjectId,         // userId của OFFICER (ref users)
    reviewedAt: Date
  },

  // ====== BƯỚC 10 — PRIORITY RANKING (xếp thứ tự HỒ SƠ NÀO xử trước trong hàng đợi) ======
  // KHÁC Score: Score = "hồ sơ này TỐT không?" (tuyệt đối, 1 hồ sơ, KHÔNG có thời gian).
  // Priority = "trong cả hàng đợi, xử cái nào TRƯỚC?" (tương đối, có SLA/hạn xử lý).
  // => Hồ sơ điểm 95 nhưng hạn còn 8 ngày có thể xếp SAU hồ sơ điểm 60 mà hạn còn 1 ngày.
  // Priority = f( govReCheck × slaDays còn lại × baseUrgency )  ← yếu tố thời gian là cái Score không có.
  priority: {
    level: Enum("A", "B", "C", "D"),   // A=xử ngay … D=để sau (dùng để SORT hàng đợi cán bộ)
    reason: String,             // "Khai sinh - hạn xử lý còn 2 ngày, hồ sơ đầy đủ"
    slaDeadline: Date,          // hạn xử lý = tiếp nhận + procedures.priorityConfig.slaDays
    finalDecisionByOfficer: String  // quyết định cuối của cán bộ (AI chỉ gợi ý)
  },
  officerNotes: String,

  createdAt: Date,
  updatedAt: Date,

  // BẢO MẬT: TTL Index — tự động xóa
  expiresAt: Date               // = now + SESSION_TTL_HOURS (mặc định 24h)
}
```
**Index:**
- `{ expiresAt: 1 }` với `expireAfterSeconds: 0` → MongoDB hard-delete khi hết hạn.
- `{ status: 1 }` (lọc hồ sơ CONFIRMED cho officer), `{ userId: 1 }`, `{ procedureId: 1 }`.

> **Chốt:** tên field TTL thống nhất là **`expiresAt`** (bỏ `expiredAt`). TTL mặc định **24h**, cấu hình qua env `SESSION_TTL_HOURS` (public demo có thể hạ xuống 0.5 = 30 phút).

### 2.5. Collection: `jobs` (Outbox — backstop bền vững cho hàng đợi AI)
*Đảm bảo KHÔNG mất job khi Redis chết. State của job là nguồn sự thật ở MongoDB; BullMQ chỉ là phương tiện vận chuyển.*

```typescript
{
  _id: ObjectId,
  sessionId: ObjectId,
  type: Enum("OCR", "CROSSCHECK", "LAWGUARD", "SCORE", "SMARTFORM"),
  state: Enum("PENDING", "ENQUEUED", "PROCESSING", "DONE", "FAILED"),
  attempts: Number,             // số lần thử
  payload: Object,              // dữ liệu tối thiểu để xử lý
  lastError: String,
  createdAt: Date,
  updatedAt: Date,
  // TTL nhẹ cho job DONE để dọn rác (vd 24h)
  expiresAt: Date
}
```
**Index:** `{ state: 1, updatedAt: 1 }` (cho reconciler quét PENDING/PROCESSING quá hạn), `{ sessionId: 1 }`, `{ expiresAt: 1 }` TTL.

**Vòng đời (Outbox pattern):**
1. core-svc `insert(job, state=PENDING)` vào MongoDB — **chân lý**.
2. core-svc enqueue BullMQ (Redis) → `update(state=ENQUEUED)`.
3. BullMQ consumer (core-svc) nhận → `PROCESSING` → gọi ai-svc qua gRPC → ghi `aiResult` vào `sessions` → `DONE`.

### 2.6. Collection: `insight_logs` (Kho dữ liệu cho InsightMap)
*Chỉ metadata phi định danh. Tách khỏi `sessions` để lưu lâu dài. **Collection duy nhất sống vĩnh viễn cùng users/procedures.***

```typescript
{
  _id: ObjectId,
  procedureId: ObjectId,
  sessionId: ObjectId,          // trace (nội dung session đã bị xóa)
  errorType: Enum("MISSING_DOC", "INFO_MISMATCH", "EXPIRED_DOC",
                  "LOW_QUALITY_IMG", "LIVENESS_FAIL"),
  severity: Enum("HIGH", "MEDIUM", "LOW"),
  specificDocType: String,      // "cccd"
  finalScore: Number,
  droppedAtStep: String,        // "Upload" | "Score" | "Form"
  processingTimeMs: Number,
  deviceType: Enum("MOBILE", "DESKTOP"),
  createdAt: Date
}
// KHÔNG CHỨA: Tên, số CCCD, hình ảnh, địa chỉ.
```
**Index:** `{ procedureId: 1, errorType: 1 }`, `{ createdAt: 1 }`.

---

## 3. Thiết kế Lược đồ — Vector DB (Qdrant)

> **CHỐT:** dùng **Qdrant** (không phải ChromaDB). Đây là chỉ mục phái sinh — **rebuild được** từ nguồn luật, không phải nguồn sự thật.

### Collection: `legal_chunks`
| Tham số | Giá trị |
|---|---|
| Vector size | **768** (model `sentence-transformers`) |
| Distance | **Cosine** |
| Payload index | `category` (keyword) — filter nhanh theo nhóm thủ tục |

**Cấu trúc mỗi point:**
```python
{
  "id": "luat-ho-tich-2014-dieu16-chunk1",
  "vector": [ /* 768 floats */ ],
  "payload": {
    "chunkId": "luat-ho-tich-2014-dieu16-chunk1",
    "category": "HO_TICH",            # dùng để filter
    "title": "Luật Hộ tịch 2014",
    "article": "Điều 16",
    "url": "https://...",
    "sourceVersion": "2014",          # versioning căn cứ pháp lý
    "text": "<nội dung chunk 300-500 từ>"
  }
}
```

**Cách query (RAG):**
1. Nhận query: *"Quy định về giấy chứng sinh khi đăng ký khai sinh"*.
2. Embedding → vector.
3. `qdrant.search(collection="legal_chunks", query_vector, filter={"category":"HO_TICH"}, limit=top_k)`.

**Bảo mật:** người dùng **không bao giờ ghi** vào Qdrant (chống RAG injection). Chỉ pipeline ingest (do nhóm kiểm soát) mới upsert.

---

## 4. Chiến lược Độ bền & Fallback (Resilience)

> Mục tiêu: **mất Redis hệ thống vẫn đúng, chỉ chậm hơn** — luôn rơi xuống MongoDB.

### 4.1. Redis giữ gì & fallback ra sao
| Redis giữ | Bản gốc ở MongoDB | Khi Redis DOWN |
|---|---|---|
| BullMQ job queue | `jobs` collection | Reconciler đọc `jobs` state=PENDING, xử lý/re-enqueue |
| Pipeline status (progress bar) | `sessions.pipeline` | Frontend poll thẳng `GET /sessions/:id` |
| Cache Top-k LawGuard | (tính lại được) | Query lại Qdrant |
| Cache template/form | `procedures` | Đọc thẳng MongoDB |

### 4.2. Redis key & TTL
| Mục đích | Key pattern | TTL |
|---|---|---|
| Job queue | `bull:ai-pipeline:*` | theo job |
| Pipeline status cache | `session:{id}:status` | 1h |
| Cache Top-k LawGuard | `lawguard:{procedureId}:{queryHash}` | 6–24h |
| Cache template thủ tục | `procedure:{code}` | 24h |

### 4.3. Cache fail-open (bọc mọi lệnh Redis)
Mọi truy cập Redis bọc try/catch — lỗi thì trả miss/no-op, **không ném lỗi lên nghiệp vụ**:
```typescript
async get(key) {
  try { return await redis.get(key); }
  catch (e) { logger.warn('Redis down → fallback Mongo'); return null; }
}
```

### 4.4. Reconciler (cron 30–60s) — chống mất job
```
Quét jobs: state=PENDING quá X giây (chưa enqueue được vì Redis lỗi)
        OR state=PROCESSING quá Y phút (worker chết)
→ Redis sống lại: re-enqueue BullMQ
→ Redis vẫn down: xử lý đồng bộ trực tiếp (degraded mode)
```
Vì state nằm ở MongoDB nên **không job nào biến mất**.

### 4.5. Hai chế độ vận hành
```
        NORMAL                          REDIS DOWN (degraded)
┌──────────────────────┐      ┌──────────────────────────┐
│ status: Redis cache  │      │ status: đọc Mongo trực tiếp│
│ queue:  BullMQ        │      │ queue:  jobs(Mongo)+cron   │
│ cache:  Redis hit     │      │ cache:  query Qdrant lại   │
└──────────────────────┘      └──────────────────────────┘
   nhanh, đầy đủ                  chậm hơn, VẪN ĐÚNG
```

---

## 5. Chính sách Bảo mật Dữ liệu (Data Privacy Policies)

### 5.1. Cơ chế "Tự hủy" (Zero-Retention)
- **MongoDB:** `sessions.expiresAt = now + 24h`; TTL Index hard-delete khi hết hạn.
- **Object Storage:** ảnh CCCD chạy Cronjob xóa mỗi đêm / sau khi session kết thúc.
- **Redis:** mọi key đều có TTL, không giữ PII dài hạn.

### 5.2. Cơ chế "Rút trích Phi định danh" (Anonymization)
Trước khi xóa session, hệ thống đẩy metric (lỗi gì, bao lâu, thiết bị gì) sang `insight_logs` qua hàm `buildInsightLog()` — **whitelist trường + hash 1 chiều `sessionId`**. Strip PII là code, không chỉ comment. `insight_logs` tồn tại vĩnh viễn nhưng **tuyệt đối không có PII**.

### 5.3. RBAC (Role-Based Access Control)
- **CITIZEN:** chỉ đọc `session` do mình tạo (JWT/session cookie).
- **OFFICER:** xem `sessions` trạng thái CONFIRMED để tái kiểm; xem `insight_logs`.
- **ADMIN:** quản lý `procedures`, `users`, cấu hình.
- **AI WORKER:** chỉ UPDATE kết quả vào `sessions`/`jobs`; không DROP/DELETE.

---

## 6. ERD Khái quát (Entity-Relationship)

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "creates (if logged in)"
    PROCEDURES ||--o{ SESSIONS : "defines requirements for"
    DOCUMENT_TYPES ||--o{ PROCEDURES : "referenced by checklist"
    PROCEDURES ||--o{ INSIGHT_LOGS : "has analytics"
    SESSIONS ||--o{ INSIGHT_LOGS : "generates (anonymous)"
    SESSIONS ||--o{ JOBS : "spawns AI jobs"

    DOCUMENT_TYPES {
        ObjectId id PK
        String code "unique (CCCD, GIAY_KHAI_SINH)"
        String category
        Array fields "field schema dùng chung"
        Object validity "hasExpiry, rule"
    }
    SESSIONS {
        ObjectId id PK
        ObjectId userId FK
        ObjectId procedureId FK
        String status
        Object pipeline "progress (source of truth)"
        Object aiResult "OCR, Score, Alerts"
        Object govReCheck "b9: riskFlags (officer)"
        Object priority "b10: A/B/C/D theo SLA"
        Date expiresAt "TTL Index"
    }
    PROCEDURES {
        ObjectId id PK
        String code
        Array checklist "trỏ documentTypeCode"
        Array crossCheckRules "đối chiếu đa giấy"
        Object scoringRules
        Object priorityConfig
    }
    JOBS {
        ObjectId id PK
        ObjectId sessionId FK
        String type
        String state "outbox backstop"
    }
    INSIGHT_LOGS {
        ObjectId id PK
        ObjectId procedureId FK
        String errorType
        String severity
    }
```
*(MongoDB (NoSQL) cho phép embed `aiResult` phức tạp trong `sessions` — không cần tách 4-5 bảng con như SQL, truy vấn nhanh trong 1 lần đọc. `jobs` tách riêng vì có vòng đời + truy vấn (reconciler) khác hẳn session. `document_types` tách riêng vì là **catalog dùng chung** nhiều thủ tục — `procedures.checklist` chỉ tham chiếu `documentTypeCode`, không nhúng.)*

---

## 7. Vận hành / Chạy thử

```bash
# 1. Khởi động toàn stack (web, api-gateway, core-svc, ai-svc + MongoDB/Qdrant/Redis)
docker compose -f infra/docker-compose.yml up --build

# 2. Seed Mongo: tự động chạy khi MongoDB khởi tạo lần đầu qua infra/mongo/init-mongo.js
#    (users mẫu, document_types, procedures MVP)

# 3. Ingest văn bản luật vào Qdrant: ai-svc tự nạp khi khởi động —
#    đọc chunks từ LEGAL_CHUNKS_DIR (mặc định ./data/legal-sources/chunks),
#    tạo collection legal_chunks + payload index nếu chưa có (app/services/hybrid_search.py)
```

Schema core-svc: `apps/core-svc/src/database/schemas/`. Biến môi trường: xem `.env.example` (`SESSION_TTL_HOURS`, `MONGO_URI`, `QDRANT_URL`, `REDIS_HOST`/`REDIS_PORT`).

---

## 8. Quyết định thiết kế đã chốt (đóng Open Issues của SRS)
| # | Quyết định |
|---|---|
| OI-1 | **Qdrant**, collection `legal_chunks`, vector 768, distance Cosine |
| OI-2 | Field TTL **`expiresAt`**, mặc định **24h** (env `SESSION_TTL_HOURS`) |
| OI-3 | **Embed `aiResult`** trong `sessions` (không tách collection con) |
| OI-4 | Penalties mặc định trong `procedures.scoringRules`: -20/-10/-15/-5 |
| OI-5 | (Chính sách mock OCR — ngoài phạm vi DB, xem SRS) |
| OI-6 | **Thêm collection `document_types`** (catalog dùng chung). `procedures.checklist` trỏ `documentTypeCode` thay vì hardcode `acceptedTypes`. OCR result chuẩn hoá theo `fields[].key` của catalog. Đối chiếu đa giấy tờ qua `procedures.crossCheckRules` (MVP có thể đặt rule trong Rule Engine). |
| OI-7 | **Tách `govReCheck` (b9) khỏi `priority` (b10)** trong `sessions`. B9 nhấn `riskFlags` (góc nhìn cơ quan, ẩn với dân — KHÁC Score b5). B10 nhấn `slaDeadline` (xếp thứ tự hồ sơ nào xử trước theo hạn — KHÁC Score vì có yếu tố thời gian). |
| + | **MongoDB là Source of Truth**; thêm `jobs` (outbox) + reconciler để Redis fallback xuống Mongo |
