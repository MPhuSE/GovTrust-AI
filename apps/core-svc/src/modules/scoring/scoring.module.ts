import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { Session, SessionSchema } from '../../database/schemas/session.schema';
import { Procedure, ProcedureSchema } from '../../database/schemas/procedure.schema';
import { Job, JobSchema } from '../../database/schemas/job.schema';
import { BullModule } from '@nestjs/bull';
import { AI_TASKS_QUEUE } from '../../queue/ai-tasks.queue';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Procedure.name, schema: ProcedureSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    BullModule.registerQueue({ name: AI_TASKS_QUEUE }),
  ],
  controllers: [ScoringController],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
