import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createHash } from 'crypto';
import { Signature, SignatureDocument } from '../../database/schemas/signature.schema';
import { Session, SessionDocument } from '../../database/schemas/session.schema';
import { CreateSignatureDto } from './dto/create-signature.dto';

@Injectable()
export class SignaturesService {
  constructor(
    @InjectModel(Signature.name) private signatureModel: Model<SignatureDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  /**
   * Tạo chữ ký mới với audit trail đầy đủ
   */
  async createSignature(
    dto: CreateSignatureDto,
    signatureImageBuffer?: Buffer,
  ): Promise<SignatureDocument> {
    // Kiểm tra session tồn tại
    const session = await this.sessionModel.findById(dto.sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${dto.sessionId} không tồn tại`);
    }

    // Tính hash của ảnh chữ ký (chống chối bỏ)
    let signatureImageHash: string | undefined;
    if (signatureImageBuffer) {
      signatureImageHash = createHash('sha256')
        .update(signatureImageBuffer)
        .digest('hex');
    }

    // Tạo signature record
    const signature = await this.signatureModel.create({
      sessionId: new Types.ObjectId(dto.sessionId),
      signerFullName: dto.signerFullName,
      signerCccdNumber: dto.signerCccdNumber,
      signerRole: dto.signerRole,
      signatureMethod: dto.signatureMethod,
      signatureImageHash,
      signedAt: new Date(),
      ekycVerified: dto.ekycVerified ?? false,
      ekycFaceMatchProb: dto.ekycFaceMatchProb,
      ekycVerifiedAt: dto.ekycVerified ? new Date() : undefined,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      deviceInfo: dto.deviceInfo,
      geolocation: dto.geolocation,
      otpConfirmed: dto.otpConfirmed ?? false,
      otpConfirmedAt: dto.otpConfirmed ? new Date() : undefined,
      otpPhoneNumber: dto.otpPhoneNumber,
      metadata: dto.metadata,
    });

    return signature;
  }

  /**
   * Lấy tất cả chữ ký của một session (để hiển thị cho cán bộ)
   */
  async getSignaturesBySession(sessionId: string): Promise<Signature[]> {
    return this.signatureModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ signedAt: 1 })
      .exec();
  }

  /**
   * Kiểm tra session đã đủ chữ ký chưa
   */
  async checkSignatureCompleteness(sessionId: string): Promise<{
    isComplete: boolean;
    required: string[];
    collected: string[];
    missing: string[];
  }> {
    const session = await this.sessionModel
      .findById(sessionId)
      .populate('procedureId')
      .exec();

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} không tồn tại`);
    }

    const signatures = await this.getSignaturesBySession(sessionId);

    // TODO: Logic kiểm tra đủ chữ ký dựa vào loại thủ tục
    // Ví dụ: HKD_THAY_DOI cần 2 chữ ký (PRIMARY_SIGNER + SECONDARY_SIGNER)
    const requiredRoles = ['PRIMARY_SIGNER']; // Tạm thời chỉ cần 1 chữ ký
    const collectedRoles = signatures.map(sig => sig.signerRole);
    const missingRoles = requiredRoles.filter(role => !collectedRoles.includes(role as any));

    return {
      isComplete: missingRoles.length === 0,
      required: requiredRoles,
      collected: collectedRoles,
      missing: missingRoles,
    };
  }

  /**
   * Xác thực chữ ký (verify hash)
   */
  async verifySignature(
    signatureId: string,
    signatureImageBuffer: Buffer,
  ): Promise<boolean> {
    const signature = await this.signatureModel.findById(signatureId);
    if (!signature) {
      throw new NotFoundException(`Signature ${signatureId} không tồn tại`);
    }

    if (!signature.signatureImageHash) {
      throw new BadRequestException('Chữ ký không có hash để xác thực');
    }

    const hash = createHash('sha256')
      .update(signatureImageBuffer)
      .digest('hex');

    return hash === signature.signatureImageHash;
  }

  /**
   * Audit trail: lấy lịch sử ký của một người dùng
   */
  async getSignatureAuditTrail(userId: string, limit = 50): Promise<Signature[]> {
    return this.signatureModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ signedAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Audit trail: lấy tất cả chữ ký trong khoảng thời gian
   */
  async getSignaturesByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Signature[]> {
    return this.signatureModel
      .find({
        signedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ signedAt: -1 })
      .exec();
  }
}
