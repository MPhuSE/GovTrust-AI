import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Session, SessionSchema } from '../../database/schemas/session.schema';
import { Job, JobSchema } from '../../database/schemas/job.schema';
import { AI_TASKS_QUEUE } from '../../queue/ai-tasks.queue';
import { Procedure, ProcedureSchema } from '../../database/schemas/procedure.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Job.name, schema: JobSchema },
      { name: Procedure.name, schema: ProcedureSchema },
    ]),
    BullModule.registerQueue({ name: AI_TASKS_QUEUE }),
    MulterModule.register({ dest: process.env.UPLOAD_DIR ?? './uploads' }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
