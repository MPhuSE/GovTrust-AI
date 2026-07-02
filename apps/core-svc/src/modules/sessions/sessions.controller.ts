import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSessionDto } from './sessions.dto';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

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
  @ApiOperation({ summary: 'Lấy trạng thái phiên (dùng cho progress bar) — PII đã được mask' })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findPublicById(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Người dân xác nhận hồ sơ (Bước 8)' })
  confirm(@Param('id') id: string) {
    return this.sessionsService.confirm(id);
  }
}
