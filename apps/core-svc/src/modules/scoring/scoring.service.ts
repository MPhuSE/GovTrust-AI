import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bull';
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
  ImageQuality,
  FieldValue,
} from '@govtrust/rule-engine';
import { AI_JOB_OPTIONS, AI_TASKS_QUEUE, AiJobName } from '../../queue/ai-tasks.queue';

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

@Injectable()
export class ScoringService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Procedure.name) private procedureModel: Model<ProcedureDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectQueue(AI_TASKS_QUEUE) private aiQueue: Queue,
  ) {}

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

    const checker = new CrossChecker();
    const crosscheckResult = checker.run(toTemplate(procedure), documents);

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
    const payload = {
      procedureCode: procedure.code,
      category: procedure.category ?? '',
      checklist: procedure.checklist.map(c => ({ id: c.id, roleInProcedure: c.roleInProcedure ?? '' })),
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
