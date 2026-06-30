import { Injectable, NotFoundException, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientGrpc } from '@nestjs/microservices';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Observable, firstValueFrom } from 'rxjs';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { INSIGHTS_SERVICE_GRPC } from '../../grpc/grpc.constants';

interface InsightsServiceGrpcClient {
  LogInsight(req: {
    procedureId: string; sessionId: string; errorType: string;
    severity: string; finalScore: number;
  }): Observable<{ success: boolean }>;
}

@Injectable()
export class SessionsService implements OnModuleInit {
  private readonly logger = new Logger(SessionsService.name);
  private insightsGrpc: InsightsServiceGrpcClient;

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private readonly config: ConfigService,
    @Inject(INSIGHTS_SERVICE_GRPC) private readonly insightsClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.insightsGrpc = this.insightsClient.getService<InsightsServiceGrpcClient>('InsightsService');
  }

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

    const crossCheck = session.aiResult?.crossCheck as {
      mismatches?: unknown[]; missing?: unknown[];
    } | undefined;

    const procedureId = session.procedureId.toString();
    const sessionId = (session._id as Types.ObjectId).toString();

    const emit = async (errorType: string, severity: string) => {
      try {
        await firstValueFrom(
          this.insightsGrpc.LogInsight({ procedureId, sessionId, errorType, severity, finalScore }),
        );
      } catch (e) {
        this.logger.warn(`InsightLog gRPC failed: ${(e as Error).message}`);
      }
    };

    if (crossCheck?.mismatches?.length) await emit('INFO_MISMATCH', 'HIGH');
    if (crossCheck?.missing?.length) await emit('MISSING_DOC', 'HIGH');
  }
}
