import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { InsightLog, InsightLogSchema } from '../database/schemas/insight-log.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: InsightLog.name, schema: InsightLogSchema }])],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}
