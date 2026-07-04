import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';

type PriorityLevel = 'A' | 'B' | 'C' | 'D';

@Injectable()
export class PriorityService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Procedure.name) private procedureModel: Model<ProcedureDocument>,
  ) {}

  async getQueue() {
    const sessions = await this.sessionModel
      .find({ status: SessionStatus.RECHECKED })
      .populate('procedureId')
      .sort({ createdAt: 1 });

    const ranked = sessions.map(s => {
      const procedure = s.procedureId as unknown as ProcedureDocument;
      const scoreResult = s.aiResult?.score as { score?: number; total?: number, breakdown?: any[] } | undefined;
      const score = scoreResult?.score ?? scoreResult?.total ?? 0;
      const hasCriticalError = scoreResult?.breakdown?.some(b => b.severity === 'CRITICAL') || false;
      const slaDeadline = this.calcSlaDeadline(s, procedure);
      const daysLeft = Math.max(0, (slaDeadline.getTime() - Date.now()) / 86400000);
      const level = this.calcPriority(score, daysLeft, procedure.priorityConfig?.baseUrgency ?? 'MEDIUM', hasCriticalError);

      return {
        sessionId: s._id,
        priority: level,
        reason: hasCriticalError ? 'Lỗi nghiêm trọng' : (score < 60 ? 'Điểm thấp' : `${procedure.name} — hạn xử lý còn ${Math.ceil(daysLeft)} ngày`),
        score,
        slaDeadline,
        submittedAt: s.createdAt,
      };
    });

    // Sắp xếp A → D, trong cùng level thì hạn gần trước
    return ranked.sort((a, b) => {
      const order: PriorityLevel[] = ['A', 'B', 'C', 'D'];
      const diff = order.indexOf(a.priority) - order.indexOf(b.priority);
      if (diff !== 0) return diff;
      return a.slaDeadline.getTime() - b.slaDeadline.getTime();
    });
  }

  private calcSlaDeadline(session: SessionDocument, procedure: ProcedureDocument): Date {
    const slaDays = procedure?.priorityConfig?.slaDays ?? 5;
    const base = session.createdAt ?? new Date();
    return new Date(base.getTime() + slaDays * 86400000);
  }

  private calcPriority(score: number, daysLeft: number, urgency: string, hasCriticalError: boolean): PriorityLevel {
    if (hasCriticalError || score < 60) return 'A'; // Ưu tiên kiểm tra thủ công ngay lập tức để huỷ/trả hồ sơ
    if (daysLeft <= 1 || urgency === 'HIGH') return 'A';
    if (daysLeft <= 3 && score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }
}
