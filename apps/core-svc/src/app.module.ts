import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { ProceduresModule } from './modules/procedures/procedures.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SmartFormModule } from './modules/smartform/smartform.module';
import { RecheckModule } from './modules/recheck/recheck.module';
import { PriorityModule } from './modules/priority/priority.module';
import { InsightsProxyModule } from './modules/insights-proxy/insights-proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI', 'mongodb://localhost:27017/govtrust_core'),
        dbName: config.get<string>('MONGO_DB_NAME', 'govtrust_core'),
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

    AuthModule,
    ProceduresModule,
    DocumentsModule,
    ScoringModule,
    SessionsModule,
    SmartFormModule,
    RecheckModule,
    PriorityModule,
    InsightsProxyModule,
  ],
})
export class AppModule {}
