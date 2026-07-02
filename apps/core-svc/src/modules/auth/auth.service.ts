import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  UnprocessableEntityException,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private ekycVerificationService: EkycVerificationService,
  ) {}

  async register(dto: { username: string; password: string; fullName: string; role?: UserRole }) {
    const exists = await this.userModel.findOne({ username: dto.username });
    if (exists) throw new ConflictException('Tên đăng nhập đã tồn tại');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      username: dto.username,
      passwordHash,
      fullName: dto.fullName,
      role: dto.role ?? UserRole.CITIZEN,
    });

    return this.buildToken(user);
  }

  async registerWithEkyc(
    dto: { username: string; password: string; fullName: string },
    files: EkycFiles,
  ) {
    const exists = await this.userModel.findOne({ username: dto.username });
    if (exists) throw new ConflictException('Tên đăng nhập đã tồn tại');

    // Không ghi users trước khi eKYC hoàn tất. Nhờ vậy mọi nhánh thất bại
    // đều kết thúc mà không để lại document mồ côi trong MongoDB.
    const ekyc = await this.ekycVerificationService.verify(files);
    if (!ekyc.verified) {
      const reason = ekyc.warnings?.[0] ?? 'Danh tính chưa được xác minh';
      throw new UnprocessableEntityException(
        `Đăng ký thất bại: ${reason}. Tài khoản chưa được tạo.`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const cccdNumber = ekyc.ocrFields?.cccdNumber?.value;
    const cccdFullName = ekyc.ocrFields?.fullName?.value;
    const cccdBirthDay = ekyc.ocrFields?.birthDay?.value;
    const cccdGender = ekyc.ocrFields?.gender?.value;
    const cccdNationality = ekyc.ocrFields?.nationality?.value;
    const cccdOriginLocation = ekyc.ocrFields?.originLocation?.value;
    const cccdRecentLocation = ekyc.ocrFields?.recentLocation?.value;
    const cccdValidDate = ekyc.ocrFields?.validDate?.value;

    let user: UserDocument;
    try {
      user = await this.userModel.create({
        username: dto.username,
        passwordHash,
        fullName: dto.fullName,
        role: UserRole.CITIZEN,
        kycStatus: KycStatus.VERIFIED,
        ...(cccdNumber && { cccdNumber }),
        ...(cccdFullName && { cccdFullName }),
        ...(cccdBirthDay && { cccdBirthDay }),
        ...(cccdGender && { cccdGender }),
        ...(cccdNationality && { cccdNationality }),
        ...(cccdOriginLocation && { cccdOriginLocation }),
        ...(cccdRecentLocation && { cccdRecentLocation }),
        ...(cccdValidDate && { cccdValidDate }),
        kycFaceMatchProb: ekyc.faceMatchProb ?? 0,
        kycVerifiedAt: new Date(),
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Tên đăng nhập đã tồn tại');
      }
      throw error;
    }

    return { ...this.buildToken(user), ekyc };
  }

  async login(dto: { username: string; password: string }) {
    const user = await this.userModel.findOne({ username: dto.username });
    if (!user) throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');

    return this.buildToken(user);
  }

  private buildToken(user: UserDocument) {
    const payload = { sub: user._id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role },
    };
  }
}
