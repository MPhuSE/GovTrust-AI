import { Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { ClientGrpc } from '@nestjs/microservices';
import { Queue } from 'bull';
import { firstValueFrom, Observable } from 'rxjs';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';
import { Job, JobDocument, JobState, JobType } from '../../database/schemas/job.schema';
import { CrossChecker, ScoreEngine } from '@govtrust/rule-engine';
import type {
  ProcedureTemplate,
  ChecklistItem,
  CrossCheckRule,
  Severity,
  ExtractedDocument,
  CrossCheckResult,
  FieldCheck,
  ImageQuality,
  FieldValue,
} from '@govtrust/rule-engine';
import { AI_JOB_OPTIONS, AI_TASKS_QUEUE, AiJobName } from '../../queue/ai-tasks.queue';
import { AI_SERVICE_GRPC } from '../../grpc/grpc.constants';

/** Verdict đối chiếu ngữ nghĩa trả về từ ai-svc (pass 2 của cross-check). */
interface SemanticVerdictGrpc {
  field: string;
  equivalent: boolean;
  confidence: number;
  reason: string;
  canonicalLeft?: string;
  canonicalRight?: string;
}

interface SemanticCheckGrpcClient {
  SemanticFieldCheck(req: {
    pairs: Array<{ field: string; left: string; right: string; kind: string }>;
  }): Observable<{ verdicts: SemanticVerdictGrpc[] }>;
}

/** Đoán "kind" cho LLM từ tên field — giúp prompt neo đúng luật đối chiếu. */
function inferKind(fieldKey: string): string {
  const key = fieldKey.toLowerCase();
  if (key.includes('diachi') || key.includes('thuadat') || key.includes('noicutru')) return 'address';
  if (key.includes('hoten') || key.includes('ten') && !key.includes('tenho')) return 'name';
  if (key.includes('tenho') || key.includes('coquan') || key.includes('donvi')) return 'org';
  return 'generic';
}

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
    legalBasis: r.legalBasis,
  }));
  return {
    code: p.code,
    name: p.name,
    checklist,
    crossCheckRules,
    scoringRules: p.scoringRules,
  };
}

