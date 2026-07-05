import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InsightLog, InsightLogDocument } from '../../database/schemas/insight-log.schema';

import { Session, SessionDocument } from '../../database/schemas/session.schema';

@Injectable()
export class InsightsService {
  constructor(
    @InjectModel(InsightLog.name) private insightModel: Model<InsightLogDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async getDashboard(days = 30) {
    const since = new Date(Date.now() - days * 86400000);

    const [topErrors, procedureStats, sessionStats] = await Promise.all([
      this.getTopErrors(since),
      this.getProcedureStats(since),
      this.getSessionStats(since),
    ]);

    let topError;
    if (topErrors && topErrors.length > 0) {
      const totalErrors = topErrors.reduce((acc, curr) => acc + curr.count, 0);
      topError = {
        errorType: topErrors[0]._id,
        percentage: Math.round((topErrors[0].count / totalErrors) * 100),
      };
    }

    return {
      period: { since, until: new Date() },
      totalSessions: sessionStats.totalSessions,
      avgScore: sessionStats.avgScore,
      passRate: sessionStats.passRate,
      topError,
      topErrors,
      procedureStats,
    };
  }

  async getChartData(days = 30) {
    const trend = await this.getTrend(days);
    return {
      labels: trend.map(t => t._id),
      datasets: [
        {
          label: 'Số hồ sơ',
          data: trend.map(t => t.count),
        },
        {
          label: 'Điểm trung bình',
          data: trend.map(t => Math.round(t.avgScore)),
        }
      ]
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
    return this.sessionModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $addFields: {
          resolvedScore: { $ifNull: ['$aiResult.score.score', '$aiResult.score'] },
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { 
            $avg: {
              $cond: [{ $in: [{ $type: '$resolvedScore' }, ['int', 'double', 'long', 'decimal']] }, '$resolvedScore', null]
            }
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  private async getSessionStats(since: Date) {
    const result = await this.sessionModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $addFields: {
          resolvedScore: { $ifNull: ['$aiResult.score.score', '$aiResult.score'] },
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          scoredSessions: {
            $sum: {
              $cond: [{ $in: [{ $type: '$resolvedScore' }, ['int', 'double', 'long', 'decimal']] }, 1, 0],
            },
          },
          totalScore: {
            $sum: {
              $cond: [{ $in: [{ $type: '$resolvedScore' }, ['int', 'double', 'long', 'decimal']] }, '$resolvedScore', 0],
            },
          },
          passedSessions: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: [{ $type: '$resolvedScore' }, ['int', 'double', 'long', 'decimal']] },
                    { $gte: ['$resolvedScore', 60] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = result[0];
    if (!stats) return { totalSessions: 0, avgScore: 0, passRate: 0 };

    const avgScore = stats.scoredSessions > 0 ? stats.totalScore / stats.scoredSessions : 0;
    const passRate = stats.scoredSessions > 0 ? Math.round((stats.passedSessions / stats.scoredSessions) * 100) : 0;

    return {
      totalSessions: stats.totalSessions,
      avgScore,
      passRate,
    };
  }
}
