import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SmartFormController } from './smartform.controller';
import { SmartFormService } from './smartform.service';
import { Session, SessionSchema } from '../../database/schemas/session.schema';
import { Procedure, ProcedureSchema } from '../../database/schemas/procedure.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Procedure.name, schema: ProcedureSchema },
    ]),
  ],
  controllers: [SmartFormController],
  providers: [SmartFormService],
})
export class SmartFormModule {}
