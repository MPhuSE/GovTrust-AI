'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ERROR_LABELS: Record<string, string> = {
  MISSING_DOC: 'Thiếu giấy tờ',
  INFO_MISMATCH: 'Thông tin không khớp',
  EXPIRED_DOC: 'Giấy tờ hết hạn',
  LOW_QUALITY_IMG: 'Ảnh kém chất lượng',
  LIVENESS_FAIL: 'Lỗi xác thực giấy tờ',
};

const COLORS = ['#dc2626', '#d97706', '#ca8a04', '#16a34a', '#2563eb'];

interface Props {
  data: Array<{ errorType: string; count: number; avgScore: number }>;
}

export function TopErrorsChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: ERROR_LABELS[d.errorType] ?? d.errorType,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      {chartData.length > 0 ? (
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 10.5b0 0-7.5 7.5-7.5 7.5-7.5-7.5-7.5-7.5m15 0a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
          </svg>
          <span className="text-sm font-medium">Chưa có dữ liệu lỗi</span>
        </div>
      )}
    </ResponsiveContainer>
  );
}
