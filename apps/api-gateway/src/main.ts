import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('api-gateway');
  // bodyParser: false — gateway stream raw body sang core-svc, không tự parse
  // (nếu parse, http-proxy-middleware sẽ treo POST có body).
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = Number(process.env.GATEWAY_PORT ?? 8080);
  await app.listen(port);
  logger.log(`API Gateway: http://localhost:${port}`);
}

bootstrap();
