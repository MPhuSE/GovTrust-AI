import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo phiên kiểm tra hồ sơ mới' })
  create(@Body() body: CreateSessionDto, @CurrentUser() user?: { userId: string }) {
    return this.sessionsService.create(body.procedureId, user?.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy trạng thái phiên (dùng cho progress bar)' })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Người dân xác nhận hồ sơ (Bước 8)' })
  confirm(@Param('id') id: string) {
    return this.sessionsService.confirm(id);
  }
}
