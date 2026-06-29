import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

const PROTO_ROOT = join(__dirname, '../../../packages/proto');
const GRPC_PORT = process.env.INSIGHTS_GRPC_PORT ?? '50052';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'govtrust.insights',
      protoPath: join(PROTO_ROOT, 'insights_service.proto'),
      url: `0.0.0.0:${GRPC_PORT}`,
    },
  });

  await app.listen();
  console.log(`GovTrust Insights Service (gRPC) listening on :${GRPC_PORT}`);
}

bootstrap();
