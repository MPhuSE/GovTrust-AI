import { BadGatewayException, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';

import { UserDocument } from '../../database/schemas/user.schema';
import { AuthService } from './auth.service';
import {
  EkycFiles,
  EkycVerificationResult,
  EkycVerificationService,
} from './ekyc-verification.service';

describe('AuthService registration with eKYC', () => {
  const dto = {
    username: 'nguyenvana',
    // Mật khẩu phải đạt policy (hoa/thường/số/ký tự đặc biệt) — validatePasswordStrength
    // chạy trước cả eKYC nên fixture yếu sẽ bị chặn sớm.
    password: 'Secret@123',
    fullName: 'Nguyen Van A',
  };
  const files = {
    front: { buffer: Buffer.from('front') },
    back: { buffer: Buffer.from('back') },
    selfie: { buffer: Buffer.from('selfie') },
  } as EkycFiles;

  const verifiedResult: EkycVerificationResult = {
    verified: true,
    ocrFields: {
      cccdNumber: { value: '001234567890', confidence: 0.99 },
      fullName: { value: 'NGUYEN VAN A', confidence: 0.98 },
      birthDay: { value: '01/01/2000', confidence: 0.97 },
    },
    matchFrontBack: {},
    faceMatch: true,
    faceMatchProb: 0.96,
    liveness: true,
    warnings: [],
    processingTimeMs: 100,
  };

  let userModel: {
    findOne: jest.Mock;
    create: jest.Mock;
  };
  let ekycService: { verify: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    // encryptPii cần key — set giá trị test cố định để mã hóa PII từ eKYC.
    process.env.PII_ENCRYPTION_KEY = 'test-pii-key-32-bytes-minimum-000';
    userModel = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    ekycService = { verify: jest.fn() };
    const jwtService = { sign: jest.fn().mockReturnValue('signed-token') };

    service = new AuthService(
      userModel as unknown as Model<UserDocument>,
      jwtService as unknown as JwtService,
      ekycService as unknown as EkycVerificationService,
    );
  });

  it('does not create a user when eKYC is not verified', async () => {
    ekycService.verify.mockResolvedValue({
      ...verifiedResult,
      verified: false,
      warnings: ['Khuon mat khong khop'],
    });

    await expect(service.registerWithEkyc(dto, files)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('does not create a user when the eKYC provider fails', async () => {
    ekycService.verify.mockRejectedValue(new BadGatewayException('ai-svc unavailable'));

    await expect(service.registerWithEkyc(dto, files)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('creates one verified user only after eKYC succeeds', async () => {
    ekycService.verify.mockResolvedValue(verifiedResult);
    userModel.create.mockImplementation(async (payload) => ({
      _id: 'user-id',
      ...payload,
    }));

    const result = await service.registerWithEkyc(dto, files);

    expect(ekycService.verify).toHaveBeenCalledWith(files);
    expect(userModel.create).toHaveBeenCalledTimes(1);
    const created = userModel.create.mock.calls[0][0];
    expect(created.username).toBe(dto.username);
    expect(created.kycStatus).toBe('VERIFIED');
    // CCCD được mã hóa PII (AES-256-GCM) trước khi lưu — không còn là chuỗi thô.
    expect(created.cccdNumber).toMatch(/^enc:v1:/);
    expect(created.cccdNumber).not.toBe('001234567890');
    expect(result.access_token).toBe('signed-token');
  });
});

describe('AuthService.register (public) luôn tạo CITIZEN', () => {
  const strongPass = 'MatKhau@123';
  let userModel: { findOne: jest.Mock; create: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    userModel = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async (payload) => ({ _id: 'uid', ...payload })),
    };
    const jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
    service = new AuthService(
      userModel as unknown as Model<UserDocument>,
      jwtService as unknown as JwtService,
      { verify: jest.fn() } as unknown as EkycVerificationService,
    );
  });

  it('tạo CITIZEN cho đăng ký hợp lệ', async () => {
    await service.register({ username: 'dan1', password: strongPass, fullName: 'Nguyễn Văn Dân' });
    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'dan1', role: 'CITIZEN' }),
    );
  });

  it('BỎ QUA role client gửi lên — không cho tự nâng quyền OFFICER (chống leo thang đặc quyền)', async () => {
    // Ép kiểu any vì DTO công khai đã gỡ field `role`; giả lập client cố tình gửi thừa.
    await service.register({
      username: 'hacker',
      password: strongPass,
      fullName: 'Kẻ Gian',
      role: 'OFFICER',
    } as never);

    const created = userModel.create.mock.calls[0][0];
    expect(created.role).toBe('CITIZEN');
    expect(created.role).not.toBe('OFFICER');
  });

  it('từ chối mật khẩu yếu (không đủ độ mạnh)', async () => {
    await expect(
      service.register({ username: 'dan2', password: '123', fullName: 'Yếu' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(userModel.create).not.toHaveBeenCalled();
  });
});
