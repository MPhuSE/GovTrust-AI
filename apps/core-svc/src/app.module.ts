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
import { InsightsModule } from './modules/insights/insights.module';
import { DocumentTypesModule } from './modules/document-types/document-types.module';
import { QueueModule } from './queue/queue.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SignaturesModule } from './modules/signatures/signatures.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI', 'mongodb://localhost:27017/govtrust_business'),
        dbName: config.get<string>('MONGO_DB_NAME', 'govtrust_business'),
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
    DocumentTypesModule,
    DocumentsModule,
    ScoringModule,
    SessionsModule,
    SmartFormModule,
    RecheckModule,
    PriorityModule,
    InsightsModule,
    QueueModule,
    JobsModule,
    SignaturesModule,
  ],
})
export class AppModule {}
