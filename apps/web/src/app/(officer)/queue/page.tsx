'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { priorityApi } from '@/lib/api-client';
import { OfficerLayout } from '@/components/layout/OfficerLayout';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface QueueItem {
  _id: string;
  procedureName: string;
  score: number;
  priority: 'A' | 'B' | 'C' | 'D';
  status: string;
  createdAt: string;
  citizenName?: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  AI_DONE: { label: 'AI đã duyệt', cls: 'bg-gray-50 text-emerald-700 border-teal-600' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  RECHECKED: { label: 'Đã tái kiểm', cls: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  PENDING: { label: 'Đang xử lý', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
};

export default function QueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  useEffect(() => {
    priorityApi
      .getQueue()
      .then((data) => setQueue(((data as unknown) as QueueItem[]) || []))
      .catch((err) => {
        console.error('Failed to fetch queue:', err);
        setQueue([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = filterPriority === 'ALL' ? queue : queue.filter((q) => q.priority === filterPriority);

  return (
    <OfficerLayout>
      <div className="p-6 sm:p-10 max-w-7xl mx-auto animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-700 mb-2 tracking-tight">Hàng đợi xử lý hồ sơ</h1>
            <p className="text-sm font-medium text-gray-500">Tự động phân loại và ưu tiên hóa bởi GovTrust AI</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded border border-gray-100 shadow-sm w-max">
            {['ALL', 'A', 'B', 'C', 'D'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-4 py-2 text-sm rounded-lg font-bold transition-all duration-300 ${
                  filterPriority === p
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'bg-transparent text-gray-500 hover:text-teal-700 hover:bg-gray-50'
                }`}
              >
                {p === 'ALL' ? 'Tất cả' : `Nhóm ${p}`}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} variant="table-row" className="rounded-md" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-md border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Mã HS</th>
                    <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Thủ tục</th>
                    <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs hidden sm:table-cell">Công dân</th>
                    <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Điểm AI</th>
                    <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Mức độ</th>
                    <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs text-center hidden md:table-cell">Trạng thái</th>
                    <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((item) => {
                    const statusConfig = STATUS_LABELS[item.status] || { label: item.status, cls: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-gray-50/30 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/recheck/${item._id}`)}
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                            #{item._id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-teal-700">{item.procedureName}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                              {item.citizenName?.charAt(0) || '?'}
                            </div>
                            {item.citizenName || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`font-extrabold inline-block tabular-nums ${
                              item.score >= 80
                                ? 'text-teal-600'
                                : item.score >= 60
                                ? 'text-amber-500'
                                : 'text-red-500'
                            }`}
                          >
                            {item.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <PriorityBadge level={item.priority} />
                        </td>
                        <td className="px-6 py-4 text-center hidden md:table-cell">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusConfig.cls}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-teal-700 group-hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl opacity-50">📂</span>
                  </div>
                  <p className="text-gray-500 font-medium">Không có hồ sơ nào phù hợp bộ lọc hiện tại.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </OfficerLayout>
  );
}
