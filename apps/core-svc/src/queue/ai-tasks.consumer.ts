import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientGrpc } from '@nestjs/microservices';
import { Job as BullJob } from 'bull';
import { Model, Types } from 'mongoose';
import { readFile } from 'fs/promises';
import { firstValueFrom, Observable } from 'rxjs';
import { Session, SessionDocument } from '../database/schemas/session.schema';
import { Job, JobDocument, JobState } from '../database/schemas/job.schema';
import { AI_SERVICE_GRPC } from '../grpc/grpc.constants';
import { AI_TASKS_QUEUE, AiJobName } from './ai-tasks.queue';

interface OcrGrpcResponse {
  checklistId: string;
  provider: string;
  fields: Record<string, { value: string; confidence: number }>;
  avgConfidence: number;
  liveness: boolean;
  processingTimeMs: number;
}
interface AiServiceGrpcClient {
  ExtractOCR(req: {
    checklistId: string;
    documentTypeCode: string;
    imageData: Buffer;
    runLiveness: boolean;
  }): Observable<OcrGrpcResponse>;
}

interface OcrJobData {
  jobId: string;
  sessionId: string;
  checklistId: string;
  fileUrl: string;
  documentTypeCode: string;
}

/**
 * Consumer BullMQ cho pipeline AI (tác vụ bất đồng bộ).
 * Đây là mảnh ĐANG THIẾU: trước đây documents.service enqueue OCR_EXTRACT
 * nhưng không có ai xử lý. Consumer này gọi ai-svc qua gRPC rồi ghi ocrData
 * vào session (MongoDB = nguồn sự thật). Cập nhật pipeline.steps để FE poll.
 */
@Processor(AI_TASKS_QUEUE)
export class AiTasksConsumer implements OnModuleInit {
  private readonly logger = new Logger(AiTasksConsumer.name);
  private aiGrpc: AiServiceGrpcClient;

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @Inject(AI_SERVICE_GRPC) private readonly aiClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.aiGrpc = this.aiClient.getService<AiServiceGrpcClient>('AIService');
  }

  @Process(AiJobName.OCR_EXTRACT)
  async handleOcr(job: BullJob<OcrJobData>) {
    const { jobId, sessionId, checklistId, fileUrl, documentTypeCode } = job.data;
    await this.markJob(jobId, JobState.PROCESSING);
    await this.setStep(sessionId, 'ocr', 'processing');

    try {
      const imageData = await readFile(fileUrl).catch(() => Buffer.alloc(0));
      const res = await firstValueFrom(
        this.aiGrpc.ExtractOCR({ checklistId, documentTypeCode, imageData, runLiveness: false }),
      );

      // Ghi ocrData theo checklistId (khớp shape session.aiResult.ocrData + rule-engine)
      await this.sessionModel.findByIdAndUpdate(sessionId, {
        $set: {
          [`aiResult.ocrData.${checklistId}`]: {
            documentTypeCode,
            provider: res.provider,
            confidence: res.avgConfidence,
            fields: res.fields,
            liveness: res.liveness,
          },
          'pipeline.steps.ocr': 'done',
          'pipeline.step': 'OCR',
          'pipeline.updatedAt': new Date(),
        },
      });
      await this.markJob(jobId, JobState.DONE);
      return { ok: true, checklistId };
    } catch (e) {
      this.logger.error(`OCR job lỗi (session ${sessionId}): ${(e as Error).message}`);
      await this.markJob(jobId, JobState.FAILED, (e as Error).message);
      await this.setStep(sessionId, 'ocr', 'failed');
      throw e;
    }
  }

  private async markJob(jobId: string, state: JobState, lastError?: string) {
    if (!jobId) return;
    await this.jobModel
      .findByIdAndUpdate(jobId, { state, ...(lastError ? { lastError } : {}), $inc: { attempts: 1 } })
      .catch(() => undefined);
  }

  private async setStep(sessionId: string, step: string, status: string) {
    await this.sessionModel
      .findByIdAndUpdate(sessionId, {
        $set: { [`pipeline.steps.${step}`]: status, 'pipeline.updatedAt': new Date() },
      })
      .catch(() => undefined);
  }
}
