import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bull';
import { Model, Types } from 'mongoose';
import { Job, JobDocument, JobState, JobType } from '../database/schemas/job.schema';
import { AI_TASKS_QUEUE, AiJobName } from './ai-tasks.queue';

const JOB_NAMES: Record<JobType, AiJobName> = {
  [JobType.OCR]: AiJobName.OCR_EXTRACT,
  [JobType.CROSSCHECK]: AiJobName.CROSSCHECK,
  [JobType.LAWGUARD]: AiJobName.LAWGUARD,
  [JobType.SCORE]: AiJobName.SCORE,
  [JobType.SMARTFORM]: AiJobName.SMARTFORM,
  [JobType.EMBEDDING]: AiJobName.EMBEDDING,
  [JobType.INSIGHT_REPORT]: AiJobName.INSIGHT_REPORT,
};

function positiveInt(config: ConfigService, key: string, fallback: number) {
  const value = Number(config.get<string | number>(key, fallback));
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/**
 * MongoDB-backed outbox reconciler. The atomic ENQUEUED transition acts as a
 * short lease so that only one core-svc instance republishes a stale job.
 */
@Injectable()
export class JobReconcilerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobReconcilerService.name);
  private readonly intervalMs: number;
  private readonly pendingTimeoutMs: number;
  private readonly processingTimeoutMs: number;
  private readonly maxAttempts: number;
  private readonly batchSize: number;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectQueue(AI_TASKS_QUEUE) private readonly aiQueue: Queue,
    config: ConfigService,
  ) {
    this.intervalMs = positiveInt(config, 'JOB_RECONCILER_INTERVAL_MS', 30_000);
    this.pendingTimeoutMs = positiveInt(config, 'JOB_PENDING_TIMEOUT_MS', 30_000);
    this.processingTimeoutMs = positiveInt(config, 'JOB_PROCESSING_TIMEOUT_MS', 5 * 60_000);
    this.maxAttempts = positiveInt(config, 'JOB_MAX_ATTEMPTS', 3);
    this.batchSize = positiveInt(config, 'JOB_RECONCILER_BATCH_SIZE', 100);
  }

  onModuleInit() {
    this.timer = setInterval(() => void this.reconcile(), this.intervalMs);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async reconcile() {
    if (this.running) return;
    this.running = true;
    try {
      const now = Date.now();
      const staleJobs = await this.jobModel
        .find({
          $or: [
            { state: JobState.PENDING, updatedAt: { $lte: new Date(now - this.pendingTimeoutMs) } },
            { state: JobState.PROCESSING, updatedAt: { $lte: new Date(now - this.processingTimeoutMs) } },
          ],
        })
        .sort({ updatedAt: 1 })
        .limit(this.batchSize)
        .lean()
        .exec();

      for (const job of staleJobs) await this.reconcileJob(job);
    } catch (error) {
      this.logger.error(`Không thể quét outbox: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  private async reconcileJob(job: Job & { _id: Types.ObjectId; updatedAt?: Date }) {
    if (job.state === JobState.PROCESSING && job.attempts >= this.maxAttempts) {
      await this.jobModel.updateOne(
        { _id: job._id, state: JobState.PROCESSING, updatedAt: job.updatedAt },
        { $set: { state: JobState.FAILED, lastError: `Quá ${this.maxAttempts} lần xử lý` } },
      );
      return;
    }

    // Compare updatedAt as well as state: this is an atomic claim across replicas.
    const claimed = await this.jobModel.findOneAndUpdate(
      { _id: job._id, state: job.state, updatedAt: job.updatedAt },
      { $set: { state: JobState.ENQUEUED } },
      { new: true },
    );
    if (!claimed) return;

    try {
      await this.aiQueue.add(JOB_NAMES[claimed.type], {
        jobId: String(claimed._id),
        ...(claimed.sessionId ? { sessionId: String(claimed.sessionId) } : {}),
        ...(claimed.payload ?? {}),
      }, this.queueOptions(claimed.attempts));
      this.logger.log(`Đã re-enqueue job ${claimed._id} (${claimed.type})`);
    } catch (error) {
      await this.jobModel.updateOne(
        { _id: claimed._id, state: JobState.ENQUEUED },
        {
          $set: {
            state: JobState.PENDING,
            lastError: `Re-enqueue thất bại: ${(error as Error).message}`,
          },
        },
      );
      this.logger.warn(`Redis chưa sẵn sàng cho job ${claimed._id}: ${(error as Error).message}`);
    }
  }

  private queueOptions(attemptsMade: number) {
    return {
      attempts: Math.max(1, this.maxAttempts - attemptsMade),
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    };
  }
}
