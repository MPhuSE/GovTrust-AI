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
        {/* Enterprise Professional Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-600 tracking-wider uppercase">Giám sát hệ thống</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
              Tổng quan InsightsMap
            </h1>
            
            <p className="text-sm text-gray-500 font-medium">
              Phân tích hiệu suất xử lý hồ sơ, tỷ lệ lỗi và thống kê chất lượng thời gian thực.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <FilterBar days={days} onChange={setDays} />
          </div>
        </div>

        {/* Subtle Privacy notice */}
        <div className="flex items-center gap-2 mb-6 px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-md text-xs text-slate-600">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Dữ liệu báo cáo đã được <strong>ẩn danh hoàn toàn</strong> theo chuẩn an toàn thông tin PII.</span>
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
          <div className="bg-white rounded-xl border border-gray-200/75 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Top 5 Lỗi Thường Gặp</h2>
            </div>
            <div className="flex-1">
              {data?.topErrors && <TopErrorsChart data={data.topErrors} />}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/75 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Xu Hướng Tuần</h2>
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Điểm trung bình
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gray-300" /> Lượng hồ sơ
                </span>
              </div>
            </div>
            <div className="flex-1">
              <TrendLine data={trend} />
            </div>
          </div>
        </div>

        {/* Heatmap */}
        {data?.heatmap && (
          <div className="bg-white rounded-xl border border-gray-200/75 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Bản Đồ Nhiệt: Lĩnh Vực vs Loại Lỗi</h2>
              <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Xuất báo cáo
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
