import {
  Controller,
  Post,
  Req,
  Res,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

import { User, UserDocument, KycStatus } from '../../database/schemas/user.schema';

@ApiTags('Auth — eKYC')
@Controller('auth/ekyc')
export class EkycController {
  private readonly aiSvcUrl: string;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private config: ConfigService,
  ) {
    const port = this.config.get<number>('AI_SVC_PORT', 8000);
    this.aiSvcUrl = `http://localhost:${port}`;
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'eKYC: CCCD trước + sau + selfie → xác thực danh tính' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'front', maxCount: 1 },
      { name: 'back', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  async verify(@Req() req: Request & { user?: { userId: string } }, @Res() res: Response) {
    // Lấy userId từ JWT payload (đã được JwtStrategy validate)
    const userId = req.user?.userId;
    if (!userId) {
      throw new HttpException('Không xác thực được người dùng', HttpStatus.UNAUTHORIZED);
    }

    const files = req.files as Record<string, Express.Multer.File[]>;
    const front = files?.front?.[0];
    const back = files?.back?.[0];
    const selfie = files?.selfie?.[0];

    if (!front || !back || !selfie) {
      throw new HttpException(
        'Cần 3 file: front (CCCD trước), back (CCCD sau), selfie (chân dung)',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userModel.updateOne(
      { _id: userId },
      { kycStatus: KycStatus.PENDING },
    );

    const formData = new FormData();
    formData.append('front', new Blob([new Uint8Array(front.buffer)]), front.originalname);
    formData.append('back', new Blob([new Uint8Array(back.buffer)]), back.originalname);
    formData.append('selfie', new Blob([new Uint8Array(selfie.buffer)]), selfie.originalname);

    let aiResult: any;
    try {
      const aiRes = await fetch(`${this.aiSvcUrl}/api/v1/ekyc/verify`, {
        method: 'POST',
        body: formData,
      });
      if (!aiRes.ok) {
        const text = await aiRes.text();
        throw new Error(`ai-svc ${aiRes.status}: ${text}`);
      }
      aiResult = await aiRes.json();
    } catch (err: any) {
      await this.userModel.updateOne(
        { _id: userId },
        { kycStatus: KycStatus.FAILED },
      );
      throw new HttpException(
        `Lỗi gọi ai-svc eKYC: ${err.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const kycStatus = aiResult.verified ? KycStatus.VERIFIED : KycStatus.FAILED;
    const cccdNumber = aiResult.ocrFields?.cccdNumber?.value;
    const cccdFullName = aiResult.ocrFields?.fullName?.value;
    const cccdBirthDay = aiResult.ocrFields?.birthDay?.value;
    const cccdGender = aiResult.ocrFields?.gender?.value;
    const cccdNationality = aiResult.ocrFields?.nationality?.value;
    const cccdOriginLocation = aiResult.ocrFields?.originLocation?.value;
    const cccdRecentLocation = aiResult.ocrFields?.recentLocation?.value;
    const cccdValidDate = aiResult.ocrFields?.validDate?.value;

    await this.userModel.updateOne(
      { _id: userId },
      {
        kycStatus,
        ...(cccdNumber && { cccdNumber }),
        ...(cccdFullName && { cccdFullName }),
        ...(cccdBirthDay && { cccdBirthDay }),
        ...(cccdGender && { cccdGender }),
        ...(cccdNationality && { cccdNationality }),
        ...(cccdOriginLocation && { cccdOriginLocation }),
        ...(cccdRecentLocation && { cccdRecentLocation }),
        ...(cccdValidDate && { cccdValidDate }),
        kycFaceMatchProb: aiResult.faceMatchProb ?? 0,
        ...(kycStatus === KycStatus.VERIFIED && { kycVerifiedAt: new Date() }),
      },
    );

    return res.json({
      kycStatus,
      verified: aiResult.verified,
      ocrFields: aiResult.ocrFields,
      matchFrontBack: aiResult.matchFrontBack,
      faceMatch: aiResult.faceMatch,
      faceMatchProb: aiResult.faceMatchProb,
      liveness: aiResult.liveness,
      warnings: aiResult.warnings,
      processingTimeMs: aiResult.processingTimeMs,
    });
  }
}
