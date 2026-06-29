import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecheckController } from './recheck.controller';
import { RecheckService } from './recheck.service';
import { Session, SessionSchema } from '../../database/schemas/session.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }])],
  controllers: [RecheckController],
  providers: [RecheckService],
})
export class RecheckModule {}
