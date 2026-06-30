import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/schemas/user.schema';

@ApiTags('Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('dashboard')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'InsightMap Dashboard — tổng hợp điểm nghẽn (Bước 11)' })
  dashboard(@Query('days') days?: string) {
    return this.insightsService.getDashboard(days ? parseInt(days) : 30);
  }

  @Get('top-errors')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Top lỗi theo loại (metadata ẩn danh)' })
  topErrors(@Query('days') days?: string) {
    return this.insightsService.getTopErrors(
      new Date(Date.now() - (days ? parseInt(days) : 30) * 86400000),
    );
  }

  @Get('trend')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Xu hướng lỗi theo ngày' })
  trend(@Query('days') days?: string) {
    return this.insightsService.getTrend(days ? parseInt(days) : 30);
  }
}
