import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { InsightLog, InsightLogDocument, ErrorType } from '../../database/schemas/insight-log.schema';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(InsightLog.name) private insightModel: Model<InsightLogDocument>,
    private readonly config: ConfigService,
  ) {}

  async create(procedureId: string, userId?: string): Promise<SessionDocument> {
    const ttlHours = this.config.get<number>('SESSION_TTL_HOURS', 24);
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    return this.sessionModel.create({
      procedureId: new Types.ObjectId(procedureId),
      userId: userId ? new Types.ObjectId(userId) : undefined,
      status: SessionStatus.INIT,
      pipeline: { step: 'INIT', steps: {}, updatedAt: new Date() },
      expiresAt,
    });
  }

  async findById(id: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id);
    if (!session) throw new NotFoundException('Phiên không tồn tại hoặc đã hết hạn');
    return session;
  }

  async updatePipeline(sessionId: string, step: string, stepStatus: string) {
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          [`pipeline.steps.${step.toLowerCase()}`]: stepStatus,
          'pipeline.step': step,
          'pipeline.updatedAt': new Date(),
        },
      },
      { new: true },
    );
  }

  async updateStatus(sessionId: string, status: SessionStatus) {
    return this.sessionModel.findByIdAndUpdate(sessionId, { status }, { new: true });
  }

  async confirm(sessionId: string): Promise<SessionDocument> {
    const session = await this.findById(sessionId);
    session.status = SessionStatus.CONFIRMED;
    await session.save();

    // Rút metadata ẩn danh → insight_logs trước khi session hết TTL
    await this.extractInsightLog(session);

    return session;
  }

  private async extractInsightLog(session: SessionDocument) {
    const scoreObj = session.aiResult?.score as { total?: number; score?: number } | undefined;
    const finalScore = scoreObj?.score ?? scoreObj?.total ?? 0;
    if (!finalScore) return;

    // rule-engine CrossCheckResult: checks[].status ('MISMATCH'|'MISSING'...) + missingDocuments[]
    const crossCheck = session.aiResult?.crossCheck as {
      checks?: Array<{ status?: string }>;
      missingDocuments?: unknown[];
    } | undefined;
    const mismatchCount = (crossCheck?.checks ?? []).filter(c => c.status === 'MISMATCH').length;
    const missingCount = (crossCheck?.missingDocuments ?? []).length;

    const procedureId = session.procedureId.toString();
    const sessionId = (session._id as Types.ObjectId).toString();

    const emit = async (errorType: ErrorType, severity: string) => {
      try {
        await this.insightModel.create({
          procedureId: new Types.ObjectId(procedureId),
          sessionId: new Types.ObjectId(sessionId),
          errorType,
          severity,
          finalScore,
        });
      } catch (e) {
        this.logger.warn(`Ghi InsightLog thất bại: ${(e as Error).message}`);
      }
    };

    if (mismatchCount) await emit(ErrorType.INFO_MISMATCH, 'HIGH');
    if (missingCount) await emit(ErrorType.MISSING_DOC, 'HIGH');
  }
}
