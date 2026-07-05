import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Queue } from 'bull';
import { Session, SessionDocument } from '../../database/schemas/session.schema';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';
import { Job, JobDocument, JobState, JobType } from '../../database/schemas/job.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';
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
  source: 'ocr' | 'auto' | 'manual' | 'user';
  editable: boolean;
  required: boolean;
  /** Có giá trị hay chưa — dùng cho badge "AI điền" / "Cần nhập" ở UI liền mạch. */
  filled?: boolean;
}

export interface SmartFormView {
  procedureName: string;
  autoFilledFields: SmartFormFieldView[];
  manualFields: SmartFormFieldView[];
  /**
   * Danh sách trường duy nhất theo đúng thứ tự template — tất cả đều editable.
   * UI liền mạch (không tách "AI điền" / "nhập tay") đọc mảng này; giữ 2 mảng trên
   * để tương thích ngược với phiên cũ.
   */
  fields: SmartFormFieldView[];
}

@Injectable()
export class SmartFormService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Procedure.name) private procedureModel: Model<ProcedureDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectQueue(AI_TASKS_QUEUE) private aiQueue: Queue,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

    const procedure = session.procedureId as unknown as ProcedureDocument;
    const ocrData = session.aiResult?.ocrData as Record<string, {
      fields: Record<string, { value: string; confidence: number }>;
    }> ?? {};
    const existing = session.aiResult?.formData as Record<string, FormFieldValue> | undefined;

    // Field có autofillFromUser (dienThoai/email) lấy thẳng từ hồ sơ tài khoản.
    const user = session.userId ? await this.userModel.findById(session.userId).lean() : null;
    const userValue = (key?: string): string | undefined => {
      if (!key || !user) return undefined;
      const v = (user as Record<string, unknown>)[key];
      return typeof v === 'string' && v ? v : undefined;
    };

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
            let extractedValue = fieldValue.value;
            // Parse common fields like gender
            if (field.id === 'gioi_tinh' || fieldKey.toLowerCase().includes('gioitinh')) {
              const lower = extractedValue.toLowerCase();
              if (lower === 'nam' || lower === 'm') extractedValue = 'Nam';
              else if (lower === 'nữ' || lower === 'nu' || lower === 'f') extractedValue = 'Nữ';
            }
            
            value = extractedValue;
            source = checklistId;
            confidence = fieldValue.confidence;
            
            // Fallback: If confidence is too low, act as if we need user to manually input/verify
            if (confidence < 0.6) {
              source = 'manual';
            }
            break;
          }
        }
      }

      // Điền từ hồ sơ tài khoản (dienThoai/email) khi OCR không có nguồn.
      if (!value && field.autofillFromUser) {
        const fromUser = userValue(field.autofillFromUser);
        if (fromUser) {
          value = fromUser;
          source = 'USER_PROFILE';
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

    // View cho web: một danh sách trường DUY NHẤT theo đúng thứ tự template.
    // Mọi trường đều editable — AI điền sẵn giá trị, người dùng có thể chỉnh trực tiếp.
    // `filled` cho biết AI đã điền hay chưa (để UI gắn badge "AI điền" / "Cần nhập").
    // autoFilledFields/manualFields giữ lại để tương thích ngược nhưng phản ánh cùng dữ liệu.
    const fields: SmartFormFieldView[] = [];
    const autoFilledFields: SmartFormFieldView[] = [];
    const manualFields: SmartFormFieldView[] = [];
    for (const field of procedure.formFields) {
      const entry = formData[field.id];
      const hasValue = Boolean(entry.value);
      const source: SmartFormFieldView['source'] =
        entry.source === 'USER'
          ? 'user'
          : entry.source === 'PROCEDURE_DEFAULT'
            ? 'auto'
            : hasValue
              ? 'ocr'
              : 'manual';
      const view: SmartFormFieldView = {
        key: field.id,
        label: field.label,
        value: entry.value ?? '',
        source,
        editable: true, // luôn cho phép chỉnh sửa — UI liền mạch
        required: field.required,
        filled: hasValue,
      };
      fields.push(view);
      if (hasValue && entry.source !== 'USER') autoFilledFields.push(view);
      else manualFields.push(view);
    }
    const smartForm: SmartFormView = {
      procedureName: procedure.name,
      autoFilledFields,
      manualFields,
      fields,
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
    // Đồng bộ: ghi thẳng formData/smartForm vào DB rồi mới trả, để bước tải file
    // (getDocument) đọc được đúng giá trị user vừa nhập/sửa. KHÔNG dùng generate()
    // (enqueue job async 202) vì gây race: tải ngay sau lưu → file thiếu dữ liệu vừa sửa.
    return this.runGenerateNow(sessionId, values);
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
