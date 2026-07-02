import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Model, Types } from 'mongoose';
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

    const docRef = {
      checklistId: dto.checklistId,
      docTypeId: dto.documentTypeCode,
      fileUrl: file.path,
      originalName: file.originalname,
      uploadTime: new Date(),
    };

    // Mỗi vị trí checklist chỉ giữ bản upload mới nhất trong session.
    session.documents = session.documents.filter(doc => doc.checklistId !== dto.checklistId);
    session.documents.push(docRef);
    session.status = SessionStatus.UPLOADING;
    await session.save();

    return {
      sessionId: dto.sessionId,
      checklistId: dto.checklistId,
      documentTypeCode: dto.documentTypeCode,
      fileName: file.originalname,
      fileSize: file.size,
      status: 'uploaded',
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
