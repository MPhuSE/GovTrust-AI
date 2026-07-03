import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CITIZEN = 'CITIZEN',
  OFFICER = 'OFFICER',
  ADMIN = 'ADMIN',
}

export enum KycStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  // unique: true không khai báo ở @Prop — UserSchema.index() bên dưới đã tạo unique index.
  // Khai báo cả 2 nơi gây Mongoose duplicate-index warning.
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.CITIZEN })
  role: UserRole;

  @Prop()
  organization?: string;

  @Prop({ type: String, enum: KycStatus, default: KycStatus.NONE })
  kycStatus: KycStatus;

  @Prop()
  cccdNumber?: string;

  @Prop()
  cccdFullName?: string;

  @Prop()
  cccdBirthDay?: string;

  @Prop()
  cccdGender?: string;

  @Prop()
  cccdNationality?: string;

  @Prop()
  cccdOriginLocation?: string;

  @Prop()
  cccdRecentLocation?: string;

  @Prop()
  cccdValidDate?: string;

  @Prop()
  kycFaceMatchProb?: number;

  @Prop()
  kycVerifiedAt?: Date;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop()
  email?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ username: 1 }, { unique: true });
