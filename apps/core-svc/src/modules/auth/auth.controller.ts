import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { EkycFiles } from './ekyc-verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản demo' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('register/ekyc')
  @ApiOperation({ summary: 'Đăng ký: chỉ tạo tài khoản sau khi eKYC thành công' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'front', maxCount: 1 },
      { name: 'back', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  registerWithEkyc(
    @Body() body: RegisterDto,
    @UploadedFiles() uploaded: Record<string, Express.Multer.File[]>,
  ) {
    const files = {
      front: uploaded?.front?.[0],
      back: uploaded?.back?.[0],
      selfie: uploaded?.selfie?.[0],
    };
    if (!files.front || !files.back || !files.selfie) {
      throw new BadRequestException(
        'Cần 3 file: front (CCCD trước), back (CCCD sau), selfie (chân dung)',
      );
    }

    return this.authService.registerWithEkyc(body, files as EkycFiles);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hồ sơ cá nhân — thông tin eKYC đã xác minh (CCCD masked)' })
  getProfile(@CurrentUser() user: { userId: string }) {
    return this.authService.getProfile(user.userId);
  }
}
