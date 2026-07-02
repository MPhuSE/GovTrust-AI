import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { JobState, JobType } from '../database/schemas/job.schema';
import { AiJobName } from './ai-tasks.queue';
import { JobReconcilerService } from './job-reconciler.service';

describe('JobReconcilerService', () => {
  const updatedAt = new Date('2026-01-01T00:00:00Z');
  const id = new Types.ObjectId();
  const sessionId = new Types.ObjectId();

  function setup(staleJob: Record<string, unknown>) {
    const query = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([staleJob]),
    };
    const jobModel = {
      find: jest.fn().mockReturnValue(query),
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const queue = { add: jest.fn().mockResolvedValue({}) };
    const config = { get: jest.fn((_key: string, fallback: number) => fallback) };
    const service = new JobReconcilerService(
      jobModel as never,
      queue as never,
      config as unknown as ConfigService,
    );
    return { service, jobModel, queue };
  }

  it('atomically claims and republishes a stale PENDING job', async () => {
    const stale = {
      _id: id,
      sessionId,
      type: JobType.OCR,
      state: JobState.PENDING,
      attempts: 0,
      payload: { checklistId: 'cccd', fileUrl: '/tmp/cccd.jpg' },
      updatedAt,
    };
    const { service, jobModel, queue } = setup(stale);
    jobModel.findOneAndUpdate.mockResolvedValue({ ...stale, state: JobState.ENQUEUED });

    await service.reconcile();

    expect(jobModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: id, state: JobState.PENDING, updatedAt },
      { $set: { state: JobState.ENQUEUED } },
      { new: true },
    );
    expect(queue.add).toHaveBeenCalledWith(AiJobName.OCR_EXTRACT, {
      jobId: String(id),
      sessionId: String(sessionId),
      checklistId: 'cccd',
      fileUrl: '/tmp/cccd.jpg',
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  });

  it('returns the claimed job to PENDING when Redis is unavailable', async () => {
    const stale = {
      _id: id,
      sessionId,
      type: JobType.OCR,
      state: JobState.PENDING,
      attempts: 0,
      payload: {},
      updatedAt,
    };
    const { service, jobModel, queue } = setup(stale);
    jobModel.findOneAndUpdate.mockResolvedValue({ ...stale, state: JobState.ENQUEUED });
    queue.add.mockRejectedValue(new Error('ECONNREFUSED'));

    await service.reconcile();

    expect(jobModel.updateOne).toHaveBeenCalledWith(
      { _id: id, state: JobState.ENQUEUED },
      expect.objectContaining({ $set: expect.objectContaining({ state: JobState.PENDING }) }),
    );
  });

  it('marks a stale PROCESSING job FAILED after max attempts', async () => {
    const stale = {
      _id: id,
      sessionId,
      type: JobType.OCR,
      state: JobState.PROCESSING,
      attempts: 3,
      payload: {},
      updatedAt,
    };
    const { service, jobModel, queue } = setup(stale);

    await service.reconcile();

    expect(jobModel.updateOne).toHaveBeenCalledWith(
      { _id: id, state: JobState.PROCESSING, updatedAt },
      { $set: { state: JobState.FAILED, lastError: 'Quá 3 lần xử lý' } },
    );
    expect(queue.add).not.toHaveBeenCalled();
  });
});
