import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InsightLog, InsightLogDocument } from '../../database/schemas/insight-log.schema';

@Injectable()
export class InsightsService {
  constructor(
    @InjectModel(InsightLog.name) private insightModel: Model<InsightLogDocument>,
  ) {}

  async getDashboard(days = 30) {
    const since = new Date(Date.now() - days * 86400000);

    const [topErrors, procedureStats, avgScore] = await Promise.all([
      this.getTopErrors(since),
      this.getProcedureStats(since),
      this.getAvgScore(since),
    ]);

    return {
      period: { since, until: new Date() },
      topErrors,
      procedureStats,
      avgScore,
    };
  }

  async getTopErrors(since: Date) {
    return this.insightModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$errorType', count: { $sum: 1 }, avgScore: { $avg: '$finalScore' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { errorType: '$_id', count: 1, avgScore: { $round: ['$avgScore', 1] }, _id: 0 } },
    ]);
  }

  async getProcedureStats(since: Date) {
    return this.insightModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$procedureId',
          totalSessions: { $sum: 1 },
          avgScore: { $avg: '$finalScore' },
          errorCount: { $sum: 1 },
        },
      },
      { $sort: { errorCount: -1 } },
    ]);
  }

  async getTrend(days = 30) {
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
    ]);
  }

  private async getAvgScore(since: Date) {
    const result = await this.insightModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: null, avg: { $avg: '$finalScore' } } },
    ]);
    return result[0]?.avg ?? 0;
  }
}
