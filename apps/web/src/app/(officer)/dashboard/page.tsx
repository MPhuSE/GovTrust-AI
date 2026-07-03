'use client';

import { useEffect, useState } from 'react';
import { insightsApi } from '@/lib/api-client';
import { OfficerLayout } from '@/components/layout/OfficerLayout';
import { TopErrorsChart } from '@/components/dashboard/TopErrorsChart';
import { TrendLine } from '@/components/dashboard/TrendLine';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { StatCard } from '@/components/dashboard/StatCard';
import { HeatMapChart } from '@/components/dashboard/HeatMapChart';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface DashboardData {
  totalSessions: number;
  totalSessionsChange?: string;
  avgScore: number;
  avgScoreChange?: string;
  passRate: number;
  passRateChange?: string;
  topError?: { errorType: string; percentage: number };
  topErrors: Array<{ errorType: string; count: number; avgScore: number }>;
  procedureStats?: unknown[];
  heatmap?: { data: number[][]; xLabels: string[]; yLabels: string[] };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [trend, setTrend] = useState<Array<{ _id: string; count: number; avgScore: number }>>([]);
  const [days, setDays] = useState(7);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([insightsApi.dashboard(days), insightsApi.trend(days)])
      .then(([dash, trendData]) => {
        setData((dash as unknown) as DashboardData);
        setTrend(((trendData as unknown) as Array<{ _id: string; count: number; avgScore: number }>) || []);
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard data:', err);
        setData(null);
        setTrend([]);
      })
      .finally(() => setIsLoading(false));
  }, [days]);

  if (isLoading) {
    return (
      <OfficerLayout>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} variant="card" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="card" />
          </div>
        </div>
      </OfficerLayout>
    );
  }

  return (
    <OfficerLayout>
      <div className="p-6 sm:p-8 animate-fade-in">
        {/* Premium Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-8 sm:px-10 mb-8 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 shadow-sm relative overflow-hidden">
          {/* Subtle gradient background element */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-emerald-300/10 rounded-full blur-[60px] -mb-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                Bảng điều khiển InsightMap
              </h1>
              <p className="text-sm text-gray-500 mt-1.5 font-medium flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Tổng quan dữ liệu hoạt động hệ thống AI thời gian thực
              </p>
            </div>
            <div className="bg-gray-50/80 p-1.5 rounded border border-gray-100 -sm shadow-sm inline-flex">
              <FilterBar days={days} onChange={setDays} />
            </div>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded p-3.5 mb-8 text-sm text-emerald-800 flex items-center gap-3 shadow-sm">
          <div className="bg-emerald-100/50 p-1.5 rounded-lg shrink-0">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-medium">Dữ liệu ẩn danh</span> — chỉ phản ánh loại lỗi, thủ tục và thời điểm. Không chứa thông tin định danh cá nhân.
        </div>

        {/* Stat Cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Tổng số hồ sơ"
              value={data.totalSessions || 0}
              change={data.totalSessionsChange || 'Chưa có dữ liệu'}
              changeType="up"
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <StatCard
              title="Điểm trung bình"
              value={`${Math.round(data.avgScore || 0)}/100`}
              change={data.avgScoreChange || 'Chưa có dữ liệu'}
              changeType="up"
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
            <StatCard
              title="Tỷ lệ đạt"
              value={`${data.passRate || 0}%`}
              change={data.passRateChange || 'Chưa có dữ liệu'}
              changeType="up"
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              title="Lỗi phổ biến nhất"
              value={data.topError?.errorType || 'Chưa có lỗi'}
              change={data.topError?.percentage ? `Chiếm ${data.topError.percentage}% tổng số lỗi` : 'Đang thu thập dữ liệu'}
              changeType="neutral"
              variant="alert"
              icon={<svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Top 5 Lỗi Thường Gặp</h2>
            </div>
            {data?.topErrors && <TopErrorsChart data={data.topErrors} />}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Xu Hướng Tuần</h2>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-emerald-600 rounded" /> Điểm
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-gray-400 rounded" /> Lượng HS
                </span>
              </div>
            </div>
            <TrendLine data={trend} />
          </div>
        </div>

        {/* Heatmap */}
        {data?.heatmap && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Bản Đồ Nhiệt: Dịch Vụ Công vs Loại Lỗi</h2>
              <button className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1">
                Xuất báo cáo
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
            <HeatMapChart
              data={data.heatmap.data}
              xLabels={data.heatmap.xLabels}
              yLabels={data.heatmap.yLabels}
            />
          </div>
        )}
      </div>
    </OfficerLayout>
  );
}
