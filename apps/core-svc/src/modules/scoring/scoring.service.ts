import { Injectable, NotFoundException, OnModuleInit, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientGrpc } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { Observable, firstValueFrom } from 'rxjs';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';
import { CrossChecker, ScoreEngine } from '@govtrust/rule-engine';
import type {
  ProcedureTemplate,
  ChecklistItem,
  CrossCheckRule,
  Severity,
  ExtractedDocument,
  CrossCheckResult,
  ImageQuality,
  FieldValue,
} from '@govtrust/rule-engine';
import { AI_SERVICE_GRPC } from '../../grpc/grpc.constants';

/** Shape của 1 giấy tờ trong session.aiResult.ocrData (ghi bởi BullMQ consumer). */
interface OcrDataEntry {
  documentTypeCode: string;
  fields?: Record<string, FieldValue>;
  imageQuality?: ImageQuality;
}

/**
 * Map procedure (shape MongoDB) → ProcedureTemplate (rule-engine).
 * Khác biệt: schema dùng `isRequired`, rule-engine dùng `required`;
 * `severityIfMismatch` ở schema là string → ép về Severity.
 */
function toTemplate(p: ProcedureDocument): ProcedureTemplate {
  const checklist: ChecklistItem[] = (p.checklist ?? []).map(c => ({
    id: c.id,
    documentTypeCode: c.documentTypeCode,
    acceptedCodes: c.acceptedCodes,
    roleInProcedure: c.roleInProcedure,
    quantity: c.quantity,
    required: c.isRequired,
    conditionalOn: c.conditionalOn,
    points: c.points,
  }));
  const crossCheckRules: CrossCheckRule[] = (p.crossCheckRules ?? []).map(r => ({
    name: r.name,
    left: r.left,
    right: r.right,
    matchType: r.matchType,
    tolerance: r.tolerance,
    severityIfMismatch: r.severityIfMismatch as Severity,
    skipIfMissing: r.skipIfMissing,
  }));
  return {
    code: p.code,
    name: p.name,
    checklist,
    crossCheckRules,
    scoringRules: p.scoringRules,
  };
}

export interface LegalAlert {
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
    const ocrData = (session.aiResult?.ocrData ?? {}) as Record<string, OcrDataEntry>;

    // Chuyển ocrData thành ExtractedDocument[]
    const documents: ExtractedDocument[] = Object.entries(ocrData).map(([checklistId, d]) => ({
      checklistId,
      documentTypeCode: d.documentTypeCode,
      fields: d.fields ?? {},
    }));

    const checker = new CrossChecker();
    const crosscheckResult = checker.run(toTemplate(procedure), documents);

    await this.sessionModel.findByIdAndUpdate(sessionId, {
      'aiResult.crossCheck': crosscheckResult,
    });

    return crosscheckResult;
  }

  async score(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId).populate('procedureId');
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    const procedure = session.procedureId as unknown as ProcedureDocument;
    const crosscheckResult = session.aiResult?.crossCheck as CrossCheckResult | undefined;
    if (!crosscheckResult) throw new NotFoundException('Chưa chạy CrossCheck');

    const ocrData = (session.aiResult?.ocrData ?? {}) as Record<string, OcrDataEntry>;
    const documents: ExtractedDocument[] = Object.entries(ocrData).map(([checklistId, d]) => ({
      checklistId,
      documentTypeCode: d.documentTypeCode,
      fields: d.fields ?? {},
      imageQuality: d.imageQuality,
    }));

    const engine = new ScoreEngine();
    const scoreResult = engine.evaluate({
      procedure: toTemplate(procedure),
      documents,
      crosscheckResult,
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
        category: procedure.category ?? '',
        checklist: procedure.checklist.map(c => ({ id: c.id, roleInProcedure: c.roleInProcedure ?? '' })),
      }),
    );

    await this.sessionModel.findByIdAndUpdate(sessionId, { 'aiResult.lawGuardAlerts': result.alerts });
    return result;
  }
}
