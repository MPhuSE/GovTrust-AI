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
    password: 'secret123',
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
    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: dto.username,
        cccdNumber: '001234567890',
        kycStatus: 'VERIFIED',
      }),
    );
    expect(result.access_token).toBe('signed-token');
  });
});
