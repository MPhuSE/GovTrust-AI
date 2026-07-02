import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentTypeDocument = DocumentType & Document;

/**
 * document_types — catalog dùng chung (OI-6). Định nghĩa MỖI loại giấy tờ ĐÚNG 1 LẦN.
 * procedures.checklist chỉ trỏ documentTypeCode, không định nghĩa lại giấy tờ.
 * OCR result chuẩn hóa theo fields[].key ở đây → CrossCheck ghép field giữa các giấy.
 */
@Schema({ timestamps: true, collection: 'document_types' })
export class DocumentType {
  @Prop({ required: true, unique: true })
  code: string; // "GIAY_KHAI_SINH"

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: ['NHAN_THAN', 'HO_TICH', 'DAT_DAI', 'DOANH_NGHIEP'] })
  category: string;

  @Prop()
  issuingAuthority?: string;

  @Prop({ default: false })
  hasPortrait: boolean;

  @Prop({ default: 1 })
  pagesRequired: number;

  @Prop({ type: [Object], default: [] })
  fields: Array<{
    key: string; // "hoTenMe" — dùng cho CrossCheck
    label: string;
    dataType: 'string' | 'date' | 'enum' | 'number' | 'id_number';
    format?: string;
    regex?: string;
    required: boolean;
    isIdentity: boolean;
    enumValues?: string[];
  }>;

  @Prop({ type: Object, default: { hasExpiry: false } })
  validity: {
    hasExpiry: boolean;
    expiryField?: string;
    validityRule?: string;
    gracePeriodDays?: number;
  };

  @Prop({ type: [String], default: [] })
  aliasCodes: string[]; // CCCD ⟷ ["CMND"]

  @Prop({ default: true })
  isActive: boolean;
}

export const DocumentTypeSchema = SchemaFactory.createForClass(DocumentType);
DocumentTypeSchema.index({ code: 1 }, { unique: true });
DocumentTypeSchema.index({ category: 1 });
DocumentTypeSchema.index({ isActive: 1 });
