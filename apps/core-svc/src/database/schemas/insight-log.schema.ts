import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InsightLogDocument = InsightLog & Document;

export enum ErrorType {
  MISSING_DOC = 'MISSING_DOC',
  INFO_MISMATCH = 'INFO_MISMATCH',
  EXPIRED_DOC = 'EXPIRED_DOC',
  LOW_QUALITY_IMG = 'LOW_QUALITY_IMG',
  LIVENESS_FAIL = 'LIVENESS_FAIL',
}

@Schema({ timestamps: false, collection: 'insight_logs' })
export class InsightLog {
  @Prop({ type: Types.ObjectId, ref: 'Procedure', required: true })
  procedureId: Types.ObjectId;

  // Hash một chiều của sessionId — InsightMap chỉ giữ metadata ẩn danh,
  // không truy ngược được về phiên/người dân cụ thể (docs/Gov_Trust.md).
  @Prop({ type: String, required: true })
  anonymizedSessionId: string;

  @Prop({ type: String, enum: ErrorType, required: true })
  errorType: ErrorType;

  @Prop({ type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true })
  severity: string;

  @Prop()
  specificDocType?: string;

  @Prop({ required: true })
  finalScore: number;

  @Prop()
  droppedAtStep?: string;

  @Prop({ type: Number })
  processingTimeMs?: number;

  @Prop({ type: String, enum: ['MOBILE', 'DESKTOP'] })
  deviceType?: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const InsightLogSchema = SchemaFactory.createForClass(InsightLog);
InsightLogSchema.index({ procedureId: 1, errorType: 1 });
InsightLogSchema.index({ createdAt: 1 });
