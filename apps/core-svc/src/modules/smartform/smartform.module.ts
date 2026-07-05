import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SmartFormController } from './smartform.controller';
import { SmartFormService } from './smartform.service';
import { Session, SessionSchema } from '../../database/schemas/session.schema';
import { Procedure, ProcedureSchema } from '../../database/schemas/procedure.schema';
import { Job, JobSchema } from '../../database/schemas/job.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { BullModule } from '@nestjs/bull';
import { AI_TASKS_QUEUE } from '../../queue/ai-tasks.queue';
import { FormDocumentRenderer } from './form-document.renderer';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Procedure.name, schema: ProcedureSchema },
      { name: Job.name, schema: JobSchema },
      { name: User.name, schema: UserSchema },
    ]),
    BullModule.registerQueue({ name: AI_TASKS_QUEUE }),
  ],
  controllers: [SmartFormController],
  providers: [SmartFormService, FormDocumentRenderer],
  exports: [SmartFormService],
})
export class SmartFormModule {}
