import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PriorityController } from './priority.controller';
import { PriorityService } from './priority.service';
import { Session, SessionSchema } from '../../database/schemas/session.schema';
import { Procedure, ProcedureSchema } from '../../database/schemas/procedure.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Procedure.name, schema: ProcedureSchema },
    ]),
  ],
  controllers: [PriorityController],
  providers: [PriorityService],
})
export class PriorityModule {}
