import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { Session, SessionSchema } from '../database/schemas/session.schema';
import { Job, JobSchema } from '../database/schemas/job.schema';
import { AI_TASKS_QUEUE } from './ai-tasks.queue';
import { AiTasksConsumer } from './ai-tasks.consumer';
import { AiGrpcModule } from '../grpc/ai-grpc.module';
import { JobReconcilerService } from './job-reconciler.service';
import { InsightLog, InsightLogSchema } from '../database/schemas/insight-log.schema';
import { PipelineEventsGateway } from './pipeline-events.gateway';
import { ScoringModule } from '../modules/scoring/scoring.module';
import { SmartFormModule } from '../modules/smartform/smartform.module';

/**
 * QueueModule — đăng ký BullMQ consumer xử lý pipeline AI bất đồng bộ.
 * Tách riêng để consumer có đủ deps (Session, Job models + ai gRPC client).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Job.name, schema: JobSchema },
      { name: InsightLog.name, schema: InsightLogSchema },
    ]),
    BullModule.registerQueue({ name: AI_TASKS_QUEUE }),
    AiGrpcModule,
    ScoringModule,
    SmartFormModule,
  ],
  providers: [AiTasksConsumer, JobReconcilerService, PipelineEventsGateway],
  exports: [PipelineEventsGateway],
})
export class QueueModule {}
