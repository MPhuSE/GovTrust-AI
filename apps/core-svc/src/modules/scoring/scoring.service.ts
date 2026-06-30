import { Injectable, NotFoundException, OnModuleInit, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientGrpc } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { Observable, firstValueFrom } from 'rxjs';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';
import { CrossChecker, ScoreEngine } from '@govtrust/rule-engine';
import { AI_SERVICE_GRPC } from '../../grpc/grpc.constants';

interface LegalAlert {
  type: string; message: string; confidence: number;
  needsVerification: boolean; sourceTitle: string; sourceArticle: string; sourceUrl: string;
}
interface AIServiceGrpcClient {
  CheckLawGuard(req: { procedureCode: string; category: string; checklist: unknown[] }): Observable<{ alerts: LegalAlert[]; disclaimer: string }>;
}

@Injectable()
export class ScoringService implements OnModuleInit {
  private aiGrpc: AIServiceGrpcClient;

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Procedure.name) private procedureModel: Model<ProcedureDocument>,
    @Inject(AI_SERVICE_GRPC) private readonly aiClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.aiGrpc = this.aiClient.getService<AIServiceGrpcClient>('AIService');
  }

  async crosscheck(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId).populate('procedureId');
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    const procedure = session.procedureId as unknown as ProcedureDocument;
    const ocrData = session.aiResult?.ocrData as Record<string, unknown> ?? {};

    // Chuyển ocrData thành ExtractedDocument[]
    const documents = Object.entries(ocrData).map(([checklistId, data]) => {
      const d = data as { documentTypeCode: string; fields: Record<string, { value: string; confidence: number }> };
      return {
        checklistId,
        documentTypeCode: d.documentTypeCode,
        fields: d.fields ?? {},
      };
    });

    const checker = new CrossChecker();
    const crosscheckResult = checker.run(
      {
        code: procedure.code,
        name: procedure.name,
        checklist: procedure.checklist,
        crossCheckRules: procedure.crossCheckRules,
        scoringRules: procedure.scoringRules,
      },
      documents,
    );

    await this.sessionModel.findByIdAndUpdate(sessionId, {
      'aiResult.crossCheck': crosscheckResult,
    });

    return crosscheckResult;
  }

  async score(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId).populate('procedureId');
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    const procedure = session.procedureId as unknown as ProcedureDocument;
    const crosscheckResult = session.aiResult?.crossCheck;
    if (!crosscheckResult) throw new NotFoundException('Chưa chạy CrossCheck');

    const ocrData = session.aiResult?.ocrData as Record<string, unknown> ?? {};
    const documents = Object.entries(ocrData).map(([checklistId, data]) => {
      const d = data as { documentTypeCode: string; fields: Record<string, { value: string; confidence: number }>; imageQuality?: unknown };
      return { checklistId, documentTypeCode: d.documentTypeCode, fields: d.fields ?? {}, imageQuality: d.imageQuality as any };
    });

    const engine = new ScoreEngine();
    const scoreResult = engine.evaluate({
      procedure: {
        code: procedure.code,
        name: procedure.name,
        checklist: procedure.checklist,
        crossCheckRules: procedure.crossCheckRules,
        scoringRules: procedure.scoringRules,
      },
      documents,
      crosscheckResult: crosscheckResult as any,
    });

    await this.sessionModel.findByIdAndUpdate(sessionId, {
      'aiResult.score': scoreResult,
      status: SessionStatus.SCORED,
    });

    return scoreResult;
  }

  async lawguard(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId).populate('procedureId');
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    const procedure = session.procedureId as unknown as ProcedureDocument;

    // Gọi ai-svc qua gRPC
    const result = await firstValueFrom(
      this.aiGrpc.CheckLawGuard({
        procedureCode: procedure.code,
        category: (procedure as any).category ?? '',
        checklist: procedure.checklist.map(c => ({ id: c.id, roleInProcedure: c.roleInProcedure ?? '' })),
      }),
    );

    await this.sessionModel.findByIdAndUpdate(sessionId, { 'aiResult.lawGuardAlerts': result.alerts });
    return result;
  }
}
