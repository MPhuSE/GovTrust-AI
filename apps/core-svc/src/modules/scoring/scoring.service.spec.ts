import { Types } from 'mongoose';
import { JobState, JobType } from '../../database/schemas/job.schema';
import { AI_JOB_OPTIONS, AiJobName } from '../../queue/ai-tasks.queue';
import { ScoringService } from './scoring.service';

describe('ScoringService LawGuard queue', () => {
  const sessionId = new Types.ObjectId().toString();
  const jobId = new Types.ObjectId();
  const procedure = {
    code: 'HKD-01',
    name: 'Thủ tục hộ kinh doanh',
    category: 'business',
    checklist: [{ id: 'cccd', roleInProcedure: 'identity' }],
  };

  // LawGuard chỉ chạy cho giấy CÒN THIẾU — mặc định mock crossCheck báo thiếu 'cccd'.
  function setup(queueError?: Error, missingDocuments: string[] = ['cccd']) {
    const sessionQuery = {
      populate: jest.fn().mockResolvedValue({
        procedureId: procedure,
        aiResult: { crossCheck: { missingDocuments } },
      }),
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
      { getService: jest.fn() } as never,
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
        procedureName: 'Thủ tục hộ kinh doanh',
        category: 'business',
        checklist: [{ id: 'cccd', roleInProcedure: 'identity' }],
      },
    }));
    expect(queue.add).toHaveBeenCalledWith(AiJobName.LAWGUARD, {
      jobId: String(jobId),
      sessionId,
      procedureCode: 'HKD-01',
      procedureName: 'Thủ tục hộ kinh doanh',
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

  it('skips LawGuard (no job, empty alerts) when no documents are missing', async () => {
    const { service, sessionModel, jobModel, queue } = setup(undefined, []);

    await expect(service.lawguard(sessionId)).resolves.toEqual({
      jobId: null,
      status: 'skipped',
      reason: 'Đủ giấy tờ — không cần căn cứ pháp lý',
    });

    // Không tạo job, không đẩy queue — chỉ ghi alerts rỗng + đánh dấu bước xong.
    expect(jobModel.create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
    expect(sessionModel.findByIdAndUpdate).toHaveBeenCalledWith(sessionId, {
      $set: expect.objectContaining({
        'aiResult.lawGuardAlerts': [],
        'pipeline.steps.lawguard': 'done',
      }),
    });
  });
});
