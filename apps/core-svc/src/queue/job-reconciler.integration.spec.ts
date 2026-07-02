import { ConfigService } from '@nestjs/config';
import Bull, { Queue } from 'bull';
import { createConnection, Model, Types } from 'mongoose';
import { Job, JobDocument, JobSchema, JobState, JobType } from '../database/schemas/job.schema';
import { JobReconcilerService } from './job-reconciler.service';

const integration = process.env.RUN_RECONCILER_INTEGRATION === 'true' ? describe : describe.skip;

integration('JobReconcilerService MongoDB + Redis', () => {
  let model: Model<JobDocument>;
  let queue: Queue;
  let connection: Awaited<ReturnType<typeof createConnection>>;

  const config = {
    get: (key: string, fallback: number) => ({
      JOB_PENDING_TIMEOUT_MS: 1,
      JOB_PROCESSING_TIMEOUT_MS: 1,
      JOB_RECONCILER_BATCH_SIZE: 10,
      JOB_MAX_ATTEMPTS: 3,
    }[key] ?? fallback),
  } as ConfigService;

  beforeAll(async () => {
    connection = createConnection(
      process.env.RECONCILER_MONGO_URI ?? 'mongodb://localhost:27019/govtrust_reconciler_test',
    );
    await connection.asPromise();
    model = connection.model(Job.name, JobSchema) as unknown as Model<JobDocument>;
    queue = new Bull(`reconciler-integration-${Date.now()}`, {
      redis: {
        host: process.env.RECONCILER_REDIS_HOST ?? 'localhost',
        port: Number(process.env.RECONCILER_REDIS_PORT ?? 6379),
      },
    });
  }, 30_000);

  afterAll(async () => {
    if (queue) {
      await queue.empty();
      await queue.close();
    }
    if (connection) {
      await connection.dropDatabase();
      await connection.close();
    }
  }, 30_000);

  it('keeps Mongo PENDING during outage then republishes when Redis recovers', async () => {
    const outbox = await model.create({
      sessionId: new Types.ObjectId(),
      type: JobType.OCR,
      state: JobState.PENDING,
      attempts: 0,
      payload: { checklistId: 'cccd', fileUrl: '/tmp/test.jpg', documentTypeCode: 'CCCD' },
      expiresAt: new Date(Date.now() + 60_000),
    });
    await model.collection.updateOne(
      { _id: outbox._id as Types.ObjectId },
      { $set: { updatedAt: new Date(Date.now() - 10_000) } },
    );

    const unavailableQueue = { add: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) };
    await new JobReconcilerService(model, unavailableQueue as never, config).reconcile();
    expect((await model.findById(outbox._id))?.state).toBe(JobState.PENDING);

    await model.collection.updateOne(
      { _id: outbox._id as Types.ObjectId },
      { $set: { updatedAt: new Date(Date.now() - 10_000) } },
    );
    await new JobReconcilerService(model, queue, config).reconcile();

    expect((await model.findById(outbox._id))?.state).toBe(JobState.ENQUEUED);
    const waiting = await queue.getWaiting();
    expect(waiting.some(item => item.data.jobId === String(outbox._id))).toBe(true);
  });
});
