import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { InsightLog, InsightLogDocument, ErrorType } from '../../database/schemas/insight-log.schema';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';
import { KycStatus, User, UserDocument } from '../../database/schemas/user.schema';
import {
  anonymizeId,
  maskCrossCheck,
  maskFormData,
  maskOcrData,
  maskScoreResult,
  maskSmartForm,
} from '../../common/utils/pii-mask.util';
import { FileCleanupService } from './file-cleanup.service';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(InsightLog.name) private insightModel: Model<InsightLogDocument>,
    @InjectModel(Procedure.name) private procedureModel: Model<ProcedureDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly config: ConfigService,
    private readonly fileCleanup: FileCleanupService,
  ) {}

  async create(procedureIdOrCode: string, userId?: string): Promise<SessionDocument> {
    const ttlHours = this.config.get<number>('SESSION_TTL_HOURS', 24);
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    // Cần cả checklist để biết vị trí CCCD nào có thể dùng lại từ eKYC.
    const procedure = await this.resolveProcedure(procedureIdOrCode);
    const procedureObjectId = procedure._id as Types.ObjectId;
    const identityOcrData = userId
      ? await this.buildVerifiedIdentityOcrData(userId, procedure)
      : undefined;

    return this.sessionModel.create({
      procedureId: procedureObjectId,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      status: SessionStatus.INIT,
      pipeline: { step: 'INIT', steps: {}, updatedAt: new Date() },
      ...(identityOcrData && { aiResult: { ocrData: identityOcrData } }),
      expiresAt,
    });
  }

  private async resolveProcedure(idOrCode: string): Promise<ProcedureDocument> {
    const query = Types.ObjectId.isValid(idOrCode)
      ? { _id: new Types.ObjectId(idOrCode), isActive: true }
      : { code: idOrCode, isActive: true };
    const procedure = await this.procedureModel.findOne(query);
    if (!procedure) throw new NotFoundException(`Thủ tục "${idOrCode}" không tồn tại`);
    return procedure;
  }

  /**
   * Dùng hồ sơ eKYC như một nguồn giấy tờ đã xác minh.
   * Chỉ tự gán khi checklist có đúng một vị trí CCCD; nếu có nhiều bên tham gia
   * (vợ/chồng, mua/bán), hệ thống không đoán tài khoản thuộc vai trò nào.
   */
  private async buildVerifiedIdentityOcrData(
    userId: string,
    procedure: ProcedureDocument,
  ): Promise<Record<string, unknown> | undefined> {
    const cccdSlots = (procedure.checklist ?? []).filter(item =>
      item.documentTypeCode === 'CCCD' || item.acceptedCodes?.includes('CCCD'),
    );
    if (cccdSlots.length !== 1) return undefined;

    const user = await this.userModel.findById(userId);
    if (!user || user.kycStatus !== KycStatus.VERIFIED) return undefined;

    const fields: Record<string, { value: string; confidence: number }> = {};
    if (user.cccdNumber) fields.soCCCD = { value: user.cccdNumber, confidence: 1 };
    if (user.cccdFullName) fields.hoTen = { value: user.cccdFullName, confidence: 1 };
    if (user.cccdBirthDay) fields.ngaySinh = { value: user.cccdBirthDay, confidence: 1 };
    if (user.cccdGender) fields.gioiTinh = { value: user.cccdGender, confidence: 1 };
    if (user.cccdNationality) fields.quocTich = { value: user.cccdNationality, confidence: 1 };
    if (user.cccdOriginLocation) fields.queQuan = { value: user.cccdOriginLocation, confidence: 1 };
    if (user.cccdRecentLocation) fields.noiThuongTru = { value: user.cccdRecentLocation, confidence: 1 };
    if (user.cccdValidDate) fields.ngayHetHan = { value: user.cccdValidDate, confidence: 1 };
    if (Object.keys(fields).length === 0) return undefined;

    const slot = cccdSlots[0];
    return {
      [slot.id]: {
        documentTypeCode: 'CCCD',
        fields,
        source: 'EKYC_PROFILE',
        verifiedAt: user.kycVerifiedAt,
      },
    };
  }

  async findById(id: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id).populate('procedureId');
    if (!session) throw new NotFoundException('Phiên không tồn tại hoặc đã hết hạn');
    return session;
  }

  async findAllByUser(userId: string) {
    const sessions = await this.sessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('procedureId', 'code name department')
      .sort({ createdAt: -1 })
      .lean();
    return sessions;
  }

  /**
   * View công khai cho GET /sessions/:id (không có auth guard):
   * mask PII trong ocrData/crossCheck, không lộ đường dẫn file trên server.
   * Dữ liệu gốc trong DB không đổi — pipeline nội bộ vẫn dùng bản đầy đủ.
   */
  async findPublicById(id: string) {
    const session = await this.findById(id);
    const plain = session.toObject() as Record<string, any>;

    if (plain.aiResult) {
      plain.aiResult = {
        ...plain.aiResult,
        ocrData: maskOcrData(plain.aiResult.ocrData),
        crossCheck: maskCrossCheck(plain.aiResult.crossCheck),
        score: maskScoreResult(plain.aiResult.score),
        formData: maskFormData(plain.aiResult.formData),
        smartForm: maskSmartForm(plain.aiResult.smartForm),
      };
    }
    plain.documents = (plain.documents ?? []).map(
      ({ fileUrl: _fileUrl, ...doc }: { fileUrl?: string }) => doc,
    );
    return plain;
  }

  async updatePipeline(sessionId: string, step: string, stepStatus: string) {
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          [`pipeline.steps.${step.toLowerCase()}`]: stepStatus,
          'pipeline.step': step,
          'pipeline.updatedAt': new Date(),
        },
      },
      { new: true },
    );
  }

  async updateStatus(sessionId: string, status: SessionStatus) {
    return this.sessionModel.findByIdAndUpdate(sessionId, { status }, { new: true });
  }

  async confirm(sessionId: string): Promise<SessionDocument> {
    const session = await this.findById(sessionId);
    session.status = SessionStatus.CONFIRMED;
    await session.save();

    // Rút metadata ẩn danh → insight_logs trước khi session hết TTL
    await this.extractInsightLog(session);

    // Data minimization: OCR đã xong, kết quả nằm trong aiResult —
    // file gốc không còn cần thiết, xoá ngay sau khi người dân xác nhận.
    await this.fileCleanup.deleteSessionFiles(session);

    return session;
  }

  private async extractInsightLog(session: SessionDocument) {
    const scoreObj = session.aiResult?.score as { total?: number; score?: number } | undefined;
    const finalScore = scoreObj?.score ?? scoreObj?.total ?? 0;
    if (!finalScore) return;

    // Shape thật từ CrossChecker: { checks, missingDocuments, summary: { mismatches, missing } }
    const crossCheck = session.aiResult?.crossCheck as {
      summary?: { mismatches?: number; missing?: number };
    } | undefined;
    const mismatchCount = crossCheck?.summary?.mismatches ?? 0;
    const missingCount = crossCheck?.summary?.missing ?? 0;

    const procedureId = session.procedureId.toString();
    // InsightMap chỉ giữ metadata ẩn danh — hash một chiều thay vì sessionId thật.
    const anonymizedSessionId = anonymizeId((session._id as Types.ObjectId).toString());

    const emit = async (errorType: ErrorType, severity: string) => {
      try {
        await this.insightModel.create({
          procedureId: new Types.ObjectId(procedureId),
          anonymizedSessionId,
          errorType,
          severity,
          finalScore,
        });
      } catch (e) {
        this.logger.warn(`Ghi InsightLog thất bại: ${(e as Error).message}`);
      }
    };

    if (mismatchCount > 0) await emit(ErrorType.INFO_MISMATCH, 'HIGH');
    if (missingCount > 0) await emit(ErrorType.MISSING_DOC, 'HIGH');
  }
}
