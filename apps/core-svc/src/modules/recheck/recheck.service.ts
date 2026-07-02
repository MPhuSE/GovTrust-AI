import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';

type RiskFlagType = 'SUSPECTED_EDIT' | 'NAME_MISMATCH_MULTI' | 'FRAUD_SUSPECTED' | 'MANUAL_REVIEW';
type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

@Injectable()
export class RecheckService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async recheck(sessionId: string, officerId: string) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session || session.status !== SessionStatus.CONFIRMED) {
      throw new NotFoundException('Hồ sơ chưa được xác nhận hoặc không tồn tại');
    }

    const riskFlags = this.detectRisks(session);
    const completenessLevel = riskFlags.some(f => f.severity === 'HIGH')
      ? 'CAN_KIEM_TRA_KY'
      : riskFlags.length > 0
      ? 'CAN_BO_SUNG'
      : 'DAY_DU';

    const govReCheck = {
      completenessLevel,
      riskFlags,
      reviewedBy: new Types.ObjectId(officerId),
      reviewedAt: new Date(),
    };

    await this.sessionModel.findByIdAndUpdate(sessionId, {
      govReCheck,
      status: SessionStatus.RECHECKED,
    });

    return { sessionId, govReCheck };
  }

  private detectRisks(session: SessionDocument): Array<{ type: RiskFlagType; message: string; severity: Severity }> {
    const flags: Array<{ type: RiskFlagType; message: string; severity: Severity }> = [];
    const crossCheck = session.aiResult?.crossCheck as {
      checks?: Array<{ field: string; severity: string; status: string }>;
    } | undefined;

    const mismatches = (crossCheck?.checks ?? []).filter(check => check.status === 'MISMATCH');
    const highMismatches = mismatches.filter(m => m.severity === 'HIGH');

    if (highMismatches.length >= 2) {
      flags.push({
        type: 'NAME_MISMATCH_MULTI',
        message: `${highMismatches.length} trường thông tin quan trọng không khớp — cần kiểm tra kỹ`,
        severity: 'HIGH',
      });
    }

    if (highMismatches.length === 1) {
      flags.push({
        type: 'MANUAL_REVIEW',
        message: `Phát hiện 1 trường thông tin không khớp: ${highMismatches[0].field}`,
        severity: 'MEDIUM',
      });
    }

    return flags;
  }
}
