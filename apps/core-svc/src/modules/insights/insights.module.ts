import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { InsightLog, InsightLogSchema } from '../../database/schemas/insight-log.schema';
import { Session, SessionSchema } from '../../database/schemas/session.schema';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InsightLog.name, schema: InsightLogSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    JobsModule,
  ],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}
