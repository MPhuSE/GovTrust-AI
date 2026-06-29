import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InsightLogDocument = InsightLog & Document;

@Schema({ timestamps: false, collection: 'insight_logs' })
export class InsightLog {
  @Prop({ required: true }) procedureId: string;
  @Prop({ required: true }) sessionId: string;
  @Prop({ required: true }) errorType: string;
  @Prop({ required: true }) severity: string;
  @Prop({ required: true }) finalScore: number;
  @Prop() specificDocType?: string;
  @Prop() droppedAtStep?: string;
  @Prop() processingTimeMs?: number;
  @Prop({ type: String, enum: ['MOBILE', 'DESKTOP'] }) deviceType?: string;
  @Prop({ default: () => new Date() }) createdAt: Date;
}

export const InsightLogSchema = SchemaFactory.createForClass(InsightLog);
InsightLogSchema.index({ procedureId: 1, errorType: 1 });
InsightLogSchema.index({ createdAt: 1 });
