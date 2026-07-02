import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { FileCleanupService } from './file-cleanup.service';
import { Session, SessionSchema } from '../../database/schemas/session.schema';
import { Job, JobSchema } from '../../database/schemas/job.schema';
import { InsightLog, InsightLogSchema } from '../../database/schemas/insight-log.schema';
import { Procedure, ProcedureSchema } from '../../database/schemas/procedure.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { AI_TASKS_QUEUE } from '../../queue/ai-tasks.queue';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Job.name, schema: JobSchema },
      { name: InsightLog.name, schema: InsightLogSchema },
      { name: Procedure.name, schema: ProcedureSchema },
      { name: User.name, schema: UserSchema },
    ]),
    BullModule.registerQueue({ name: AI_TASKS_QUEUE }),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, FileCleanupService],
  exports: [SessionsService, FileCleanupService],
})
export class SessionsModule {}
