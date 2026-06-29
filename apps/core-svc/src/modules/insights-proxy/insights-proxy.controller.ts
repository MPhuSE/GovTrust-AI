import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InsightsProxyService } from './insights-proxy.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/schemas/user.schema';

@ApiTags('Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('insights')
export class InsightsProxyController {
  constructor(private readonly insightsProxy: InsightsProxyService) {}

  @Get('dashboard')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'InsightMap Dashboard — proxy tới insights-svc qua gRPC' })
  dashboard(@Query('days') days?: string) {
    return this.insightsProxy.getDashboard(days ? +days : 30);
  }

  @Get('top-errors')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Top lỗi — proxy tới insights-svc qua gRPC' })
  topErrors(@Query('days') days?: string) {
    return this.insightsProxy.getTopErrors(days ? +days : 30);
  }

  @Get('trend')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Xu hướng lỗi — proxy tới insights-svc qua gRPC' })
  trend(@Query('days') days?: string) {
    return this.insightsProxy.getTrend(days ? +days : 30);
  }
}
