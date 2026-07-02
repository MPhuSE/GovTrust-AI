import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

export enum SessionStatus {
  INIT = 'INIT',
  UPLOADING = 'UPLOADING',
  AI_PROCESSING = 'AI_PROCESSING',
  SCORED = 'SCORED',
  CONFIRMED = 'CONFIRMED',
  RECHECKED = 'RECHECKED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true, collection: 'sessions' })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Procedure', required: true })
  procedureId: Types.ObjectId;

  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.INIT })
  status: SessionStatus;

  @Prop({ type: Object, default: { step: 'INIT', steps: {}, updatedAt: new Date() } })
  pipeline: {
    step: string;
    steps: Record<string, string>;
    updatedAt: Date;
  };

  @Prop({ type: [Object], default: [] })
  documents: Array<{
    docTypeId: string;
    fileUrl: string;
    uploadTime: Date;
  }>;

  @Prop({ type: Object })
  aiResult?: {
    ocrData?: Record<string, unknown>;
    crossCheck?: unknown;
    score?: unknown;
    lawGuardAlerts?: unknown[];
    formData?: Record<string, unknown>;
  };

  @Prop({ type: Object })
  govReCheck?: {
    completenessLevel: 'DAY_DU' | 'CAN_BO_SUNG' | 'CAN_KIEM_TRA_KY';
    riskFlags: Array<{
      type: string;
      message: string;
      severity: string;
    }>;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
  };

  @Prop({ type: Object })
  priority?: {
    level: 'A' | 'B' | 'C' | 'D';
    reason: string;
    slaDeadline: Date;
    finalDecisionByOfficer?: string;
  };

  @Prop()
  officerNotes?: string;

  @Prop({ type: Date, index: true })
  expiresAt: Date;

  // timestamps: true tự thêm 2 field này lúc runtime — khai báo để TS biết.
  createdAt?: Date;
  updatedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ userId: 1 });
SessionSchema.index({ procedureId: 1 });
