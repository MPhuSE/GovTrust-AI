import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProcedureDocument = Procedure & Document;

@Schema({ timestamps: true, collection: 'procedures' })
export class Procedure {
  // unique: true không khai báo ở @Prop — ProcedureSchema.index() bên dưới đã tạo unique index.
  // Khai báo cả 2 nơi gây Mongoose duplicate-index warning.
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  category: string;

  @Prop()
  description: string;

  @Prop()
  department: string;

  @Prop({ type: Object })
  outputTemplate?: {
    key: string;
    displayName: string;
    originalFile: string;
    version: string;
    outputFormats: Array<'docx' | 'pdf'>;
  };

  @Prop({ type: [Object], default: [] })
  checklist: Array<{
    id: string;
    documentTypeCode: string;
    label?: string;
    acceptedCodes?: string[];
    roleInProcedure?: string;
    inputMode?: 'UPLOAD' | 'EKYC' | 'REFERENCE';
    allowReuseVerifiedIdentity?: boolean;
    quantity?: number;
    isRequired: boolean;
    conditionalOn?: string;
    points?: number;
  }>;

  @Prop({ type: [Object], default: [] })
  formFields: Array<{
    id: string;
    label: string;
    required: boolean;
    sourceMap: string[];
    defaultValue?: string;
  }>;

  @Prop({ type: [Object], default: [] })
  crossCheckRules: Array<{
    name: string;
    left: string;
    right: string;
    matchType: 'exact' | 'normalized' | 'fuzzy';
    tolerance?: number;
    severityIfMismatch: string;
    skipIfMissing?: string;
  }>;

  @Prop({
    type: Object,
    default: {
      baseScore: 100,
      penalties: { missingRequired: -20, infoMismatch: -10, expiredDoc: -15, lowQualityImage: -5, lowOcrConfidence: -5 },
    },
  })
  scoringRules: {
    baseScore: number;
    penalties: {
      missingRequired: number;
      infoMismatch: number;
      expiredDoc: number;
      lowQualityImage: number;
      lowOcrConfidence: number;
    };
  };

  @Prop({ type: Object, default: { baseUrgency: 'MEDIUM', slaDays: 5 } })
  priorityConfig: {
    baseUrgency: 'HIGH' | 'MEDIUM' | 'LOW';
    slaDays: number;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const ProcedureSchema = SchemaFactory.createForClass(Procedure);
ProcedureSchema.index({ code: 1 }, { unique: true });
ProcedureSchema.index({ isActive: 1 });
