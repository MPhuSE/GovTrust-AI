import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/schemas/user.schema';
import { JobsService } from '../jobs/jobs.service';

@ApiTags('Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService, private readonly jobs: JobsService) {}

  @Post('reports')
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Sinh báo cáo InsightMap bất đồng bộ' })
  report(@Query('days') days?: string) {
    const parsed = Math.min(365, Math.max(1, Number.parseInt(days ?? '30', 10) || 30));
    return this.jobs.createInsightReport(parsed);
  }

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

  @Get('charts')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Dữ liệu biểu đồ (Chart.js/Recharts format)' })
  charts(@Query('days') days?: string) {
    return this.insightsService.getChartData(days ? parseInt(days) : 30);
  }
}
