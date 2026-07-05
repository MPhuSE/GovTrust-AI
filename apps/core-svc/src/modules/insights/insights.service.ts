import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InsightLog, InsightLogDocument } from '../../database/schemas/insight-log.schema';

import { Session, SessionDocument } from '../../database/schemas/session.schema';

// Dashboard chỉ thống kê hồ sơ ĐÃ NỘP — bỏ hồ sơ nháp (INIT/UPLOADING/AI_PROCESSING/SCORED)
// để số liệu không bị thổi phồng bởi các phiên người dân bỏ dở.
const SUBMITTED_STATUSES = ['CONFIRMED', 'RECHECKED', 'REJECTED'];

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
    // Lỗi thật nằm trong Session.aiResult.crossCheck.checks[] có status=MISMATCH
    // (InsightLog rỗng ở production). Gom theo ruleName để ra "top lỗi thường gặp".
    return this.sessionModel.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $in: SUBMITTED_STATUSES }, 'aiResult.crossCheck.checks': { $exists: true, $ne: [] } } },
      { $unwind: '$aiResult.crossCheck.checks' },
      { $match: { 'aiResult.crossCheck.checks.status': 'MISMATCH' } },
      {
        $group: {
          _id: '$aiResult.crossCheck.checks.ruleName',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { errorType: '$_id', count: 1, avgScore: { $literal: 0 }, _id: 1 } },
    ]);
  }

  async getProcedureStats(since: Date) {
    // Thống kê theo thủ tục từ Session (không phải InsightLog rỗng).
    return this.sessionModel.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $in: SUBMITTED_STATUSES } } },
      {
        $addFields: {
          resolvedScore: { $ifNull: ['$aiResult.score.score', '$aiResult.score'] },
        },
      },
      {
        $group: {
          _id: '$procedureId',
          totalSessions: { $sum: 1 },
          avgScore: {
            $avg: {
              $cond: [{ $in: [{ $type: '$resolvedScore' }, ['int', 'double', 'long', 'decimal']] }, '$resolvedScore', null],
            },
          },
        },
      },
      { $sort: { totalSessions: -1 } },
    ]);
  }

  async getTrend(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    return this.sessionModel.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $in: SUBMITTED_STATUSES } } },
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
      { $match: { createdAt: { $gte: since }, status: { $in: SUBMITTED_STATUSES } } },
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
