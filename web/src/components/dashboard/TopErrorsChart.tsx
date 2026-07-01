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
    </ResponsiveContainer>
  );
}
