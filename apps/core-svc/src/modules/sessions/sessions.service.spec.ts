import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';

import { InsightLogDocument } from '../../database/schemas/insight-log.schema';
import { ProcedureDocument } from '../../database/schemas/procedure.schema';
import { SessionDocument } from '../../database/schemas/session.schema';
import { UserDocument } from '../../database/schemas/user.schema';
import { encryptPii } from '../../common/utils/pii-crypto.util';
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
    // Service giải mã cccdNumber bằng decryptPii → mock phải là ciphertext thật.
    process.env.PII_ENCRYPTION_KEY = 'test-pii-key-32-bytes-minimum-000';
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
        cccdNumber: encryptPii('001234567890'),
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

  it('seeds the EKYC checklist slot from a verified user profile', async () => {
    procedureModel.findOne.mockReturnValue(procedureQuery([
      { id: 'cccd_nguoi_yeu_cau', documentTypeCode: 'CCCD', inputMode: 'EKYC', isRequired: true },
      { id: 'don', documentTypeCode: 'DON_DANG_KY', inputMode: 'UPLOAD', isRequired: true },
    ]));

    await service.create('CAP_GCN', userId.toString());

    expect(sessionModel.create).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      aiResult: {
        ocrData: {
          cccd_nguoi_yeu_cau: expect.objectContaining({
            documentTypeCode: 'CCCD',
            source: 'EKYC_PROFILE',
            fields: expect.objectContaining({
              soCCCD: { value: '001234567890', confidence: 1 },
              hoTen: { value: 'NGUYEN VAN A', confidence: 1 },
              ngaySinh: { value: '01/01/2000', confidence: 1 },
            }),
          }),
        },
      },
    }));
  });

  it('chỉ seed slot EKYC (người yêu cầu), KHÔNG seed CCCD của bên khác (phải upload)', async () => {
    // Thủ tục nhiều bên: người yêu cầu (EKYC từ tài khoản) + bên còn lại (tự upload CCCD).
    procedureModel.findOne.mockReturnValue(procedureQuery([
      { id: 'cccd_nguoi_yeu_cau', documentTypeCode: 'CCCD', inputMode: 'EKYC', isRequired: true },
      { id: 'cccd_ben_chuyen', documentTypeCode: 'CCCD', inputMode: 'UPLOAD', isRequired: true },
    ]));

    await service.create('CHUYEN_NHUONG', userId.toString());

    const payload = sessionModel.create.mock.calls[0][0];
    // Seed đúng slot EKYC, và KHÔNG đụng slot upload của bên kia.
    expect(Object.keys(payload.aiResult.ocrData)).toEqual(['cccd_nguoi_yeu_cau']);
    expect(payload.aiResult.ocrData.cccd_ben_chuyen).toBeUndefined();
  });

  it('không seed khi checklist không có slot EKYC nào', async () => {
    procedureModel.findOne.mockReturnValue(procedureQuery([
      { id: 'don', documentTypeCode: 'DON_DANG_KY', inputMode: 'UPLOAD', isRequired: true },
    ]));

    await service.create('CHI_UPLOAD', userId.toString());

    expect(sessionModel.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ aiResult: expect.anything() }),
    );
  });
});
