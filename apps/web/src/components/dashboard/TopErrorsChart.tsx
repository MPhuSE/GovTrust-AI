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

// Rút gọn nhãn dài để không đè lên nhau trên trục Y.
function shorten(label: string, max = 34): string {
  if (label.length <= max) return label;
  return label.slice(0, max - 1).trimEnd() + '…';
}

// Tick tùy biến: cắt ngắn + tooltip đầy đủ khi hover (title trên <text>).
function YAxisTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const full = payload?.value ?? '';
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="#475569">
      <title>{full}</title>
      {shorten(full)}
    </text>
  );
}

interface Props {
  data: Array<{ errorType: string; count: number; avgScore: number }>;
}

export function TopErrorsChart({ data }: Props) {
  // Chỉ lấy Top 5 (đúng tiêu đề); backend có thể trả nhiều hơn.
  const chartData = data
    .slice(0, 5)
    .map(d => ({
      name: ERROR_LABELS[d.errorType] ?? d.errorType,
      count: d.count,
    }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 56)}>
      {chartData.length > 0 ? (
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={220}
            interval={0}
            tick={<YAxisTick />}
          />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium">Chưa có dữ liệu lỗi</span>
        </div>
      )}
    </ResponsiveContainer>
  );
}
