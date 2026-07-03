import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { SignatureMethod, SignatureRole } from '../../../database/schemas/signature.schema';

export class CreateSignatureDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  signerFullName: string;

  @IsOptional()
  @IsString()
  signerCccdNumber?: string;

  @IsEnum(SignatureRole)
  signerRole: SignatureRole;

  @IsEnum(SignatureMethod)
  signatureMethod: SignatureMethod;

  @IsOptional()
  @IsBoolean()
  ekycVerified?: boolean;

  @IsOptional()
  @IsNumber()
  ekycFaceMatchProb?: number;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @IsOptional()
  @IsObject()
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  @IsOptional()
  @IsBoolean()
  otpConfirmed?: boolean;

  @IsOptional()
  @IsString()
  otpPhoneNumber?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
