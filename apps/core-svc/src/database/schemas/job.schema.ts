import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobDocument = Job & Document;

export enum JobType {
  OCR = 'OCR',
  CROSSCHECK = 'CROSSCHECK',
  LAWGUARD = 'LAWGUARD',
  SCORE = 'SCORE',
  SMARTFORM = 'SMARTFORM',
}

export enum JobState {
  PENDING = 'PENDING',
  ENQUEUED = 'ENQUEUED',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true, collection: 'jobs' })
export class Job {
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: String, enum: JobType, required: true })
  type: JobType;

  @Prop({ type: String, enum: JobState, default: JobState.PENDING })
  state: JobState;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ type: Object })
  payload?: Record<string, unknown>;

  @Prop()
  lastError?: string;

  @Prop({ type: Date })
  expiresAt: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);
JobSchema.index({ state: 1, updatedAt: 1 });
JobSchema.index({ sessionId: 1 });
JobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
