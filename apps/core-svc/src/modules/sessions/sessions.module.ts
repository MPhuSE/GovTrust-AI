import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Session, SessionSchema } from '../../database/schemas/session.schema';
import { Job, JobSchema } from '../../database/schemas/job.schema';
import { AI_TASKS_QUEUE } from '../../queue/ai-tasks.queue';
import { InsightsGrpcModule } from '../../grpc/insights-grpc.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    BullModule.registerQueue({ name: AI_TASKS_QUEUE }),
    InsightsGrpcModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
