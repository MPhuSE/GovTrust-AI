import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Queue } from 'bull';
import { Session, SessionDocument } from '../../database/schemas/session.schema';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';
import { Job, JobDocument, JobState, JobType } from '../../database/schemas/job.schema';
import { AI_JOB_OPTIONS, AI_TASKS_QUEUE, AiJobName } from '../../queue/ai-tasks.queue';
import { FormDocumentRenderer } from './form-document.renderer';

export interface FormFieldValue {
  label: string;
  value: string | null;
  source: string | null;
  editable: boolean;
  confidence?: number;
}

/** View mà web (trang smartform) đọc từ aiResult.smartForm. */
export interface SmartFormFieldView {
  key: string;
  label: string;
  value: string;
  source: 'ocr' | 'auto' | 'manual';
  editable: boolean;
  required: boolean;
}

export interface SmartFormView {
  procedureName: string;
  autoFilledFields: SmartFormFieldView[];
  manualFields: SmartFormFieldView[];
}

@Injectable()
export class SmartFormService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Procedure.name) private procedureModel: Model<ProcedureDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectQueue(AI_TASKS_QUEUE) private aiQueue: Queue,
    private readonly renderer: FormDocumentRenderer,
  ) {}

  async generate(sessionId: string, overrides: Record<string, string> = {}) {
    const payload = Object.keys(overrides).length ? { overrides } : {};
    const job = await this.jobModel.create({
      sessionId: new Types.ObjectId(sessionId),
      type: JobType.SMARTFORM,
      state: JobState.PENDING,
      payload,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    try {
      await this.aiQueue.add(AiJobName.SMARTFORM, {
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
        'pipeline.steps.smartform': 'queued',
        'pipeline.step': 'SMARTFORM',
        'pipeline.updatedAt': new Date(),
      },
    });
    return { jobId: job._id, status: 'queued' };
  }

  async runGenerateNow(sessionId: string, overrides: Record<string, string> = {}) {
    const session = await this.sessionModel.findById(sessionId).populate('procedureId');
    if (!session) throw new NotFoundException('Phiên không tồn tại');
    const score = session.aiResult?.score as { canSubmit?: boolean } | undefined;
    if (!score?.canSubmit) {
      throw new UnprocessableEntityException('Hồ sơ còn lỗi cần sửa trước khi tạo tờ khai');
    }

    const procedure = session.procedureId as unknown as ProcedureDocument;
    const ocrData = session.aiResult?.ocrData as Record<string, {
      fields: Record<string, { value: string; confidence: number }>;
    }> ?? {};
    const existing = session.aiResult?.formData as Record<string, FormFieldValue> | undefined;
    const formData: Record<string, FormFieldValue> = {};
    let filledCount = 0;
    const missingFields: string[] = [];

    for (const field of procedure.formFields) {
      const override = overrides[field.id];
      const previous = existing?.[field.id]?.value;
      let value = override !== undefined ? override.trim() : previous;
      let source = override !== undefined ? 'USER' : existing?.[field.id]?.source ?? null;
      let confidence = existing?.[field.id]?.confidence;

      if (!value) {
        for (const sourceMap of field.sourceMap) {
          const [checklistId, fieldKey] = sourceMap.split('.');
          const fieldValue = ocrData[checklistId]?.fields?.[fieldKey];
          if (fieldValue) {
            value = fieldValue.value;
            source = checklistId;
            confidence = fieldValue.confidence;
            break;
          }
        }
      }

      if (!value && field.defaultValue) {
        value = field.defaultValue;
        source = 'PROCEDURE_DEFAULT';
      }

      const normalizedValue = value || null;
      formData[field.id] = {
        label: field.label,
        value: normalizedValue,
        source,
        editable: true,
        ...(confidence !== undefined ? { confidence } : {}),
      };
      if (normalizedValue) filledCount++;
      else if (field.required) missingFields.push(field.id);
    }

    // View cho web: tách field đã tự điền (từ OCR/mặc định) và field cần nhập tay.
    const autoFilledFields: SmartFormFieldView[] = [];
    const manualFields: SmartFormFieldView[] = [];
    for (const field of procedure.formFields) {
      const entry = formData[field.id];
      const hasValue = Boolean(entry.value);
      const isUserSource = entry.source === 'USER';
      if (hasValue && !isUserSource) {
        autoFilledFields.push({
          key: field.id,
          label: field.label,
          value: entry.value ?? '',
          source: entry.source === 'PROCEDURE_DEFAULT' ? 'auto' : 'ocr',
          editable: false,
          required: field.required,
        });
      } else {
        manualFields.push({
          key: field.id,
          label: field.label,
          value: entry.value ?? '',
          source: 'manual',
          editable: true,
          required: field.required,
        });
      }
    }
    const smartForm: SmartFormView = {
      procedureName: procedure.name,
      autoFilledFields,
      manualFields,
    };

    const result = {
      sessionId,
      procedureCode: procedure.code,
      procedureName: procedure.name,
      template: procedure.outputTemplate,
      formData,
      smartForm,
      filledCount,
      totalCount: procedure.formFields.length,
      missingFields,
      downloads: {
        docx: `/sessions/${sessionId}/smartform/docx`,
        pdf: `/sessions/${sessionId}/smartform/pdf`,
      },
    };

    await this.sessionModel.findByIdAndUpdate(sessionId, {
      $set: {
        'aiResult.formData': formData,
        'aiResult.smartForm': smartForm,
        'pipeline.steps.smartform': 'done',
        'pipeline.step': 'SMARTFORM',
        'pipeline.updatedAt': new Date(),
      },
    });
    return result;
  }

  async render(sessionId: string, values: Record<string, string>) {
    return this.generate(sessionId, values);
  }

  async getDocument(sessionId: string, format: 'docx' | 'pdf') {
    const generated = await this.runGenerateNow(sessionId);
    const session = await this.sessionModel.findById(sessionId).populate('procedureId');
    if (!session) throw new NotFoundException('Phiên không tồn tại');
    const procedure = session.procedureId as unknown as ProcedureDocument;
    if (!procedure.outputTemplate) throw new BadRequestException('Thủ tục chưa cấu hình mẫu đầu ra');

    const values = Object.fromEntries(
      Object.entries(generated.formData).map(([id, field]) => [id, field.value ?? '']),
    );
    values.__sessionId = sessionId;
    const buffer = format === 'docx'
      ? await this.renderer.renderDocx(procedure, values)
      : await this.renderer.renderPdf(procedure, values);
    const safeCode = procedure.code.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    return {
      buffer,
      fileName: `${safeCode}-${sessionId}.${format}`,
      contentType: format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf',
    };
  }
}
