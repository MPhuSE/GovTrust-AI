import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';

import { InsightLogDocument } from '../../database/schemas/insight-log.schema';
import { ProcedureDocument } from '../../database/schemas/procedure.schema';
import { SessionDocument } from '../../database/schemas/session.schema';
import { UserDocument } from '../../database/schemas/user.schema';
import { SessionsService } from './sessions.service';

describe('SessionsService verified identity reuse', () => {
  const procedureId = new Types.ObjectId();
  const userId = new Types.ObjectId();

  let sessionModel: { create: jest.Mock };
  let procedureModel: { findOne: jest.Mock };
  let userModel: { findById: jest.Mock; get: jest.Mock };
  let service: SessionsService;

  function procedureQuery(checklist: unknown[]) {
    const procedure = { _id: procedureId, checklist };
    return {
      select: jest.fn().mockResolvedValue(procedure),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(procedure).then(resolve),
    };
  }

  beforeEach(() => {
    sessionModel = {
      create: jest.fn().mockImplementation(async payload => ({ _id: new Types.ObjectId(), ...payload })),
    };
    procedureModel = { findOne: jest.fn() };
    userModel = {
      // `get` keeps this regression test runnable against the pre-fix constructor,
      // where the fourth dependency was ConfigService.
      get: jest.fn().mockReturnValue(24),
      findById: jest.fn().mockResolvedValue({
        _id: userId,
        kycStatus: 'VERIFIED',
        cccdNumber: '001234567890',
        cccdFullName: 'NGUYEN VAN A',
        cccdBirthDay: '01/01/2000',
        kycVerifiedAt: new Date('2026-07-01T00:00:00.000Z'),
      }),
    };
    const config = { get: jest.fn().mockReturnValue(24) };

    service = new (SessionsService as any)(
      sessionModel as unknown as Model<SessionDocument>,
      { create: jest.fn() } as unknown as Model<InsightLogDocument>,
      procedureModel as unknown as Model<ProcedureDocument>,
      userModel as unknown as Model<UserDocument>,
      config as unknown as ConfigService,
      { deleteSessionFiles: jest.fn() },
    );
  });

  it('seeds the single CCCD checklist slot from a verified user profile', async () => {
    procedureModel.findOne.mockReturnValue(procedureQuery([
      { id: 'cccd', documentTypeCode: 'CCCD', isRequired: true },
      { id: 'don', documentTypeCode: 'DON_DANG_KY', isRequired: true },
    ]));

    await service.create('CAP_GCN', userId.toString());

    expect(sessionModel.create).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      aiResult: {
        ocrData: {
          cccd: expect.objectContaining({
            documentTypeCode: 'CCCD',
            source: 'EKYC_PROFILE',
            fields: {
              soCCCD: { value: '001234567890', confidence: 1 },
              hoTen: { value: 'NGUYEN VAN A', confidence: 1 },
              ngaySinh: { value: '01/01/2000', confidence: 1 },
            },
          }),
        },
      },
    }));
  });

  it('does not guess which party owns the account when a procedure has multiple CCCD slots', async () => {
    procedureModel.findOne.mockReturnValue(procedureQuery([
      { id: 'cccd_ben_ban', documentTypeCode: 'CCCD', isRequired: true },
      { id: 'cccd_ben_mua', documentTypeCode: 'CCCD', isRequired: true },
    ]));

    await service.create('SANG_TEN', userId.toString());

    expect(sessionModel.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ aiResult: expect.anything() }),
    );
  });
});
