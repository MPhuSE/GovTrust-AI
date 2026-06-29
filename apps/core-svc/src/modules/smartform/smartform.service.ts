import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from '../../database/schemas/session.schema';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';

@Injectable()
export class SmartFormService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Procedure.name) private procedureModel: Model<ProcedureDocument>,
  ) {}

  async generate(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId).populate('procedureId');
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    const procedure = session.procedureId as unknown as ProcedureDocument;
    const ocrData = session.aiResult?.ocrData as Record<string, { fields: Record<string, { value: string; confidence: number }> }> ?? {};

    const formData: Record<string, { value: string | null; source: string | null; editable: boolean; confidence?: number }> = {};
    let filledCount = 0;
    const missingFields: string[] = [];

    for (const field of procedure.formFields) {
      let filled = false;

      for (const sourceMap of field.sourceMap) {
        // sourceMap format: "checklistId.fieldKey"
        const [checklistId, fieldKey] = sourceMap.split('.');
        const docData = ocrData[checklistId];
        if (docData?.fields?.[fieldKey]) {
          const fieldValue = docData.fields[fieldKey];
          formData[field.id] = {
            value: fieldValue.value,
            source: checklistId,
            editable: true,
            confidence: fieldValue.confidence,
          };
          filledCount++;
          filled = true;
          break;
        }
      }

      if (!filled) {
        formData[field.id] = { value: null, source: null, editable: true };
        if (field.required) missingFields.push(field.id);
      }
    }

    const result = {
      sessionId,
      formData,
      filledCount,
      totalCount: procedure.formFields.length,
      missingFields,
    };

    await this.sessionModel.findByIdAndUpdate(sessionId, { 'aiResult.formData': formData });
    return result;
  }
}
