import { InjectQueue } from '@nestjs/bull';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bull';
import { Model } from 'mongoose';
import { Job, JobDocument, JobState, JobType } from '../../database/schemas/job.schema';
import { AI_JOB_OPTIONS, AI_TASKS_QUEUE, AiJobName } from '../../queue/ai-tasks.queue';
import { CreateEmbeddingJobDto } from './jobs.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectQueue(AI_TASKS_QUEUE) private readonly queue: Queue,
  ) {}

  createEmbedding(dto: CreateEmbeddingJobDto) {
    return this.enqueue(JobType.EMBEDDING, AiJobName.EMBEDDING, { chunks: dto.chunks });
  }

  createInsightReport(days: number) {
    return this.enqueue(JobType.INSIGHT_REPORT, AiJobName.INSIGHT_REPORT, { days });
  }

  async findOne(id: string) {
    const job = await this.jobModel.findById(id).select('-payload').lean();
    if (!job) throw new NotFoundException('Job không tồn tại');
    return job;
  }

  private async enqueue(type: JobType, name: AiJobName, payload: Record<string, unknown>) {
    const job = await this.jobModel.create({
      type,
      state: JobState.PENDING,
      payload,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    try {
      await this.queue.add(name, { jobId: String(job._id), ...payload }, AI_JOB_OPTIONS);
      await this.jobModel.findByIdAndUpdate(job._id, { $set: { state: JobState.ENQUEUED } });
    } catch (error) {
      await this.jobModel.findByIdAndUpdate(job._id, {
        $set: { state: JobState.PENDING, lastError: `Enqueue thất bại: ${(error as Error).message}` },
      });
    }
    return { jobId: job._id, status: 'queued' };
  }
}

