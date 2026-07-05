import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  KycStatus,
  User,
  UserDocument,
  UserRole,
} from '../../database/schemas/user.schema';
import { EkycFiles, EkycVerificationService } from './ekyc-verification.service';
import { encryptPii, decryptPii } from '../../common/utils/pii-crypto.util';

/** Mask CCCD: giữ 3 số đầu và 3 số cuối, che phần giữa.
 *  Ví dụ: "034095012345" → "034******345"
 */
function maskCccd(num: string): string {
  if (!num || num.length <= 6) return '***';
  const keep = 3;
  return num.slice(0, keep) + '*'.repeat(Math.max(0, num.length - keep * 2)) + num.slice(-keep);
}

/** Mask địa chỉ: hiện 12 ký tự đầu rồi '...' */
function maskAddr(addr: string): string {
  if (!addr || addr.length <= 15) return addr;
  return addr.slice(0, 15) + '...';
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private ekycVerificationService: EkycVerificationService,
  ) {}

  async register(dto: { username?: string; password: string; fullName: string; phoneNumber?: string; email?: string }) {
    // Validate password strength
    this.validatePasswordStrength(dto.password);

    const username = dto.username || dto.fullName.toLowerCase().replace(/\s+/g, '');
    const exists = await this.userModel.findOne({ username });
    if (exists) throw new ConflictException('Tên đăng nhập đã tồn tại');

    const passwordHash = await bcrypt.hash(dto.password, 12); // Increased bcrypt rounds to 12
    // Đăng ký công khai LUÔN tạo CITIZEN — không nhận role từ client để tránh
    // leo thang đặc quyền (bất kỳ ai cũng có thể tự tạo OFFICER/ADMIN qua API public).
    // Tài khoản OFFICER/ADMIN chỉ được cấp qua seed script nội bộ (scripts/seed-officer.js).
    const user = await this.userModel.create({
      username,
      passwordHash,
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      role: UserRole.CITIZEN,
    });

    return this.buildToken(user);
  }

  async registerWithEkyc(
    dto: { username?: string; password: string; fullName: string; phoneNumber?: string; email?: string },
    files: EkycFiles,
  ) {
    // Validate password strength
    this.validatePasswordStrength(dto.password);

    // Không ghi users trước khi eKYC hoàn tất. Nhờ vậy mọi nhánh thất bại
    // đều kết thúc mà không để lại document mồ côi trong MongoDB.
    const ekyc = await this.ekycVerificationService.verify(files);
    if (!ekyc.verified) {
      const reason = ekyc.warnings?.[0] ?? 'Danh tính chưa được xác minh';
      throw new UnprocessableEntityException(
        `Đăng ký thất bại: ${reason}. Tài khoản chưa được tạo.`,
      );
    }

    const cccdNumber = ekyc.ocrFields?.cccdNumber?.value;
    if (!cccdNumber) {
      throw new UnprocessableEntityException('Không trích xuất được số CCCD từ ảnh');
    }

    // Username = CCCD number nếu không có username được cung cấp
    const username = dto.username || cccdNumber;

    const exists = await this.userModel.findOne({ username });
    if (exists) throw new ConflictException('Tên đăng nhập đã tồn tại');

    const passwordHash = await bcrypt.hash(dto.password, 12); // Increased bcrypt rounds to 12

    // Extract OCR fields
    const cccdFullName = ekyc.ocrFields?.fullName?.value;
    const cccdBirthDay = ekyc.ocrFields?.birthDay?.value;
    const cccdGender = ekyc.ocrFields?.gender?.value;
    const cccdNationality = ekyc.ocrFields?.nationality?.value;
    const cccdOriginLocation = ekyc.ocrFields?.originLocation?.value;
    const cccdRecentLocation = ekyc.ocrFields?.recentLocation?.value;
    const cccdValidDate = ekyc.ocrFields?.validDate?.value;
    const cccdIssueDate = ekyc.ocrFields?.issueDate?.value;
    const cccdIssuePlace = ekyc.ocrFields?.issuePlace?.value;

    let user: UserDocument;
    try {
      user = await this.userModel.create({
        username,
        passwordHash,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        role: UserRole.CITIZEN,
        kycStatus: KycStatus.VERIFIED,
        // Mã hóa PII (AES-256-GCM, giải ngược được) để hiển thị lại cho chính chủ + cross-check.
        cccdNumber: encryptPii(cccdNumber),
        ...(cccdFullName && { cccdFullName }), // Tên không mã hóa — dùng để hiển thị
        ...(cccdBirthDay && { cccdBirthDay }),
        ...(cccdGender && { cccdGender }),
        ...(cccdNationality && { cccdNationality }),
        ...(cccdOriginLocation && { cccdOriginLocation: encryptPii(cccdOriginLocation) }),
        ...(cccdRecentLocation && { cccdRecentLocation: encryptPii(cccdRecentLocation) }),
        ...(cccdValidDate && { cccdValidDate }),
        ...(cccdIssueDate && { cccdIssueDate }),
        ...(cccdIssuePlace && { cccdIssuePlace }),
        kycFaceMatchProb: ekyc.faceMatchProb ?? 0,
        kycVerifiedAt: new Date(),
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Tên đăng nhập đã tồn tại');
      }
      throw error;
    }

    // Return unhashed CCCD data in response for immediate display
    const ekycWithOriginalData = {
      ...ekyc,
      ocrFields: {
        ...ekyc.ocrFields,
        cccdNumber: { value: cccdNumber, confidence: ekyc.ocrFields?.cccdNumber?.confidence ?? 0 },
      }
    };

    return { ...this.buildToken(user), ekyc: ekycWithOriginalData };
  }

  async login(dto: { username: string; password: string }) {
    const user = await this.userModel.findOne({ username: dto.username });
    if (!user) throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');

    return this.buildToken(user);
  }

  /** GET /auth/me — trả thông tin người dùng + CCCD đã mask.
   *  CCCD number che phần giữa để bảo vệ PII trên giao diện.
   */
  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash').lean();
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // Giải mã 1 lần; dữ liệu hash cũ (chưa migrate) → null → fallback '***'.
    const cccdPlain = user.cccdNumber ? decryptPii(user.cccdNumber) : null;

    return {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      kycStatus: user.kycStatus ?? KycStatus.NONE,
      kycVerifiedAt: user.kycVerifiedAt ?? null,
      kycFaceMatchProb: user.kycFaceMatchProb ?? null,
      // CCCD mã hóa trong DB. Đây là hồ sơ của chính chủ (JWT) → giải mã để hiển thị.
      // Số CCCD vẫn mask phần giữa (034******345) cho an toàn hiển thị; địa chỉ giải mã đầy đủ.
      // decryptPii trả null với dữ liệu hash cũ (chưa migrate) → fallback '***'.
      cccdNumber:        user.cccdNumber ? (cccdPlain ? maskCccd(cccdPlain) : '***') : null,
      cccdFullName:      user.cccdFullName  ?? null,
      cccdBirthDay:      user.cccdBirthDay  ?? null,
      cccdGender:        user.cccdGender    ?? null,
      cccdNationality:   user.cccdNationality ?? null,
      cccdOriginLocation: user.cccdOriginLocation ? (decryptPii(user.cccdOriginLocation) ?? '***') : null,
      cccdRecentLocation: user.cccdRecentLocation ? (decryptPii(user.cccdRecentLocation) ?? '***') : null,
      cccdValidDate:     user.cccdValidDate ?? null,
    };
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new UnprocessableEntityException('Mật khẩu phải có ít nhất 8 ký tự');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      throw new UnprocessableEntityException(
        'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
      );
    }
  }

  private buildToken(user: UserDocument) {
    const payload = { sub: user._id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role },
    };
  }
}
