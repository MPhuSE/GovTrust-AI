import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AI_SERVICE_GRPC, AI_SVC_PACKAGE, PROTO_ROOT } from './grpc.constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AI_SERVICE_GRPC,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: AI_SVC_PACKAGE,
            protoPath: join(PROTO_ROOT, 'ai_service.proto'),
            url: config.get<string>('AI_SVC_GRPC_URL', 'localhost:50051'),
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class AiGrpcModule {}
