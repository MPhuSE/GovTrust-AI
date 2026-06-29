import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InsightLog, InsightLogDocument } from '../database/schemas/insight-log.schema';

@Injectable()
export class InsightsService {
  constructor(
    @InjectModel(InsightLog.name) private insightModel: Model<InsightLogDocument>,
  ) {}

  async logInsight(data: {
    procedureId: string; sessionId: string; errorType: string;
    severity: string; finalScore: number; specificDocType?: string;
    droppedAtStep?: string; deviceType?: string; processingTimeMs?: number;
  }): Promise<{ success: boolean }> {
    await this.insightModel.create({ ...data, createdAt: new Date() });
    return { success: true };
  }

  async getDashboard(days: number) {
    const since = new Date(Date.now() - days * 86400000);
    const [topErrors, avgScore] = await Promise.all([
      this.getTopErrors(days),
      this.getAvgScore(since),
    ]);
    return { topErrors, avgScore };
  }

  async getTopErrors(days: number) {
    const since = new Date(Date.now() - days * 86400000);
    return this.insightModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$errorType', count: { $sum: 1 }, avgScore: { $avg: '$finalScore' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { errorType: '$_id', count: 1, avgScore: { $round: ['$avgScore', 1] }, _id: 0 } },
    ]);
  }

  async getTrend(days: number) {
    const since = new Date(Date.now() - days * 86400000);
    return this.insightModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$finalScore' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, avgScore: { $round: ['$avgScore', 1] }, _id: 0 } },
    ]);
  }

  private async getAvgScore(since: Date): Promise<number> {
    const r = await this.insightModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: null, avg: { $avg: '$finalScore' } } },
    ]);
    return r[0]?.avg ?? 0;
  }
}
