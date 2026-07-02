'use client';

import { useEffect, useState } from 'react';
import { insightsApi } from '@/lib/api-client';
import { TopErrorsChart } from '@/components/dashboard/TopErrorsChart';
import { TrendLine } from '@/components/dashboard/TrendLine';
import { FilterBar } from '@/components/dashboard/FilterBar';

interface DashboardData {
  topErrors: Array<{ errorType: string; count: number; avgScore: number }>;
  procedureStats: unknown[];
  avgScore: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [trend, setTrend] = useState<unknown[]>([]);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([insightsApi.dashboard(days), insightsApi.trend(days)])
      .then(([dash, trendData]) => {
        setData(dash as any as DashboardData);
        setTrend(trendData as any as unknown[]);
      })
      .finally(() => setIsLoading(false));
  }, [days]);

  if (isLoading) return <div className="text-center py-20">Đang tải InsightMap...</div>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1>InsightMap Dashboard</h1>
        <FilterBar days={days} onChange={setDays} />
      </div>

      {data && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700">
            Dữ liệu ẩn danh — chỉ phản ánh loại lỗi, thủ tục và thời điểm. Không chứa thông tin cá nhân.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="mb-4">Top lỗi thường gặp</h2>
          {data?.topErrors && <TopErrorsChart data={data.topErrors} />}
        </div>
        <div className="card">
          <h2 className="mb-4">Xu hướng theo ngày</h2>
          <TrendLine data={trend as Array<{ _id: string; count: number; avgScore: number }>} />
        </div>
      </div>

      {data && (
        <div className="card mt-6">
          <p className="text-gray-500 text-sm">
            Điểm trung bình hồ sơ: <strong>{Math.round(data.avgScore)}/100</strong>
          </p>
        </div>
      )}
    </main>
  );
}
