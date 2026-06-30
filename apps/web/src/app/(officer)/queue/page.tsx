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
  AI_DONE: { label: 'AI đã kiểm', cls: 'badge-info' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'badge-success' },
  RECHECKED: { label: 'Đã tái kiểm', cls: 'badge-success' },
  PENDING: { label: 'Đang xử lý', cls: 'badge-warning' },
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
      .catch(() => {
        // Demo data
        setQueue([
          { _id: '1', procedureName: 'Đăng ký khai sinh', score: 72, priority: 'B', status: 'AI_DONE', createdAt: new Date().toISOString(), citizenName: 'Nguyễn Thị H.' },
          { _id: '2', procedureName: 'Cấp đổi CCCD', score: 45, priority: 'A', status: 'CONFIRMED', createdAt: new Date().toISOString(), citizenName: 'Trần Văn K.' },
          { _id: '3', procedureName: 'Đăng ký tạm trú', score: 88, priority: 'C', status: 'AI_DONE', createdAt: new Date().toISOString(), citizenName: 'Lê Thị M.' },
          { _id: '4', procedureName: 'Chứng thực bản sao', score: 95, priority: 'D', status: 'RECHECKED', createdAt: new Date().toISOString(), citizenName: 'Phạm Văn N.' },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = filterPriority === 'ALL' ? queue : queue.filter((q) => q.priority === filterPriority);

  return (
    <OfficerLayout>
      <div className="p-6 sm:p-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Danh sách hồ sơ</h1>
            <p className="text-sm text-gray-500">Hồ sơ xếp theo mức ưu tiên và SLA</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {['ALL', 'A', 'B', 'C', 'D'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                  filterPriority === p
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {p === 'ALL' ? 'Tất cả' : `Ưu tiên ${p}`}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} variant="table-row" />
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mã HS</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Thủ tục</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Công dân</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Điểm</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Ưu tiên</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const statusConfig = STATUS_LABELS[item.status] || { label: item.status, cls: 'badge' };
                  return (
                    <tr
                      key={item._id}
                      className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/recheck/${item._id}`)}
                    >
                      <td className="px-4 py-3 font-mono-num text-gray-500 text-xs">
                        #{item._id.slice(-6)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.procedureName}</td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {item.citizenName || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-bold tabular-nums ${
                            item.score >= 80
                              ? 'text-green-600'
                              : item.score >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {item.score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PriorityBadge level={item.priority} />
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className={statusConfig.cls}>{statusConfig.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Xem →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">Không có hồ sơ nào phù hợp bộ lọc.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </OfficerLayout>
  );
}
