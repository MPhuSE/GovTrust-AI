import { Types } from 'mongoose';
import { JobState, JobType } from '../../database/schemas/job.schema';
import { AI_JOB_OPTIONS, AiJobName } from '../../queue/ai-tasks.queue';
import { ScoringService } from './scoring.service';

describe('ScoringService LawGuard queue', () => {
  const sessionId = new Types.ObjectId().toString();
  const jobId = new Types.ObjectId();
  const procedure = {
    code: 'HKD-01',
    category: 'business',
    checklist: [{ id: 'cccd', roleInProcedure: 'identity' }],
  };

  function setup(queueError?: Error) {
    const sessionQuery = {
      populate: jest.fn().mockResolvedValue({ procedureId: procedure }),
    };
    const sessionModel = {
      findById: jest.fn().mockReturnValue(sessionQuery),
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    };
    const jobModel = {
      create: jest.fn().mockResolvedValue({ _id: jobId }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    };
    const queue = {
      add: queueError ? jest.fn().mockRejectedValue(queueError) : jest.fn().mockResolvedValue({}),
    };
    const service = new ScoringService(
      sessionModel as never,
      {} as never,
      jobModel as never,
      queue as never,
    );
    return { service, sessionModel, jobModel, queue };
  }

  it('writes the outbox before enqueueing LawGuard and returns immediately', async () => {
    const { service, sessionModel, jobModel, queue } = setup();

    await expect(service.lawguard(sessionId)).resolves.toEqual({ jobId, status: 'queued' });

    expect(jobModel.create).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: new Types.ObjectId(sessionId),
      type: JobType.LAWGUARD,
      state: JobState.PENDING,
      payload: {
        procedureCode: 'HKD-01',
        category: 'business',
        checklist: [{ id: 'cccd', roleInProcedure: 'identity' }],
      },
    }));
    expect(queue.add).toHaveBeenCalledWith(AiJobName.LAWGUARD, {
      jobId: String(jobId),
      sessionId,
      procedureCode: 'HKD-01',
      category: 'business',
      checklist: [{ id: 'cccd', roleInProcedure: 'identity' }],
    }, AI_JOB_OPTIONS);
    expect(sessionModel.findByIdAndUpdate).toHaveBeenCalledWith(sessionId, {
      $set: expect.objectContaining({ 'pipeline.steps.lawguard': 'queued' }),
    });
  });

  it('keeps the outbox PENDING if Redis is unavailable', async () => {
    const { service, jobModel } = setup(new Error('ECONNREFUSED'));

    await expect(service.lawguard(sessionId)).resolves.toEqual({ jobId, status: 'queued' });
    expect(jobModel.findByIdAndUpdate).toHaveBeenCalledWith(jobId, {
      $set: { state: JobState.PENDING, lastError: 'Enqueue thất bại: ECONNREFUSED' },
    });
  });
});
