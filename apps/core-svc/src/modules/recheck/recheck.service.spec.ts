import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { RecheckService } from './recheck.service';

/** Session giả tối thiểu cho recheck: findById trả trực tiếp (không chain). */
function sessionDoc(overrides: Partial<any> = {}) {
  return {
    _id: new Types.ObjectId(),
    status: SessionStatus.CONFIRMED,
    aiResult: { crossCheck: { checks: [] } },
    ...overrides,
  };
}

function setup(sessionValue: unknown) {
  const findByIdAndUpdate = jest.fn().mockResolvedValue({});
  const model = {
    findById: jest.fn().mockResolvedValue(sessionValue),
    findByIdAndUpdate,
  };
  const service = new RecheckService(model as unknown as Model<SessionDocument>);
  return { service, model, findByIdAndUpdate };
}

const OFFICER_ID = new Types.ObjectId().toString();

describe('RecheckService.recheck', () => {
  it('ném NotFound khi hồ sơ chưa CONFIRMED', async () => {
    const { service } = setup(sessionDoc({ status: SessionStatus.SCORED }));
    await expect(service.recheck('sid', OFFICER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ném NotFound khi session không tồn tại', async () => {
    const { service } = setup(null);
    await expect(service.recheck('sid', OFFICER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('0 mismatch HIGH → DAY_DU, không risk flag', async () => {
    const { service, findByIdAndUpdate } = setup(sessionDoc());
    const res = await service.recheck('sid', OFFICER_ID);
    expect(res.govReCheck.completenessLevel).toBe('DAY_DU');
    expect(res.govReCheck.riskFlags).toHaveLength(0);
    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'sid',
      expect.objectContaining({ status: SessionStatus.RECHECKED }),
    );
  });

  it('1 mismatch HIGH → CAN_BO_SUNG + flag MANUAL_REVIEW (MEDIUM)', async () => {
    const { service } = setup(
      sessionDoc({
        aiResult: { crossCheck: { checks: [{ field: 'hoTen', status: 'MISMATCH', severity: 'HIGH' }] } },
      }),
    );
    const res = await service.recheck('sid', OFFICER_ID);
    expect(res.govReCheck.completenessLevel).toBe('CAN_BO_SUNG');
    expect(res.govReCheck.riskFlags).toHaveLength(1);
    expect(res.govReCheck.riskFlags[0]).toMatchObject({ type: 'MANUAL_REVIEW', severity: 'MEDIUM' });
  });

  it('≥2 mismatch HIGH → CAN_KIEM_TRA_KY + flag NAME_MISMATCH_MULTI (HIGH)', async () => {
    const { service } = setup(
      sessionDoc({
        aiResult: {
          crossCheck: {
            checks: [
              { field: 'hoTen', status: 'MISMATCH', severity: 'HIGH' },
              { field: 'ngaySinh', status: 'MISMATCH', severity: 'HIGH' },
            ],
          },
        },
      }),
    );
    const res = await service.recheck('sid', OFFICER_ID);
    expect(res.govReCheck.completenessLevel).toBe('CAN_KIEM_TRA_KY');
    expect(res.govReCheck.riskFlags[0]).toMatchObject({ type: 'NAME_MISMATCH_MULTI', severity: 'HIGH' });
  });

  it('lưu quyết định + ghi chú của cán bộ', async () => {
    const { service, findByIdAndUpdate } = setup(sessionDoc());
    await service.recheck('sid', OFFICER_ID, 'NEED_MORE', 'Thiếu giấy xác nhận cư trú');
    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'sid',
      expect.objectContaining({
        officerNotes: 'Thiếu giấy xác nhận cư trú',
        'priority.finalDecisionByOfficer': 'NEED_MORE',
      }),
    );
  });
});
