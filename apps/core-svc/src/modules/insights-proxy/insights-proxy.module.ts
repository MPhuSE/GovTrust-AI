import { Module } from '@nestjs/common';
import { InsightsProxyController } from './insights-proxy.controller';
import { InsightsProxyService } from './insights-proxy.service';
import { InsightsGrpcModule } from '../../grpc/insights-grpc.module';

@Module({
  imports: [InsightsGrpcModule],
  controllers: [InsightsProxyController],
  providers: [InsightsProxyService],
})
export class InsightsProxyModule {}