@Injectable()
export class ScoringService implements OnModuleInit {
  private readonly logger = new Logger(ScoringService.name);
  private semanticGrpc: SemanticCheckGrpcClient;

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Procedure.name) private procedureModel: Model<ProcedureDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectQueue(AI_TASKS_QUEUE) private aiQueue: Queue,
    @Inject(AI_SERVICE_GRPC) private readonly aiClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.semanticGrpc = this.aiClient.getService<SemanticCheckGrpcClient>('AIService');
  }

  async crosscheck(sessionId: string) {
    return this.enqueueSessionJob(sessionId, JobType.CROSSCHECK, AiJobName.CROSSCHECK, 'crosscheck');
  }

  async runCrosscheckNow(sessionId: string) {
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

    // Pass 1 — code thuần (tất định, miễn phí).
    const checker = new CrossChecker();
    const crosscheckResult = checker.run(toTemplate(procedure), documents);

    // Pass 2 — chỉ những check 'semantic' mà pass 1 chưa khẳng định được khớp mới
    // gửi sang ai-svc để LLM phán "cùng thực thể hay không". Các check còn lại giữ nguyên.
    await this.applySemanticReview(crosscheckResult);

    await this.sessionModel.findByIdAndUpdate(sessionId, {
      $set: {
        'aiResult.crossCheck': crosscheckResult,
        'pipeline.steps.crosscheck': 'done',
        'pipeline.step': 'CROSSCHECK',
        'pipeline.updatedAt': new Date(),
      },
    });

    return crosscheckResult;
  }

  /**
   * Pass 2 của cross-check: đối chiếu ngữ nghĩa cho các field 'semantic' còn MISMATCH.
   * Chỉ gọi AI cho phần nhỏ (không gọi lại các check đã MATCH) → kiểm soát chi phí.
   * Mutate crosscheckResult tại chỗ: nếu AI phán tương đương → lật về MATCH và hạ severity.
   * Lỗi gRPC không làm hỏng cross-check — giữ nguyên kết quả code thuần (an toàn).
   */
  private async applySemanticReview(result: CrossCheckResult): Promise<void> {
    const pending = result.checks.filter(c => c.needsSemanticReview);
    if (pending.length === 0) return;

    const pairs = pending.map(c => ({
      field: c.field,
      left: String(c.leftValue ?? ''),
      right: String(c.rightValue ?? ''),
      kind: inferKind(c.field),
    }));

    let verdicts: SemanticVerdictGrpc[];
    try {
      const res = await firstValueFrom(this.semanticGrpc.SemanticFieldCheck({ pairs }));
      verdicts = res.verdicts ?? [];
    } catch (error) {
      this.logger.warn(
        `SemanticFieldCheck lỗi — giữ kết quả cross-check thuần: ${(error as Error).message}`,
      );
      return;
    }

    pending.forEach((check, index) => {
      const verdict = verdicts[index];
      if (!verdict) return;
      this.mergeVerdict(check, verdict);
    });

    // Cập nhật lại summary sau khi có thể đã lật MISMATCH → MATCH.
    result.summary.matches = result.checks.filter(c => c.status === 'MATCH').length;
    result.summary.mismatches = result.checks.filter(c => c.status === 'MISMATCH').length;
  }

  private mergeVerdict(check: FieldCheck, verdict: SemanticVerdictGrpc): void {
    check.ai = {
      equivalent: verdict.equivalent,
      confidence: verdict.confidence,
      reason: verdict.reason,
      canonicalLeft: verdict.canonicalLeft,
      canonicalRight: verdict.canonicalRight,
    };
    check.needsSemanticReview = false;

    if (verdict.equivalent) {
      check.status = 'MATCH';
      check.severity = 'LOW';
      check.message = `Khớp theo ngữ nghĩa (AI, độ tin cậy ${(verdict.confidence * 100).toFixed(0)}%): ${verdict.reason}`;
    } else {
      check.message = `Không khớp theo ngữ nghĩa (AI): ${verdict.reason}`;
    }
  }

  async score(sessionId: string) {
    return this.enqueueSessionJob(sessionId, JobType.SCORE, AiJobName.SCORE, 'score');
  }

  async runScoreNow(sessionId: string) {
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
      $set: {
        'aiResult.score': scoreResult,
        status: SessionStatus.SCORED,
        'pipeline.steps.score': 'done',
        'pipeline.step': 'SCORE',
        'pipeline.updatedAt': new Date(),
      },
    });

    return scoreResult;
  }

  async lawguard(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId).populate('procedureId');
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    const procedure = session.procedureId as unknown as ProcedureDocument;

    // LawGuard chỉ trích căn cứ pháp lý cho giấy tờ CÒN THIẾU (theo CrossCheck).
    // Hồ sơ đủ giấy → không cần cảnh báo pháp lý gì cả → alerts rỗng, khỏi gọi ai-svc.
    // CrossCheck luôn chạy trước LawGuard trong pipeline nên missingDocuments đã sẵn sàng.
    const crossCheck = session.aiResult?.crossCheck as CrossCheckResult | undefined;
    const missingIds = new Set(crossCheck?.missingDocuments ?? []);
    const missingChecklist = procedure.checklist.filter(c => missingIds.has(c.id));

    if (missingChecklist.length === 0) {
      await this.sessionModel.findByIdAndUpdate(sessionId, {
        $set: {
          'aiResult.lawGuardAlerts': [],
          'pipeline.steps.lawguard': 'done',
          'pipeline.step': 'LAWGUARD',
          'pipeline.updatedAt': new Date(),
        },
      });
      return { jobId: null, status: 'skipped', reason: 'Đủ giấy tờ — không cần căn cứ pháp lý' };
    }

    const payload = {
      procedureCode: procedure.code,
      procedureName: procedure.name ?? '',
      category: procedure.category ?? '',
      checklist: missingChecklist.map(c => ({ id: c.id, roleInProcedure: c.roleInProcedure ?? '' })),
    };
    return this.enqueueSessionJob(sessionId, JobType.LAWGUARD, AiJobName.LAWGUARD, 'lawguard', payload, {
      pipelineStep: 'LAWGUARD',
    });
  }

  private async enqueueSessionJob(
    sessionId: string,
    type: JobType,
    jobName: AiJobName,
    step: string,
    payload: Record<string, unknown> = {},
    options: { pipelineStep?: string } = {},
  ) {
    const job = await this.jobModel.create({
      sessionId: new Types.ObjectId(sessionId),
      type,
      state: JobState.PENDING,
      payload,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    try {
      await this.aiQueue.add(jobName, {
        jobId: String(job._id),
        sessionId,
        ...payload,
      }, AI_JOB_OPTIONS);
      await this.jobModel.findByIdAndUpdate(job._id, { $set: { state: JobState.ENQUEUED } });
    } catch (error) {
      await this.jobModel.findByIdAndUpdate(job._id, {
        $set: { state: JobState.PENDING, lastError: `Enqueue thất bại: ${(error as Error).message}` },
      });
    }

    await this.sessionModel.findByIdAndUpdate(sessionId, {
      $set: {
        [`pipeline.steps.${step}`]: 'queued',
        'pipeline.step': options.pipelineStep ?? type,
        'pipeline.updatedAt': new Date(),
      },
    });
    return { jobId: job._id, status: 'queued' };
  }
}
