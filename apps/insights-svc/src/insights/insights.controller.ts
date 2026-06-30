import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InsightsService } from './insights.service';

@Controller()
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @GrpcMethod('InsightsService', 'LogInsight')
  logInsight(data: {
    procedureId: string; sessionId: string; errorType: string;
    severity: string; finalScore: number; specificDocType: string;
    droppedAtStep: string; deviceType: string; processingTimeMs: number;
  }) {
    return this.insightsService.logInsight(data);
  }

  @GrpcMethod('InsightsService', 'GetDashboard')
  getDashboard(data: { days: number }) {
    return this.insightsService.getDashboard(data.days || 30);
  }

  @GrpcMethod('InsightsService', 'GetTopErrors')
  async getTopErrors(data: { days: number }) {
    const errors = await this.insightsService.getTopErrors(data.days || 30);
    return { errors };
  }

  @GrpcMethod('InsightsService', 'GetTrend')
  async getTrend(data: { days: number }) {
    const points = await this.insightsService.getTrend(data.days || 30);
    return { points };
  }
}
