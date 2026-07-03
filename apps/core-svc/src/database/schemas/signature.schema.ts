import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SignatureDocument = Signature & Document;

export enum SignatureMethod {
  HANDWRITTEN_TABLET = 'HANDWRITTEN_TABLET', // Ký trên màn hình cảm ứng
  HANDWRITTEN_PAPER = 'HANDWRITTEN_PAPER', // Ký giấy → chụp lại
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE', // USB Token/SIM PKI (future)
}

export enum SignatureRole {
  APPLICANT = 'APPLICANT', // Người nộp hồ sơ
  PRIMARY_SIGNER = 'PRIMARY_SIGNER', // Người ký chính (ví dụ: chủ hộ mới)
  SECONDARY_SIGNER = 'SECONDARY_SIGNER', // Người ký phụ (ví dụ: chủ hộ cũ)
  WITNESS = 'WITNESS', // Người chứng kiến
  AUTHORIZED_REPRESENTATIVE = 'AUTHORIZED_REPRESENTATIVE', // Người được ủy quyền
}

@Schema({ timestamps: true, collection: 'signatures' })
export class Signature {
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  // ── Thông tin người ký ──
  @Prop({ required: true })
  signerFullName: string;

  @Prop()
  signerCccdNumber?: string;

  @Prop({ type: String, enum: SignatureRole, required: true })
  signerRole: SignatureRole;

  // ── eKYC verification ──
  @Prop({ default: false })
  ekycVerified: boolean;

  @Prop()
  ekycFaceMatchProb?: number;

  @Prop()
  ekycVerifiedAt?: Date;

  // ── Chữ ký ──
  @Prop({ type: String, enum: SignatureMethod, required: true })
  signatureMethod: SignatureMethod;

  @Prop()
  signatureImageUrl?: string; // URL ảnh chữ ký (S3/storage)

  @Prop()
  signatureImageHash?: string; // SHA-256 hash để chống chối bỏ

  @Prop({ required: true })
  signedAt: Date;

  // ── Audit trail ──
  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  deviceInfo?: string; // "iPhone 15 Pro, iOS 17.5"

  @Prop({ type: Object })
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  // ── OTP confirmation (optional) ──
  @Prop({ default: false })
  otpConfirmed: boolean;

  @Prop()
  otpConfirmedAt?: Date;

  @Prop()
  otpPhoneNumber?: string;

  // ── Metadata ──
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SignatureSchema = SchemaFactory.createForClass(Signature);

SignatureSchema.index({ sessionId: 1 });
SignatureSchema.index({ userId: 1 });
SignatureSchema.index({ signerCccdNumber: 1 });
SignatureSchema.index({ signedAt: 1 });
