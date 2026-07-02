import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';
import { Procedure, ProcedureSchema } from '../../database/schemas/procedure.schema';
import { AiGrpcModule } from '../../grpc/ai-grpc.module';
import { MvpProcedureSeeder } from './mvp-procedure.seeder';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Procedure.name, schema: ProcedureSchema }]),
    AiGrpcModule,
  ],
  controllers: [ProceduresController],
  providers: [ProceduresService, MvpProcedureSeeder],
  exports: [ProceduresService],
})
export class ProceduresModule {}
