import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { INSIGHTS_SERVICE_GRPC, INSIGHTS_SVC_PACKAGE, PROTO_ROOT } from './grpc.constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: INSIGHTS_SERVICE_GRPC,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: INSIGHTS_SVC_PACKAGE,
            protoPath: join(PROTO_ROOT, 'insights_service.proto'),
            url: config.get<string>('INSIGHTS_SVC_GRPC_URL', 'localhost:50052'),
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class InsightsGrpcModule {}
