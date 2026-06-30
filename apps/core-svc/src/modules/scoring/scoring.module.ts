import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { Session, SessionSchema } from '../../database/schemas/session.schema';
import { Procedure, ProcedureSchema } from '../../database/schemas/procedure.schema';
import { AiGrpcModule } from '../../grpc/ai-grpc.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Procedure.name, schema: ProcedureSchema },
    ]),
    AiGrpcModule,
  ],
  controllers: [ScoringController],
  providers: [ScoringService],
})
export class ScoringModule {}
