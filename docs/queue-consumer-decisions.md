# Quyết định thiết kế: Queue Consumer (ai-pipeline)

> Tài liệu này ghi lại **các quyết định kiến trúc đã chốt** cho `AiTasksConsumer`
> (`apps/core-svc/src/queue/ai-tasks.consumer.ts`).  
> Cập nhật tài liệu này bất cứ khi nào thay đổi thiết kế consumer.

---

## 1. Tại sao dùng BullMQ (Redis) thay vì gọi gRPC trực tiếp từ HTTP handler?

| Tiêu chí | Gọi trực tiếp (sync) | BullMQ (async) ✅ |
|---|---|---|
| Timeout HTTP | Bị timeout nếu OCR > 30 s | Không ảnh hưởng |
| Retry tự động | Phải tự implement | Cấu hình `attempts: 3, backoff: exponential` |
| Quan sát job | Không có | Job schema → FE poll `/sessions/:id/pipeline` |
| Scale | Bị giới hạn bởi thread NestJS | Worker riêng, có thể scale ngang |

**Kết luận:** Toàn bộ tác vụ AI nặng (`OCR_EXTRACT`, `CROSSCHECK`, `SCORE`, `LAWGUARD`,
`SMARTFORM`, `EMBEDDING`) **phải đi qua queue**; không được gọi gRPC trực tiếp trong HTTP handler.

---

## 2. Danh sách job names và thứ tự thực thi

```
Queue: ai-pipeline   (AI_TASKS_QUEUE)
Options: attempts=3, backoff=exponential(2 s)

Thứ tự pipeline chuẩn:
  1. ocr-extract      → gọi ai-svc.ExtractOCR, ghi ocrData + imageQuality vào session
  2. crosscheck       → ScoringService.runCrosscheckNow, ghi aiResult.crossCheck
  3. lawguard         → ai-svc.CheckLawGuard, ghi aiResult.lawGuardAlerts
  4. score            → ScoringService.runScoreNow, ghi aiResult.score
  5. smartform        → SmartFormService.runGenerateNow, ghi aiResult.smartForm
  6. embedding        → ai-svc.IngestEmbeddings (admin/seed, không gắn session)
  7. insight-report   → Aggregate InsightLog (admin, không gắn session)
```

Jobs 1–5 gắn với một `sessionId`; job 6–7 là admin-only.

---

## 3. Quy tắc ghi trạng thái (tránh race condition)

- **Trước khi xử lý:** `markJob(PROCESSING)` + `setStep(sessionId, step, 'processing')`  
- **Thành công:** `completeJob()` → ghi `Job.state=DONE` + `Job.result` + `pipeline.steps.<step>='done'`  
- **Lỗi có retry còn lại:** `markJob(ENQUEUED)` + `setStep('queued')` → throw để BullMQ retry  
- **Lỗi hết retry:** `markJob(FAILED)` + `setStep('failed')` → throw

Không bao giờ nuốt lỗi (silent catch) — luôn throw sau khi ghi trạng thái để BullMQ tracking đúng.

---

## 4. imageQuality — luồng dữ liệu đã chốt

```
ai-svc (Python)
  OcrService._assess_quality(image_bytes)
    → { isBlurry, brightness, resolution, ocrConfidence }
  OcrResult.image_quality  (dict)

grpc_server.py → pb2.OCRResponse.image_quality = ImageQuality(...)
                                                 ↕ proto: packages/proto/ai_service.proto

AiTasksConsumer.handleOcr()
  res.imageQuality (camelCase từ grpc NestJS client)
  → session.aiResult.ocrData[checklistId].imageQuality
                                 ↕ MongoDB

ScoringService.runScoreNow()
  documents[].imageQuality → ScoreEngine → ImageQualityRule
  (penalty: lowQualityImage, severity: MEDIUM, detail: "Ảnh mờ...")
                                 ↕
  session.aiResult.score.details[] → FE hiển thị cảnh báo
```

**Quy tắc:** `isBlurry=true` (hoặc `ocrConfidence < 0.7`, hoặc `brightness < 0.4`)
→ `ImageQualityRule` áp penalty, FE nhận `passed=false` + message yêu cầu chụp lại.

---

## 5. Mock OCR khi thiếu VNPT key

Khi `VNPT_*` env rỗng, `OcrService.extract()` **không raise** — trả mock `OcrResult` với:
- `fields` theo template của từng `document_type`
- `image_quality` từ `_assess_quality()` thật (dùng OpenCV/Pillow nếu có)
- `avg_confidence` bị giảm nếu ảnh mờ/tối

Trường hợp **vẫn raise**:
- `UnsupportedDocumentType` — loại giấy không có endpoint VNPT (ví dụ `SO_DO`)

---

## 6. Không chốt — việc cần làm nếu thay đổi

| Nếu muốn… | Phải cập nhật |
|---|---|
| Thêm job type mới | `AiJobName` enum + `@Process(...)` handler + Job schema `jobType` enum |
| Thay Redis → RabbitMQ | `queue.module.ts` (`BullModule` → `RmqModule`) + consumer decorator |
| Tách worker process | Tạo `apps/worker/` riêng, import `QueueModule` + `AiTasksConsumer` |
| Thêm loại giấy OCR | `SMARTREADER_ENDPOINTS` + `SMARTREADER_MAPPING` + `_mock_fields` trong `ocr.py` |

---

*Cập nhật lần cuối: 2026-07-02 (NDKien branch)*
