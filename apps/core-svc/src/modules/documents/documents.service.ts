import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Model, Types } from 'mongoose';
import { readFile, unlink } from 'fs/promises';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { Job, JobDocument, JobType, JobState } from '../../database/schemas/job.schema';
import { AI_JOB_OPTIONS, AI_TASKS_QUEUE, AiJobName } from '../../queue/ai-tasks.queue';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Procedure.name) private procedureModel: Model<ProcedureDocument>,
    @InjectQueue(AI_TASKS_QUEUE) private aiQueue: Queue,
  ) {}

  async upload(
    dto: { sessionId: string; documentTypeCode: string; checklistId: string },
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Vui lòng chọn file giấy tờ');
    const session = await this.sessionModel.findById(dto.sessionId);
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    const procedure = await this.procedureModel.findById(session.procedureId);
    const slot = procedure?.checklist?.find(item => item.id === dto.checklistId);
    if (!slot) throw new BadRequestException('Giấy tờ không thuộc checklist của thủ tục');
    const acceptedCodes = [slot.documentTypeCode, ...(slot.acceptedCodes ?? [])];
    if (!acceptedCodes.includes(dto.documentTypeCode)) {
      throw new BadRequestException('Loại giấy tờ không phù hợp vị trí checklist');
    }
    if (slot.inputMode === 'REFERENCE') {
      throw new BadRequestException('Vị trí này được hệ thống cung cấp, không cần upload');
    }
    const existingEvidence = (session.aiResult?.ocrData as Record<string, unknown> | undefined)?.[dto.checklistId];
    if (slot.inputMode === 'EKYC' && existingEvidence) {
      throw new BadRequestException('CCCD đã được xác minh từ tài khoản, không cần upload lại');
    }

    // Lưu tham chiếu file vào session
    const docRef = {
      checklistId: dto.checklistId,
      docTypeId: dto.documentTypeCode,
      fileUrl: file.path || '',
      originalName: file.originalname,
      uploadTime: new Date(),
    };
    session.documents = session.documents.filter(doc => doc.checklistId !== dto.checklistId);
    session.documents.push(docRef);
    session.status = SessionStatus.UPLOADING;
    await session.save();

    // ── OCR ngay tại đây (không cần bước triggerOcr riêng) ──
    let ocrResult: Record<string, any> = {};
    // Sentinel: slot CHỈ được nhận khi OCR trích được field hợp lệ. Mọi lý do khác
    // (sai loại 422, không đọc được 5xx, ai-svc lỗi, 0 field) → set rejectReason rồi
    // rollback + throw SAU try/catch (KHÔNG throw trong try vì bị catch nuốt).
    let rejectReason: string | null = null;
    const GENERIC_REJECT =
      'Không đọc được thông tin từ ảnh. Vui lòng chụp/tải lại ảnh rõ nét, đúng loại giấy tờ đã chọn.';
    try {
      // Multer dùng disk storage (MulterModule dest) → file.buffer UNDEFINED, chỉ có file.path.
      // Đọc bytes từ đĩa; fallback file.buffer nếu cấu hình memoryStorage. Trước đây dùng
      // thẳng file.buffer → gửi bytes rỗng sang ai-svc → PIL "cannot identify image" → VNPT 400.
      const fileBytes = file.buffer ?? (file.path ? await readFile(file.path) : undefined);
      if (!fileBytes || fileBytes.length === 0) {
        throw new Error('Không đọc được nội dung file upload (buffer/path đều rỗng)');
      }
      const formData = new FormData();
      const uint8 = new Uint8Array(fileBytes);
      const blob = new Blob([uint8], { type: file.mimetype });
      formData.append('file', blob, file.originalname);
      formData.append('document_type_code', dto.documentTypeCode);
      formData.append('checklist_id', dto.checklistId);

      const res = await fetch('http://localhost:8000/api/v1/ocr/extract', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const fields = (data.extractedFields ?? data.fields ?? {}) as Record<string, unknown>;
        // Đếm field OCR đọc được CÓ GIÁ TRỊ. 0 field = ảnh rác/không đọc được dù HTTP 200
        // (vd VNPT trả object rỗng) → KHÔNG nhận slot, buộc upload lại.
        const filledCount = Object.values(fields).filter(f => {
          const v = (f as { value?: unknown } | null)?.value;
          return typeof v === 'string' ? v.trim() !== '' && v.trim() !== '-' : v != null;
        }).length;

        if (filledCount === 0) {
          rejectReason = GENERIC_REJECT;
        } else {
          // Khớp shape với async consumer (ai-tasks.consumer.ts): scoring/masking đọc
          // `documentTypeCode` — trước lưu key `documentType` nên docType luôn undefined.
          ocrResult = {
            documentTypeCode: dto.documentTypeCode,
            provider: data.provider,
            fields,
            confidence: data.avgConfidence ?? data.confidence ?? 0,
            imageQuality: data.imageQuality,
            extractedAt: new Date(),
          };
          // Ghi kết quả OCR vào session — dùng $set dot-notation (atomic).
          // KHÔNG mutate session.aiResult.ocrData[...] rồi save(): aiResult là Mixed (type: Object),
          // Mongoose không track thay đổi nested Mixed nên save() bỏ qua path này → OCR mất hút.
          await this.sessionModel.updateOne(
            { _id: dto.sessionId },
            {
              $set: {
                [`aiResult.ocrData.${dto.checklistId}`]: ocrResult,
                status: SessionStatus.AI_PROCESSING,
              },
            },
          );
        }
      } else if (res.status === 422) {
        // Ảnh SAI loại giấy tờ (vd chọn Giấy kết hôn nhưng ảnh là sổ hộ khẩu).
        let detail = 'Ảnh không đúng loại giấy tờ đã chọn. Vui lòng tải lại ảnh đúng.';
        try {
          const body = await res.json();
          if (body?.detail) detail = String(body.detail);
        } catch { /* giữ message mặc định */ }
        rejectReason = detail;
      } else {
        // 5xx/4xx khác: VNPT/Qwen từ chối ảnh, thiếu token, ảnh không đọc được...
        // Không đọc được dữ liệu = KHÔNG nhận slot (trước đây chỉ warn rồi vẫn giữ file → bug).
        console.warn(`OCR failed for ${dto.documentTypeCode}: HTTP ${res.status}`);
        rejectReason = GENERIC_REJECT;
      }
    } catch (err) {
      // Lỗi mạng/timeout tới ai-svc → không xác nhận được ảnh hợp lệ → KHÔNG nhận slot.
      console.warn('OCR inline error:', err);
      rejectReason = GENERIC_REJECT;
    }

    // Ảnh không hợp lệ (sai loại / không đọc được / ai-svc lỗi) → rollback: xóa file vật lý
    // + gỡ docRef khỏi session + revert status, rồi throw để frontend buộc chọn ảnh khác.
    // KHÔNG giữ lại file/OCR rác, KHÔNG cho pipeline chạy tiếp với ảnh không đọc được.
    if (rejectReason) {
      if (file.path) await unlink(file.path).catch(() => undefined);
      await this.sessionModel.updateOne(
        { _id: dto.sessionId },
        {
          $pull: { documents: { checklistId: dto.checklistId } },
          $unset: { [`aiResult.ocrData.${dto.checklistId}`]: '' },
          $set: { status: SessionStatus.UPLOADING },
        },
      );
      throw new UnprocessableEntityException(rejectReason);
    }

    return {
      sessionId: dto.sessionId,
      checklistId: dto.checklistId,
      documentTypeCode: dto.documentTypeCode,
      fileName: file.originalname,
      fileSize: file.size,
      status: ocrResult.fields ? 'ocr_done' : 'uploaded',
      ocrData: ocrResult.fields,
      confidence: ocrResult.confidence,
    };
  }

  async triggerOcr(sessionId: string, documentTypeCode: string, checklistId: string) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    const doc = [...session.documents]
      .reverse()
      .find(d => d.checklistId === checklistId && d.docTypeId === documentTypeCode);
    if (!doc) throw new NotFoundException('Giấy tờ chưa được upload');

    const key = checklistId;

    // Ghi job outbox vào MongoDB trước (Outbox pattern — Redis chết không mất job)
    const job = await this.jobModel.create({
      sessionId: new Types.ObjectId(sessionId),
      type: JobType.OCR,
      state: JobState.PENDING,
      payload: { fileUrl: doc.fileUrl, documentTypeCode, checklistId: key },
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Redis có thể tạm thời unavailable. Job vẫn ở PENDING để reconciler gửi lại.
    try {
      await this.aiQueue.add(AiJobName.OCR_EXTRACT, {
        jobId: String(job._id),
        sessionId,
        checklistId: key,
        fileUrl: doc.fileUrl,
        documentTypeCode,
      }, AI_JOB_OPTIONS);
      await this.jobModel.findByIdAndUpdate(job._id, { state: JobState.ENQUEUED });
    } catch (error) {
      await this.jobModel.findByIdAndUpdate(job._id, {
        $set: { state: JobState.PENDING, lastError: `Enqueue thất bại: ${(error as Error).message}` },
      });
    }
    session.status = SessionStatus.AI_PROCESSING;
    await session.save();

    return { jobId: job._id, status: 'processing' };
  }
}
