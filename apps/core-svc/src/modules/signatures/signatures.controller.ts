import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { SignaturesService } from './signatures.service';
import { CreateSignatureDto } from './dto/create-signature.dto';

@ApiTags('Signatures — Ký số & Audit Trail')
@Controller('signatures')
export class SignaturesController {
  constructor(private readonly signaturesService: SignaturesService) {}

  /**
   * POST /signatures/sign
   * Người dân ký điện tử (upload ảnh chữ ký hoặc ký trên tablet)
   */
  @Post('sign')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ký điện tử hồ sơ (chữ ký tay + eKYC)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('signatureImage'))
  async sign(
    @Body() dto: CreateSignatureDto,
    @UploadedFile() signatureImage: Express.Multer.File,
    @Req() req: Request & { user?: { userId: string } },
  ) {
    // Thu thập audit trail từ request
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Tạo chữ ký với audit trail
    const signature = await this.signaturesService.createSignature(
      {
        ...dto,
        ipAddress,
        userAgent,
      },
      signatureImage?.buffer,
    );

    // TODO: Upload ảnh chữ ký lên S3/storage và cập nhật signatureImageUrl
    // const signatureImageUrl = await uploadToS3(signatureImage.buffer);
    // await this.signatureModel.updateOne({ _id: signature._id }, { signatureImageUrl });

    return {
      success: true,
      signatureId: signature._id.toString(),
      signedAt: signature.signedAt,
      signatureImageHash: signature.signatureImageHash,
      message: 'Ký thành công',
    };
  }

  /**
   * GET /signatures/session/:sessionId
   * Lấy tất cả chữ ký của một session (cho cán bộ xem)
   */
  @Get('session/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách chữ ký của một hồ sơ' })
  async getSessionSignatures(@Param('sessionId') sessionId: string) {
    const signatures = await this.signaturesService.getSignaturesBySession(sessionId);
    const completeness = await this.signaturesService.checkSignatureCompleteness(sessionId);

    return {
      signatures,
      completeness,
    };
  }

  /**
   * GET /signatures/verify/:signatureId
   * Xác thực chữ ký (kiểm tra hash)
   */
  @Post('verify/:signatureId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xác thực chữ ký bằng hash' })
  @UseInterceptors(FileInterceptor('signatureImage'))
  async verifySignature(
    @Param('signatureId') signatureId: string,
    @UploadedFile() signatureImage: Express.Multer.File,
  ) {
    if (!signatureImage) {
      throw new HttpException('Cần file ảnh chữ ký để xác thực', HttpStatus.BAD_REQUEST);
    }

    const isValid = await this.signaturesService.verifySignature(
      signatureId,
      signatureImage.buffer,
    );

    return {
      signatureId,
      isValid,
      message: isValid ? 'Chữ ký hợp lệ' : 'Chữ ký không khớp',
    };
  }

  /**
   * GET /signatures/audit/user/:userId
   * Lịch sử ký của một người dùng (audit trail)
   */
  @Get('audit/user/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lịch sử ký của một người dùng' })
  async getUserAuditTrail(@Param('userId') userId: string) {
    const signatures = await this.signaturesService.getSignatureAuditTrail(userId);

    return {
      userId,
      totalSignatures: signatures.length,
      signatures,
    };
  }

  /**
   * POST /signatures/audit/date-range
   * Audit trail: tất cả chữ ký trong khoảng thời gian
   */
  @Post('audit/date-range')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Audit trail theo khoảng thời gian' })
  async getAuditTrailByDateRange(
    @Body() body: { startDate: string; endDate: string },
  ) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new HttpException('Ngày không hợp lệ', HttpStatus.BAD_REQUEST);
    }

    const signatures = await this.signaturesService.getSignaturesByDateRange(
      startDate,
      endDate,
    );

    return {
      startDate: body.startDate,
      endDate: body.endDate,
      totalSignatures: signatures.length,
      signatures,
    };
  }
}
