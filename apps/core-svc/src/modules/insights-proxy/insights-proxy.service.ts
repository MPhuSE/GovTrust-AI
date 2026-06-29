import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { INSIGHTS_SERVICE_GRPC } from '../../grpc/grpc.constants';

interface InsightsServiceGrpcClient {
  GetDashboard(req: { days: number }): Observable<unknown>;
  GetTopErrors(req: { days: number }): Observable<unknown>;
  GetTrend(req: { days: number }): Observable<unknown>;
}

@Injectable()
export class InsightsProxyService implements OnModuleInit {
  private insightsGrpc: InsightsServiceGrpcClient;

  constructor(@Inject(INSIGHTS_SERVICE_GRPC) private readonly insightsClient: ClientGrpc) {}

  onModuleInit() {
    this.insightsGrpc = this.insightsClient.getService<InsightsServiceGrpcClient>('InsightsService');
  }

  getDashboard(days: number) {
    return firstValueFrom(this.insightsGrpc.GetDashboard({ days }));
  }

  getTopErrors(days: number) {
    return firstValueFrom(this.insightsGrpc.GetTopErrors({ days }));
  }

  getTrend(days: number) {
    return firstValueFrom(this.insightsGrpc.GetTrend({ days }));
  }
}
