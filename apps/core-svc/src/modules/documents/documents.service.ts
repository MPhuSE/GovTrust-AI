import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { Job, JobDocument, JobType, JobState } from '../../database/schemas/job.schema';
import { AI_TASKS_QUEUE, AiJobName } from '../../queue/ai-tasks.queue';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectQueue(AI_TASKS_QUEUE) private aiQueue: Queue,
  ) {}

  async upload(dto: { sessionId: string; documentTypeCode: string }, file: Express.Multer.File) {
    const session = await this.sessionModel.findById(dto.sessionId);
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    const docRef = {
      docTypeId: dto.documentTypeCode,
      fileUrl: file.path,
      uploadTime: new Date(),
    };

    session.documents.push(docRef);
    session.status = SessionStatus.UPLOADING;
    await session.save();

    return {
      sessionId: dto.sessionId,
      documentTypeCode: dto.documentTypeCode,
      fileName: file.originalname,
      fileSize: file.size,
      status: 'uploaded',
    };
  }

  async triggerOcr(sessionId: string, documentTypeCode: string) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    const doc = session.documents.find(d => d.docTypeId === documentTypeCode);
    if (!doc) throw new NotFoundException('Giấy tờ chưa được upload');

    // Ghi job outbox vào MongoDB trước
    const job = await this.jobModel.create({
      sessionId: new Types.ObjectId(sessionId),
      type: JobType.OCR,
      state: JobState.PENDING,
      payload: { fileUrl: doc.fileUrl, documentTypeCode },
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Enqueue BullMQ
    await this.aiQueue.add(AiJobName.OCR_EXTRACT, {
      jobId: job._id,
      sessionId,
      fileUrl: doc.fileUrl,
      documentTypeCode,
    });

    await this.jobModel.findByIdAndUpdate(job._id, { state: JobState.ENQUEUED });
    session.status = SessionStatus.AI_PROCESSING;
    await session.save();

    return { jobId: job._id, status: 'processing' };
  }
}
