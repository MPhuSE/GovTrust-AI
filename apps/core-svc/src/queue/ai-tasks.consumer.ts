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
import { InsightLog, InsightLogDocument } from '../database/schemas/insight-log.schema';
import { AI_SERVICE_GRPC } from '../grpc/grpc.constants';
import { ScoringService } from '../modules/scoring/scoring.service';
import { SmartFormService } from '../modules/smartform/smartform.service';
import { AI_TASKS_QUEUE, AiJobName } from './ai-tasks.queue';
import { PipelineEventsGateway } from './pipeline-events.gateway';

interface OcrGrpcResponse {
  checklistId: string;
  provider: string;
  fields: Record<string, { value: string; confidence: number }>;
  avgConfidence: number;
  liveness: boolean;
  processingTimeMs: number;
  imageQuality?: {
    isBlurry?: boolean;
    brightness?: number;
    resolution?: string;
    ocrConfidence?: number;
  };
}
interface AiServiceGrpcClient {
  ExtractOCR(req: {
    checklistId: string;
    documentTypeCode: string;
    imageData: Buffer;
    runLiveness: boolean;
  }): Observable<OcrGrpcResponse>;
  CheckLawGuard(req: {
    procedureCode: string;
    category: string;
    checklist: Array<{ id: string; roleInProcedure: string }>;
  }): Observable<{ alerts: unknown[]; disclaimer: string }>;
  IngestEmbeddings(req: { chunks: EmbeddingChunk[] }): Observable<{
    ingested: number;
    model: string;
    dimension: number;
  }>;
}

interface OcrJobData {
  jobId: string;
  sessionId: string;
  checklistId: string;
  fileUrl: string;
  documentTypeCode: string;
}

interface LawGuardJobData {
  jobId: string;
  sessionId: string;
  procedureCode: string;
  category: string;
  checklist: Array<{ id: string; roleInProcedure: string }>;
}

interface EmbeddingChunk {
  chunkId: string;
  text: string;
  title: string;
  article: string;
  url: string;
  sourceVersion: string;
  category: string;
}

