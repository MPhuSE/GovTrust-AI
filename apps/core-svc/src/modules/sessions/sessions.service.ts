import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
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
import { decryptPii } from '../../common/utils/pii-crypto.util';
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
    const ekycSlots = (procedure.checklist ?? []).filter(item => item.inputMode === 'EKYC');
    if (ekycSlots.length === 0) return undefined;

    const user = await this.userModel.findById(userId);
    if (!user || user.kycStatus !== KycStatus.VERIFIED) return undefined;

    // 3 field PII được mã hóa AES → giải mã để điền form + cross-check.
    // Dữ liệu hash cũ (chưa migrate) → decryptPii trả null → bỏ qua, không nhét hash vào form.
    const cccdNumberPlain = user.cccdNumber ? decryptPii(user.cccdNumber) : null;
    const cccdOriginPlain = user.cccdOriginLocation ? decryptPii(user.cccdOriginLocation) : null;
    const cccdRecentPlain = user.cccdRecentLocation ? decryptPii(user.cccdRecentLocation) : null;

    const fields: Record<string, { value: string; confidence: number }> = {};
    if (cccdNumberPlain) fields.soCCCD = { value: cccdNumberPlain, confidence: 1 };
    if (user.cccdFullName) fields.hoTen = { value: user.cccdFullName, confidence: 1 };
    if (user.cccdBirthDay) fields.ngaySinh = { value: user.cccdBirthDay, confidence: 1 };
    if (user.cccdGender) fields.gioiTinh = { value: user.cccdGender, confidence: 1 };
    if (user.cccdNationality) fields.quocTich = { value: user.cccdNationality, confidence: 1 };
    if (cccdOriginPlain) fields.queQuan = { value: cccdOriginPlain, confidence: 1 };
    if (cccdRecentPlain) fields.noiThuongTru = { value: cccdRecentPlain, confidence: 1 };
    if (user.cccdValidDate) fields.ngayHetHan = { value: user.cccdValidDate, confidence: 1 };
    if (user.cccdIssueDate) fields.ngayCap = { value: user.cccdIssueDate, confidence: 1 };
    if (user.cccdIssuePlace) fields.noiCap = { value: user.cccdIssuePlace, confidence: 1 };
    if (Object.keys(fields).length === 0) return undefined;

    const slot = ekycSlots[0];
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

  async findAllByUser(userId: string, role?: string) {
    const filter: any = {};
    if (role === 'OFFICER' || role === 'ADMIN') {
      filter['govReCheck.reviewedBy'] = new Types.ObjectId(userId);
    } else {
      filter.userId = new Types.ObjectId(userId);
    }

    const sessions = await this.sessionModel
      .find(filter)
      .populate('procedureId', 'code name department')
      .sort({ createdAt: -1 })
      .lean();
    return sessions;
  }

  /**
   * View cho GET /sessions/:id.
   * - Chủ session (requesterId khớp session.userId): xem dữ liệu ĐẦY ĐỦ để rà soát
   *   form của chính mình trước khi nộp — mask với chủ sở hữu là vô nghĩa.
   * - Người khác / không rõ danh tính: mask PII trong ocrData/crossCheck.
   * Cả hai trường hợp đều KHÔNG lộ đường dẫn file gốc trên server.
   * Dữ liệu gốc trong DB không đổi — pipeline nội bộ luôn dùng bản đầy đủ.
   */
  async findPublicById(id: string, requesterId?: string) {
    const session = await this.findById(id);
    const plain = session.toObject() as Record<string, any>;

    const isOwner = Boolean(requesterId) && String(plain.userId ?? '') === requesterId;

    if (plain.aiResult && !isOwner) {
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

  /**
   * Xóa hẳn hồ sơ nháp (chưa nộp). Chỉ chủ sở hữu được xóa, và chỉ khi hồ sơ
   * CHƯA nộp — hồ sơ đã nộp (CONFIRMED/RECHECKED/REJECTED) phải giữ để cán bộ xử lý.
   * Xóa cả file upload vật lý (data minimization) rồi mới xóa document.
   */
  async deleteDraft(sessionId: string, requesterId?: string): Promise<{ deleted: true }> {
    const session = await this.findById(sessionId);

    if (!requesterId || String(session.userId ?? '') !== requesterId) {
      throw new ForbiddenException('Bạn không có quyền xóa hồ sơ này');
    }

    const submitted: SessionStatus[] = [
      SessionStatus.CONFIRMED,
      SessionStatus.RECHECKED,
      SessionStatus.REJECTED,
    ];
    if (submitted.includes(session.status)) {
      throw new BadRequestException('Hồ sơ đã nộp không thể xóa');
    }

    await this.fileCleanup.deleteSessionFiles(session);
    await this.sessionModel.deleteOne({ _id: session._id });
    this.logger.log(`Đã xóa hồ sơ nháp ${sessionId} (chủ sở hữu ${requesterId})`);
    return { deleted: true };
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

  /**
   * [DEV ONLY] Tạo mock session với OCR data giả để test cross-check
   */
  async createMockSession(
    procedureCode: string,
    ocrData: Record<string, any>,
    description?: string,
  ): Promise<{ sessionId: string; description?: string }> {
    const procedure = await this.resolveProcedure(procedureCode);
    const ttlHours = this.config.get<number>('SESSION_TTL_HOURS', 24);
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    const session = await this.sessionModel.create({
      procedureId: procedure._id as Types.ObjectId,
      status: SessionStatus.INIT,
      pipeline: { step: 'OCR', steps: { ocr: 'done' }, updatedAt: new Date() },
      aiResult: { ocrData },
      expiresAt,
    });

    return {
      sessionId: (session._id as Types.ObjectId).toString(),
      description,
    };
  }
}
