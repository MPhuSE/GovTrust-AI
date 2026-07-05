import { Controller, Post, Get, Delete, Param, Body, UseGuards, Headers, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSessionDto } from './sessions.dto';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo phiên kiểm tra hồ sơ mới' })
  create(@Body() body: CreateSessionDto, @CurrentUser() user?: { userId: string }) {
    return this.sessionsService.create(body.procedureId, user?.userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách phiên của người dùng (Lịch sử nộp hồ sơ)' })
  findHistory(@CurrentUser() user: { userId: string }) {
    return this.sessionsService.findAllByUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy trạng thái phiên (progress bar). Chủ phiên xem đầy đủ; người khác PII đã mask.' })
  findOne(@Param('id') id: string, @Headers('x-user-id') requesterId?: string) {
    // x-user-id do gateway gắn sau khi verify JWT. /sessions bắt buộc token nên chủ phiên luôn có.
    return this.sessionsService.findPublicById(id, requesterId);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Người dân xác nhận hồ sơ (Bước 8)' })
  confirm(@Param('id') id: string) {
    return this.sessionsService.confirm(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa hồ sơ nháp (chưa nộp) — chỉ chủ sở hữu' })
  remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.sessionsService.deleteDraft(id, user?.userId);
  }

  @Post('mock')
  @ApiOperation({ summary: '[DEV ONLY] Tạo session với mock OCR data để test cross-check' })
  async createMock(@Body() body: { procedureCode: string; description?: string; ocrData: Record<string, any> }) {
    // Chốt cứng: chỉ cho tạo session mock khi bật cờ ENABLE_MOCK_SESSIONS (môi trường dev).
    // Mặc định tắt → dữ liệu OCR giả KHÔNG BAO GIỜ lọt vào kết quả thật trên production.
    if (this.config.get<string>('ENABLE_MOCK_SESSIONS') !== 'true') {
      throw new ForbiddenException('Mock session bị vô hiệu hóa (chỉ dùng ở môi trường dev).');
    }
    return this.sessionsService.createMockSession(body.procedureCode, body.ocrData, body.description);
  }
}