interface EmbeddingJobData { jobId: string; chunks: EmbeddingChunk[] }
interface InsightReportJobData { jobId: string; days: number }
interface SessionJobData { jobId: string; sessionId: string }
interface SmartFormJobData extends SessionJobData { overrides?: Record<string, string> }

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
    @InjectModel(InsightLog.name) private insightModel: Model<InsightLogDocument>,
    @Inject(AI_SERVICE_GRPC) private readonly aiClient: ClientGrpc,
    private readonly events: PipelineEventsGateway,
    private readonly scoringService: ScoringService,
    private readonly smartFormService: SmartFormService,
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
            imageQuality: {
              isBlurry: Boolean(res.imageQuality?.isBlurry),
              brightness: Number(res.imageQuality?.brightness ?? 0),
              resolution: res.imageQuality?.resolution ?? '',
              ocrConfidence: Number(res.imageQuality?.ocrConfidence ?? res.avgConfidence),
            },
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
      const retrying = this.hasRetry(job);
      await this.markJob(jobId, retrying ? JobState.ENQUEUED : JobState.FAILED, (e as Error).message);
      await this.setStep(sessionId, 'ocr', retrying ? 'queued' : 'failed');
      throw e;
    }
  }

  @Process(AiJobName.LAWGUARD)
  async handleLawGuard(job: BullJob<LawGuardJobData>) {
    const { jobId, sessionId, procedureCode, category, checklist } = job.data;
    await this.markJob(jobId, JobState.PROCESSING);
    await this.setStep(sessionId, 'lawguard', 'processing');

    try {
      const result = await firstValueFrom(
        this.aiGrpc.CheckLawGuard({ procedureCode, category, checklist }),
      );
      const alerts = result.alerts ?? [];
      await this.sessionModel.findByIdAndUpdate(sessionId, {
        $set: {
          'aiResult.lawGuardAlerts': alerts,
          'aiResult.lawGuardDisclaimer': result.disclaimer,
          'pipeline.steps.lawguard': 'done',
          'pipeline.step': 'LAWGUARD',
          'pipeline.updatedAt': new Date(),
        },
      });
      await this.markJob(jobId, JobState.DONE);
      return { ok: true, alerts: alerts.length };
    } catch (error) {
      this.logger.error(`LawGuard job lỗi (session ${sessionId}): ${(error as Error).message}`);
      const retrying = this.hasRetry(job);
      await this.markJob(jobId, retrying ? JobState.ENQUEUED : JobState.FAILED, (error as Error).message);
      await this.setStep(sessionId, 'lawguard', retrying ? 'queued' : 'failed');
      throw error;
    }
  }

  @Process(AiJobName.CROSSCHECK)
  async handleCrosscheck(job: BullJob<SessionJobData>) {
    const { jobId, sessionId } = job.data;
    await this.markJob(jobId, JobState.PROCESSING);
    await this.setStep(sessionId, 'crosscheck', 'processing');

    try {
      const result = await this.scoringService.runCrosscheckNow(sessionId);
      await this.completeJob(jobId, result as unknown as Record<string, unknown>);
      return result;
    } catch (error) {
      this.logger.error(`CrossCheck job lỗi (session ${sessionId}): ${(error as Error).message}`);
      const retrying = this.hasRetry(job);
      await this.markJob(jobId, retrying ? JobState.ENQUEUED : JobState.FAILED, (error as Error).message);
      await this.setStep(sessionId, 'crosscheck', retrying ? 'queued' : 'failed');
      throw error;
    }
  }

  @Process(AiJobName.SCORE)
  async handleScore(job: BullJob<SessionJobData>) {
    const { jobId, sessionId } = job.data;
    await this.markJob(jobId, JobState.PROCESSING);
    await this.setStep(sessionId, 'score', 'processing');

    try {
      const result = await this.scoringService.runScoreNow(sessionId);
      await this.completeJob(jobId, result as unknown as Record<string, unknown>);
      return result;
    } catch (error) {
      this.logger.error(`Score job lỗi (session ${sessionId}): ${(error as Error).message}`);
      const retrying = this.hasRetry(job);
      await this.markJob(jobId, retrying ? JobState.ENQUEUED : JobState.FAILED, (error as Error).message);
      await this.setStep(sessionId, 'score', retrying ? 'queued' : 'failed');
      throw error;
    }
  }

  @Process(AiJobName.SMARTFORM)
  async handleSmartForm(job: BullJob<SmartFormJobData>) {
    const { jobId, sessionId, overrides = {} } = job.data;
    await this.markJob(jobId, JobState.PROCESSING);
    await this.setStep(sessionId, 'smartform', 'processing');

    try {
      const result = await this.smartFormService.runGenerateNow(sessionId, overrides);
      await this.completeJob(jobId, result as Record<string, unknown>);
      return result;
    } catch (error) {
      this.logger.error(`SmartForm job lỗi (session ${sessionId}): ${(error as Error).message}`);
      const retrying = this.hasRetry(job);
      await this.markJob(jobId, retrying ? JobState.ENQUEUED : JobState.FAILED, (error as Error).message);
      await this.setStep(sessionId, 'smartform', retrying ? 'queued' : 'failed');
      throw error;
    }
  }

  @Process(AiJobName.EMBEDDING)
  async handleEmbedding(job: BullJob<EmbeddingJobData>) {
    const { jobId, chunks } = job.data;
    await this.markJob(jobId, JobState.PROCESSING);
    try {
      const result = await firstValueFrom(this.aiGrpc.IngestEmbeddings({ chunks }));
      await this.completeJob(jobId, result);
      return result;
    } catch (error) {
      await this.markJob(
        jobId,
        this.hasRetry(job) ? JobState.ENQUEUED : JobState.FAILED,
        (error as Error).message,
      );
      throw error;
    }
  }

  @Process(AiJobName.INSIGHT_REPORT)
  async handleInsightReport(job: BullJob<InsightReportJobData>) {
    const { jobId, days } = job.data;
    await this.markJob(jobId, JobState.PROCESSING);
    try {
      const since = new Date(Date.now() - days * 86_400_000);
      const [topErrors, procedureStats, trend, avg] = await Promise.all([
        this.insightModel.aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: '$errorType', count: { $sum: 1 }, avgScore: { $avg: '$finalScore' } } },
          { $sort: { count: -1 } }, { $limit: 10 },
        ]),
        this.insightModel.aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: '$procedureId', totalSessions: { $sum: 1 }, avgScore: { $avg: '$finalScore' }, errorCount: { $sum: 1 } } },
          { $sort: { errorCount: -1 } },
        ]),
        this.insightModel.aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, avgScore: { $avg: '$finalScore' } } },
          { $sort: { _id: 1 } },
        ]),
        this.insightModel.aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: null, value: { $avg: '$finalScore' } } },
        ]),
      ]);
      const result = {
        period: { since, until: new Date() },
        topErrors,
        procedureStats,
        trend,
        avgScore: avg[0]?.value ?? 0,
      };
      await this.completeJob(jobId, result);
      return result;
    } catch (error) {
      await this.markJob(
        jobId,
        this.hasRetry(job) ? JobState.ENQUEUED : JobState.FAILED,
        (error as Error).message,
      );
      throw error;
    }
  }

  private async markJob(jobId: string, state: JobState, lastError?: string) {
    if (!jobId) return;
    const update = {
      $set: { state, ...(lastError ? { lastError } : {}) },
      ...(state === JobState.PROCESSING ? { $inc: { attempts: 1 } } : {}),
    };
    await this.jobModel
      .findByIdAndUpdate(jobId, update)
      .catch(() => undefined);
    this.events.publishJob(jobId, state);
  }

  private async setStep(sessionId: string, step: string, status: string) {
    await this.sessionModel
      .findByIdAndUpdate(sessionId, {
        $set: { [`pipeline.steps.${step}`]: status, 'pipeline.updatedAt': new Date() },
      })
      .catch(() => undefined);
    this.events.publishSession(sessionId, step, status);
  }

  private hasRetry(job: BullJob) {
    return job.attemptsMade + 1 < (job.opts.attempts ?? 1);
  }

  private async completeJob(jobId: string, result: Record<string, unknown>) {
    await this.jobModel.findByIdAndUpdate(jobId, {
      $set: { state: JobState.DONE, result },
      $unset: { lastError: 1 },
    });
    this.events.publishJob(jobId, JobState.DONE, result);
  }
}
