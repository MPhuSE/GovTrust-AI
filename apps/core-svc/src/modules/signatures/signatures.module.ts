import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';
import { Signature, SignatureSchema } from '../../database/schemas/signature.schema';
import { Session, SessionSchema } from '../../database/schemas/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Signature.name, schema: SignatureSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [SignaturesController],
  providers: [SignaturesService],
  exports: [SignaturesService],
})
export class SignaturesModule {}
